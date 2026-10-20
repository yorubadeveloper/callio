// Mic → 16 kHz mono PCM16 in 20 ms chunks (320 samples), the format Gemini Live expects.
// Runs at the device's native rate (often 48 kHz) and resamples here, which avoids Firefox's
// sample-rate mismatch error on MediaStream sources. A 4th-order low-pass at 7 kHz removes what
// 16 kHz can't represent before resampling, so speech stays clean instead of aliasing into hiss.
const TARGET_RATE = 16000;
const CHUNK = 320;

function lowpass(fs, fc) {
  const w = (2 * Math.PI * fc) / fs;
  const cos = Math.cos(w);
  const alpha = Math.sin(w) / (2 * Math.SQRT1_2);
  const a0 = 1 + alpha;
  return { b0: (1 - cos) / 2 / a0, b1: (1 - cos) / a0, b2: (1 - cos) / 2 / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 };
}

class Biquad {
  constructor(c) {
    this.c = c;
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
  }
  run(x) {
    const { b0, b1, b2, a1, a2 } = this.c;
    const y = b0 * x + b1 * this.x1 + b2 * this.x2 - a1 * this.y1 - a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.step = sampleRate / TARGET_RATE;
    const coeffs = lowpass(sampleRate, Math.min(7000, sampleRate * 0.45));
    this.filters = this.step > 1 ? [new Biquad(coeffs), new Biquad(coeffs)] : [];
    this.t = this.step; // position of the next output sample, in input samples after `prev`
    this.prev = 0;
    this.chunk = new Int16Array(CHUNK);
    this.filled = 0;
  }

  emit(v) {
    const s = Math.max(-1, Math.min(1, v));
    this.chunk[this.filled++] = s < 0 ? s * 0x8000 : s * 0x7fff;
    if (this.filled === CHUNK) {
      this.port.postMessage(this.chunk.buffer, [this.chunk.buffer]);
      this.chunk = new Int16Array(CHUNK);
      this.filled = 0;
    }
  }

  process(inputs) {
    const input = inputs[0] && inputs[0][0];
    if (!input) return true;
    for (let i = 0; i < input.length; i++) {
      let y = input[i];
      for (const f of this.filters) y = f.run(y);
      // Linear interpolation between the previous and current filtered sample.
      while (this.t <= 1) {
        this.emit(this.prev + (y - this.prev) * this.t);
        this.t += this.step;
      }
      this.t -= 1;
      this.prev = y;
    }
    return true;
  }
}

registerProcessor("capture-processor", CaptureProcessor);
