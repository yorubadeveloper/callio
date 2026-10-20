export type CallStatus = "idle" | "connecting" | "live" | "ended" | "error";

/** What the agent is doing right now, for the status line under its name. */
export type AgentActivity = "listening" | "speaking" | "thinking";

export interface Caption {
  id: string;
  who: "you" | "agent";
  text: string;
  /** False while the transcription is still arriving. */
  final: boolean;
}

/** A visible step the agent took during the call: tool calls, memory saves, tasks. */
export interface CallAction {
  id: string;
  label: string;
  state: "running" | "done" | "failed";
  kind: "memory" | "calendar" | "schedule" | "search" | "task" | "recap" | "other";
}

export interface CallSnapshot {
  status: CallStatus;
  activity: AgentActivity;
  startedAt: number | null;
  endedAt: number | null;
  muted: boolean;
  captions: Caption[];
  actions: CallAction[];
  error?: string;
}

/** Live audio levels, 0–1, read every animation frame rather than through React state. */
export interface LevelSource {
  agent(): number;
  you(): number;
}

/**
 * The call screen talks to an engine through this interface, so the UI is the
 * same whether the audio goes to Gemini Live in the browser, a phone bridge, or
 * the scripted demo.
 */
export interface CallEngine {
  start(): Promise<void>;
  end(): void;
  setMuted(muted: boolean): void;
  levels: LevelSource;
  subscribe(listener: (snapshot: CallSnapshot) => void): () => void;
  getSnapshot(): CallSnapshot;
}

export const initialSnapshot: CallSnapshot = {
  status: "idle",
  activity: "listening",
  startedAt: null,
  endedAt: null,
  muted: false,
  captions: [],
  actions: [],
};
