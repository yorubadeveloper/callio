// Gapless playback of the agent's 24 kHz PCM16 audio.
// Post an ArrayBuffer to queue audio, or "flush" to drop everything when the caller interrupts.
// Posts { playing } whenever playback starts or stops, so the UI knows who's talking.
class PlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.queue = [];
    this.offset = 0;
    this.playing = false;
    this.port.onmessage = (e) => {
      if (e.data === "flush") {
        this.queue = [];
        this.offset = 0;
        return;
      }
      const pcm = new Int16Array(e.data);
      const samples = new Float32Array(pcm.length);
      for (let i = 0; i < pcm.length; i++) samples[i] = pcm[i] / 0x8000;
      this.queue.push(samples);
    };
  }

  process(_inputs, outputs) {
    const out = outputs[0][0];
    let i = 0;
    while (i < out.length && this.queue.length) {
      const current = this.queue[0];
      const n = Math.min(out.length - i, current.length - this.offset);
      out.set(current.subarray(this.offset, this.offset + n), i);
      i += n;
      this.offset += n;
      if (this.offset >= current.length) {
        this.queue.shift();
        this.offset = 0;
      }
    }
    out.fill(0, i);
    const playing = i > 0;
    if (playing !== this.playing) {
      this.playing = playing;
      this.port.postMessage({ playing });
    }
    return true;
  }
}

registerProcessor("playback-processor", PlaybackProcessor);
