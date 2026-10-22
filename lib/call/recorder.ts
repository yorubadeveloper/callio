// Both sides of an in-app call on one 16 kHz mono timeline, kept in memory for a proper transcript afterwards.
// Gemini Live's own captions come from a light side-channel recogniser; once the call ends we upload this to the
// backend, which transcribes it with a full model, replaces the captions and drops the audio.

const RATE = 16000;
const MAX_SECONDS = 15 * 60; // the backend takes up to 15 minutes; longer calls keep their live captions

export interface CallRecorder {
  /** 16 kHz PCM16 from the mic, as it's captured. */
  mic(chunk: ArrayBuffer): void;
  /** 24 kHz PCM16 from Live, queued for playback right after what's already queued. */
  agent(chunk: ArrayBuffer): void;
  /** The agent was interrupted: playback was flushed, so its queue restarts at now. */
  flush(): void;
  /** A WAV of the call, or null when there's nothing worth sending (or it ran past the limit). */
  wav(): Blob | null;
}

export function createRecorder(): CallRecorder {
  let buf = new Int16Array(RATE * 60);
  let length = 0;
  let overflow = false;
  const started = performance.now();
  let agentAt = 0; // sample where the next agent audio starts

  const now = () => Math.floor(((performance.now() - started) / 1000) * RATE);

  const ensure = (end: number) => {
    if (end > MAX_SECONDS * RATE) {
      overflow = true;
      return false;
    }
    if (end > buf.length) {
      const next = new Int16Array(Math.min(MAX_SECONDS * RATE, Math.max(end, buf.length * 2)));
      next.set(buf);
      buf = next;
    }
    length = Math.max(length, end);
    return true;
  };

  const mix = (at: number, samples: Int16Array | Float32Array) => {
    if (overflow || !ensure(at + samples.length)) return;
    for (let i = 0; i < samples.length; i++) {
      const v = buf[at + i] + samples[i];
      buf[at + i] = v > 32767 ? 32767 : v < -32768 ? -32768 : v;
    }
  };

  return {
    mic(chunk) {
      const samples = new Int16Array(chunk);
      mix(Math.max(0, now() - samples.length), samples);
    },
    agent(chunk) {
      const src = new Int16Array(chunk);
      // 24 kHz → 16 kHz: two output samples for every three in, linearly interpolated.
      const out = new Float32Array(Math.floor((src.length * 2) / 3));
      for (let i = 0; i < out.length; i++) {
        const pos = i * 1.5;
        const j = Math.floor(pos);
        const f = pos - j;
        out[i] = src[j] * (1 - f) + (src[j + 1] ?? src[j]) * f;
      }
      const at = Math.max(agentAt, now());
      mix(at, out);
      agentAt = at + out.length;
    },
    flush() {
      agentAt = now();
    },
    wav() {
      if (overflow || length < RATE * 2) return null;
      const header = new DataView(new ArrayBuffer(44));
      const bytes = length * 2;
      const text = (o: number, s: string) => [...s].forEach((c, i) => header.setUint8(o + i, c.charCodeAt(0)));
      text(0, "RIFF");
      header.setUint32(4, 36 + bytes, true);
      text(8, "WAVE");
      text(12, "fmt ");
      header.setUint32(16, 16, true);
      header.setUint16(20, 1, true); // PCM
      header.setUint16(22, 1, true); // mono
      header.setUint32(24, RATE, true);
      header.setUint32(28, RATE * 2, true);
      header.setUint16(32, 2, true);
      header.setUint16(34, 16, true);
      text(36, "data");
      header.setUint32(40, bytes, true);
      return new Blob([header.buffer, buf.slice(0, length).buffer], { type: "audio/wav" });
    },
  };
}
