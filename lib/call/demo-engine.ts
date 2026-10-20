import { createSnapshotStore } from "./store";
import type { CallAction, CallEngine, Caption } from "./types";

type Step =
  | { at: number; say: Caption["who"]; text: string }
  | { at: number; action: Omit<CallAction, "id" | "state">; doneAfter: number };

// A scripted call for designing the screen and for the landing-page demo.
// No audio leaves the device; levels are synthesised from who is "speaking".
const SCRIPT: Step[] = [
  { at: 900, say: "agent", text: "Morning! Three meetings today. Your 10 o'clock moved to 11." },
  { at: 4200, say: "agent", text: "And it'll rain after four, so take the umbrella." },
  { at: 7200, say: "you", text: "Can you push my 3pm to tomorrow and let Dana know?" },
  { at: 10200, action: { label: "Moving your 3pm to tomorrow", kind: "calendar" }, doneAfter: 1600 },
  { at: 12000, say: "agent", text: "Done. It's Thursday at 3, and I've let Dana know." },
  { at: 15200, say: "you", text: "Great. Keep Mondays short from now on." },
  { at: 17600, action: { label: "Remembered: short briefings on Mondays", kind: "memory" }, doneAfter: 500 },
  { at: 18400, say: "agent", text: "Got it. Short Mondays from now on. Anything else?" },
];

const WORDS_PER_MS = 1 / 260;

export function createDemoEngine(): CallEngine {
  const store = createSnapshotStore();
  const timers: ReturnType<typeof setTimeout>[] = [];
  let speaking: Caption["who"] | null = null;
  let speakingUntil = 0;
  let n = 0;

  const say = (who: Caption["who"], text: string) => {
    const id = `c${n++}`;
    const words = text.split(" ");
    speaking = who;
    speakingUntil = performance.now() + words.length / WORDS_PER_MS;
    store.set((s) => ({
      activity: who === "agent" ? "speaking" : "listening",
      captions: [...s.captions, { id, who, text: "", final: false }],
    }));
    words.forEach((_, i) =>
      timers.push(
        setTimeout(() => {
          const final = i === words.length - 1;
          store.set((s) => ({
            captions: s.captions.map((c) => (c.id === id ? { ...c, text: words.slice(0, i + 1).join(" "), final } : c)),
            activity: final ? "listening" : s.activity,
          }));
        }, i / WORDS_PER_MS),
      ),
    );
  };

  const level = (who: Caption["who"]) => {
    if (speaking !== who || performance.now() > speakingUntil) return 0;
    const t = performance.now() / 1000;
    return 0.35 + 0.35 * Math.abs(Math.sin(t * 9)) * Math.abs(Math.sin(t * 2.3 + 1));
  };

  return {
    levels: { agent: () => level("agent"), you: () => (store.get().muted ? 0 : level("you")) },
    subscribe: store.subscribe,
    getSnapshot: store.get,
    async start() {
      store.set({ status: "connecting", captions: [], actions: [], startedAt: null, endedAt: null });
      timers.push(
        setTimeout(() => {
          store.set({ status: "live", startedAt: Date.now() });
          for (const step of SCRIPT) {
            if ("say" in step) {
              timers.push(setTimeout(() => say(step.say, step.text), step.at));
            } else {
              const id = `a${n++}`;
              timers.push(
                setTimeout(() => {
                  store.set((s) => ({
                    activity: "thinking",
                    actions: [...s.actions, { ...step.action, id, state: "running" }],
                  }));
                }, step.at),
                setTimeout(() => {
                  store.set((s) => ({ actions: s.actions.map((a) => (a.id === id ? { ...a, state: "done" } : a)) }));
                }, step.at + step.doneAfter),
              );
            }
          }
        }, 1800),
      );
    },
    end() {
      timers.forEach(clearTimeout);
      speaking = null;
      store.set({ status: "ended", endedAt: Date.now(), activity: "listening" });
    },
    setMuted(muted) {
      store.set({ muted });
    },
  };
}
