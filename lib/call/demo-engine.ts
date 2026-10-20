import { EARPIECE_GAIN, listOutputs, routeTo } from "./audio-out";
import { demoScript, type DemoStep } from "./demo-scripts";
import { createSnapshotStore } from "./store";
import type { CallEngine, Caption } from "./types";

// A pre-recorded sample call for visitors who haven't signed up. Real voices
// (Gemini TTS, see scripts/generate-demo-audio.ts), a synthesised ringback,
// captions timed to each line, and levels read from the actual audio.

const GAP_MS = 280;

export function createDemoEngine(template = "laura"): CallEngine {
  const script = demoScript(template);
  const store = createSnapshotStore();
  const levelBuf = new Float32Array(1024);

  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let analyser: AnalyserNode | null = null;
  let speaking: Caption["who"] | null = null;
  let run = 0; // bumps on every start/end so stale async steps stop
  let current: AudioBufferSourceNode | null = null;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let captionSeq = 0;

  const wait = (ms: number, token: number) =>
    new Promise<boolean>((resolve) => {
      const t = setTimeout(() => {
        timers.delete(t);
        resolve(token === run);
      }, ms);
      timers.add(t);
    });

  const level = (who: Caption["who"]) => {
    if (speaking !== who || !analyser) return 0;
    analyser.getFloatTimeDomainData(levelBuf);
    let sum = 0;
    for (let i = 0; i < levelBuf.length; i++) sum += levelBuf[i] * levelBuf[i];
    return Math.min(1, Math.sqrt(sum / levelBuf.length) * 4);
  };

  /** Two short "brr-brr" rings, the way a call sounds before it's answered. */
  const ringback = (at: number) => {
    if (!ctx || !master) return;
    for (const start of [0, 0.6, 2.0, 2.6]) {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, at + start);
      gain.gain.linearRampToValueAtTime(0.06, at + start + 0.02);
      gain.gain.setValueAtTime(0.06, at + start + 0.38);
      gain.gain.linearRampToValueAtTime(0, at + start + 0.4);
      gain.connect(master);
      for (const freq of [400, 450]) {
        const osc = ctx.createOscillator();
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start(at + start);
        osc.stop(at + start + 0.42);
      }
    }
  };

  const tone = (freq: number, at: number, length: number, volume = 0.07) => {
    if (!ctx || !master) return;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.01);
    gain.gain.setValueAtTime(volume, at + length - 0.02);
    gain.gain.linearRampToValueAtTime(0, at + length);
    gain.connect(master);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start(at);
    osc.stop(at + length);
  };

  const play = (buffer: AudioBuffer, volume: number) =>
    new Promise<void>((resolve) => {
      if (!ctx || !master) return resolve();
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.value = volume;
      src.buffer = buffer;
      src.connect(gain).connect(master);
      src.onended = () => resolve();
      current = src;
      src.start();
    });

  const say = async (who: Caption["who"], text: string, buffer: AudioBuffer, token: number) => {
    const id = `c${captionSeq++}`;
    const words = text.split(" ");
    speaking = who;
    store.set((s) => ({
      activity: who === "agent" ? "speaking" : "listening",
      captions: [...s.captions, { id, who, text: "", final: false }],
    }));
    // Reveal words across the clip, slightly ahead of the voice like live captions.
    const perWord = (buffer.duration * 1000 * 0.92) / words.length;
    words.forEach((_, i) => {
      const t = setTimeout(() => {
        timers.delete(t);
        if (token !== run) return;
        store.set((s) => ({
          captions: s.captions.map((c) => (c.id === id ? { ...c, text: words.slice(0, i + 1).join(" ") } : c)),
        }));
      }, i * perWord);
      timers.add(t);
    });
    // Your own voice sounds a little closer and quieter than the agent's, as on a real call.
    await play(buffer, who === "you" ? 0.75 : 1);
    if (token !== run) return;
    speaking = null;
    store.set((s) => ({
      activity: "listening",
      captions: s.captions.map((c) => (c.id === id ? { ...c, text, final: true } : c)),
    }));
  };

  const act = async (step: Extract<DemoStep, { action: unknown }>, token: number) => {
    const id = `a${captionSeq++}`;
    store.set((s) => ({ activity: "thinking", actions: [...s.actions, { ...step.action, id, state: "running" }] }));
    if (!(await wait(step.doneAfter, token))) return;
    store.set((s) => ({
      activity: "listening",
      actions: s.actions.map((a) => (a.id === id ? { ...a, state: "done" } : a)),
    }));
  };

  const stopAudio = () => {
    timers.forEach(clearTimeout);
    timers.clear();
    try {
      current?.stop();
    } catch {}
    current = null;
    speaking = null;
  };

  const engine: CallEngine = {
    levels: { agent: () => level("agent"), you: () => (store.get().muted ? 0 : level("you")) },
    subscribe: store.subscribe,
    getSnapshot: store.get,

    async start() {
      const token = ++run;
      stopAudio();
      store.set({
        status: "connecting",
        activity: "listening",
        captions: [],
        actions: [],
        startedAt: null,
        endedAt: null,
      });

      // Create and unlock audio inside the tap, before any await (iOS Safari requires it).
      if (!ctx) {
        ctx = new AudioContext();
        master = ctx.createGain();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        master.connect(analyser).connect(ctx.destination);
      }
      void ctx.resume();
      master!.gain.value = store.get().speaker ? 1 : EARPIECE_GAIN;
      await routeTo(ctx, store.get().outputId).catch(() => undefined);

      ringback(ctx.currentTime + 0.1);
      const lines = script.steps.filter((s) => "say" in s);
      const buffers = await Promise.all(
        lines.map((_, i) =>
          fetch(`/demo/${script.template}/${i}.mp3`)
            .then((r) => r.arrayBuffer())
            .then((b) => ctx!.decodeAudioData(b)),
        ),
      ).catch(() => null);
      if (!(await wait(3200, token))) return;
      if (!buffers) {
        store.set({ status: "error", error: "Couldn't load the sample call. Check your connection and try again." });
        return;
      }

      // Picked up: a soft click, then the agent speaks.
      tone(1200, ctx.currentTime, 0.04, 0.05);
      store.set({ status: "live", startedAt: Date.now() });
      if (!(await wait(450, token))) return;

      let line = 0;
      for (const step of script.steps) {
        if (token !== run) return;
        if ("say" in step) {
          await say(step.say, step.text, buffers[line++], token);
          if (!(await wait(GAP_MS + (step.pause ?? 0), token))) return;
        } else {
          await act(step, token);
        }
      }
      // Goodbye said: the line drops with the usual three short tones.
      if (!(await wait(500, token)) || !ctx) return;
      const now = ctx.currentTime;
      [0, 0.18, 0.36].forEach((offset) => tone(480, now + offset, 0.12));
      if (!(await wait(650, token))) return;
      engine.end();
    },

    end() {
      run++;
      stopAudio();
      if (store.get().status === "ended") return;
      store.set({ status: store.get().startedAt ? "ended" : "idle", endedAt: Date.now(), activity: "listening" });
    },

    setMuted(muted) {
      store.set({ muted });
    },

    audio: {
      setSpeaker(on) {
        store.set({ speaker: on });
        if (master && ctx) master.gain.setTargetAtTime(on ? 1 : EARPIECE_GAIN, ctx.currentTime, 0.05);
      },
      listOutputs,
      async setOutput(id) {
        store.set({ outputId: id });
        await routeTo(ctx, id);
      },
    },
  };
  return engine;
}
