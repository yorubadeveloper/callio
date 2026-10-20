// Gapless playback of the agent's 24 kHz PCM16 audio.
// Post an ArrayBuffer to queue audio, or "flush" to drop everything when the caller interrupts.
// Posts { playing } whenever playback starts or stops, so the UI knows who's talking.
// Starting and stopping ramp over ~3 ms, so network gaps and interruptions never click.
const RAMP = 64;
// Wait for 20 ms of audio before starting a turn (or 15 ms of waiting), so the first syllable isn't choppy.
const PREBUFFER = 480;
const MAX_WAIT_BLOCKS = 3;

class PlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.queue = [];
    this.queued = 0;
    this.offset = 0;
    this.playing = false;
    this.waited = 0;
    this.fadeIn = 0;
    this.port.onmessage = (e) => {
      if (e.data === "flush") {
        this.queue = [];
        this.queued = 0;
        this.offset = 0;
        return;
      }
      const pcm = new Int16Array(e.data);
      const samples = new Float32Array(pcm.length);
      for (let i = 0; i < pcm.length; i++) samples[i] = pcm[i] / 0x8000;
      this.queue.push(samples);
      this.queued += samples.length;
    };
  }

  process(_inputs, outputs) {
    const out = outputs[0][0];
    if (!this.playing && this.queued > 0 && this.queued < PREBUFFER && this.waited++ < MAX_WAIT_BLOCKS) {
      out.fill(0);
      return true;
    }
    let i = 0;
    while (i < out.length && this.queue.length) {
      const current = this.queue[0];
      const n = Math.min(out.length - i, current.length - this.offset);
      out.set(current.subarray(this.offset, this.offset + n), i);
      i += n;
      this.offset += n;
      this.queued -= n;
      if (this.offset >= current.length) {
        this.queue.shift();
        this.offset = 0;
      }
    }
    if (i > 0 && !this.playing) this.fadeIn = RAMP;
    // Ramp in after silence.
    for (let k = 0; this.fadeIn > 0 && k < i; k++, this.fadeIn--) out[k] *= 1 - this.fadeIn / RAMP;
    // Ran dry mid-block: ramp the tail down instead of cutting to zero.
    if (i > 0 && i < out.length) {
      const n = Math.min(RAMP, i);
      for (let k = 0; k < n; k++) out[i - n + k] *= 1 - (k + 1) / n;
    }
    out.fill(0, i);
    const playing = i > 0;
    if (!playing) this.waited = 0;
    if (playing !== this.playing) {
      this.playing = playing;
      this.port.postMessage({ playing });
    }
    return true;
  }
}

registerProcessor("playback-processor", PlaybackProcessor);
