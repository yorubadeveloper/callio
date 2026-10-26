// The call in progress, held outside React so it carries on while the person looks around the app (the shell shows
// a "Back to call" bar). Only one call at a time: starting another hangs up the first.

import { haptic } from "@/lib/haptics";
import { createPresence, type Presence } from "./presence";
import type { CallEngine, CallSnapshot } from "./types";

export interface ActiveCall {
  agentId: string;
  name: string;
  engine: CallEngine;
}

let current: (ActiveCall & { presence: Presence; unsubscribe: () => void }) | null = null;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((l) => l());

export const activeCall = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: (): ActiveCall | null => current,
};

const inCall = (snap: CallSnapshot) => snap.status === "connecting" || snap.status === "live";

/** The engine for this agent's call screen: the call already going on with them, or a fresh one. */
export function engineFor(agentId: string, create: () => CallEngine): CallEngine {
  if (current?.agentId === agentId && inCall(current.engine.getSnapshot())) return current.engine;
  return create();
}

/** Starts a call. Run it straight from the tap: the lock-screen card and iOS audio need the gesture. */
export function startCall({ agentId, name, engine }: ActiveCall) {
  haptic("tap");
  if (current && current.engine !== engine) {
    const previous = current.engine;
    release();
    previous.end();
  }
  if (!current) {
    const presence = createPresence({
      name,
      onMute: (muted) => engine.setMuted(muted),
      onHangUp: () => engine.end(),
    });
    presence.begin();
    let last = engine.getSnapshot();
    const unsubscribe = engine.subscribe((snap) => {
      presence.update(snap);
      feel(last, snap);
      last = snap;
      if (!inCall(snap) && snap.status !== "idle") release();
    });
    current = { agentId, name, engine, presence, unsubscribe };
    changed();
  }
  void engine.start();
}

function release() {
  if (!current) return;
  current.unsubscribe();
  current.presence.end();
  current = null;
  changed();
}

/** Buzzes for what happens on its own: connecting, the answer after the agent worked on something, a dropped call. */
function feel(before: CallSnapshot, now: CallSnapshot) {
  if (before.status !== "live" && now.status === "live") haptic("success");
  else if (inCall(before) && now.status === "error") haptic("warning");
  else if (inCall(before) && now.status === "ended") haptic("end");
  else if (before.activity === "thinking" && now.activity === "speaking") haptic("nudge");
  const finished = now.actions.filter((a) => a.state !== "running").length;
  if (finished > before.actions.filter((a) => a.state !== "running").length) haptic("nudge");
}
