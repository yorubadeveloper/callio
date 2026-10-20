// Mic → 16 kHz mono PCM16 in 20 ms chunks (320 samples), the format Gemini Live expects.
// Runs at the device's native rate (often 48 kHz on phones) and downsamples by averaging,
// which avoids Firefox's sample-rate mismatch error on MediaStream sources.
const TARGET_RATE = 16000;
const CHUNK = 320;

class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / TARGET_RATE;
    this.phase = 0;
    this.acc = 0;
    this.count = 0;
    this.chunk = new Int16Array(CHUNK);
    this.filled = 0;
  }

  process(inputs) {
    const input = inputs[0] && inputs[0][0];
    if (!input) return true;
    for (let i = 0; i < input.length; i++) {
      this.acc += input[i];
      this.count++;
      this.phase += 1;
      if (this.phase >= this.ratio) {
        this.phase -= this.ratio;
        const s = Math.max(-1, Math.min(1, this.acc / this.count));
        this.acc = 0;
        this.count = 0;
        this.chunk[this.filled++] = s < 0 ? s * 0x8000 : s * 0x7fff;
        if (this.filled === CHUNK) {
          this.port.postMessage(this.chunk.buffer, [this.chunk.buffer]);
          this.chunk = new Int16Array(CHUNK);
          this.filled = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor("capture-processor", CaptureProcessor);
