import type { CallAction } from "./types";

// Scripted sample calls for visitors who haven't signed up. Voice lines are
// pre-recorded with Gemini TTS (scripts/generate-demo-audio.mjs) into
// public/demo/<template>/<index>.mp3, one file per spoken line.

export type DemoStep =
  | { say: "agent" | "you"; text: string; /** Delivery note for the voice actor. */ style?: string; pause?: number }
  | { action: Omit<CallAction, "id" | "state">; doneAfter: number };

export interface DemoScript {
  template: string;
  /** Voice for the caller ("you"). The agent uses its own persona voice. */
  youVoice: string;
  steps: DemoStep[];
}

export const DEMO_SCRIPTS: Record<string, DemoScript> = {
  laura: {
    template: "laura",
    youVoice: "Iapetus",
    steps: [
      {
        say: "agent",
        text: "Morning! Three meetings today, and your ten o'clock moved to eleven.",
        style: "warm, upbeat, a little brisk",
      },
      { say: "agent", text: "Oh, and it'll rain after four, so take the umbrella.", style: "light and friendly" },
      {
        say: "you",
        text: "Thanks. Can you push my three o'clock to tomorrow and let Dana know?",
        style: "casual, relaxed",
      },
      { action: { label: "Moving your 3pm to tomorrow", kind: "calendar" }, doneAfter: 1400 },
      { say: "agent", text: "Done. It's Thursday at three, and I've let Dana know.", style: "confident, reassuring" },
      { say: "you", text: "Perfect. And keep Mondays short from now on.", style: "casual" },
      { action: { label: "Remembered: short briefings on Mondays", kind: "memory" }, doneAfter: 600 },
      { say: "agent", text: "Got it. Short Mondays from now on. Anything else?", style: "warm, smiling" },
      { say: "you", text: "That's all. Thanks, Laura.", style: "casual, friendly" },
      { say: "agent", text: "Have a lovely day!", style: "bright and warm", pause: 400 },
    ],
  },
  maya: {
    template: "maya",
    youVoice: "Iapetus",
    steps: [
      { say: "agent", text: "Hi! Your call with Dana starts in ten minutes.", style: "calm, focused" },
      {
        say: "agent",
        text: "Last time you promised her the new pricing deck. It's in your drafts.",
        style: "helpful, matter-of-fact",
      },
      { say: "you", text: "Ah, right. Can you move it to four instead? I need more time.", style: "a little rushed" },
      { action: { label: "Moving your call with Dana to 4pm", kind: "calendar" }, doneAfter: 1400 },
      { say: "agent", text: "Done. Four o'clock, and I've let Dana know.", style: "calm, confident" },
      { say: "agent", text: "Want me to call you at ten to four with the key points?", style: "friendly" },
      { say: "you", text: "Yes please.", style: "relieved" },
      { action: { label: "Call scheduled for 3:50pm", kind: "schedule" }, doneAfter: 800 },
      { say: "agent", text: "You're set. Talk soon!", style: "warm", pause: 400 },
    ],
  },
  theo: {
    template: "theo",
    youVoice: "Iapetus",
    steps: [
      { say: "agent", text: "Hey! Good news on the restaurant.", style: "upbeat, energetic" },
      {
        say: "agent",
        text: "I called Bella Napoli. Table for four, Friday at eight, under your name.",
        style: "pleased, clear",
      },
      { say: "you", text: "Amazing. Can you text me the address?", style: "happy, casual" },
      { action: { label: "Sending you a written recap", kind: "recap" }, doneAfter: 900 },
      { say: "agent", text: "Sent. They'll hold the table for fifteen minutes, so don't be late!", style: "playful" },
      { say: "you", text: "Ha. Noted. Thanks, Theo.", style: "laughing lightly" },
      { say: "agent", text: "Anytime. Enjoy dinner!", style: "warm", pause: 400 },
    ],
  },
};

export const demoScript = (template: string) => DEMO_SCRIPTS[template] ?? DEMO_SCRIPTS.laura;

/** Spoken lines in order; their index is the audio file name. */
export const spokenLines = (script: DemoScript) =>
  script.steps.filter((s): s is Extract<DemoStep, { say: string }> => "say" in s);
