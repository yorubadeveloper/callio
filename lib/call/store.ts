import { initialSnapshot, type CallSnapshot } from "./types";

/** Tiny observable snapshot holder shared by the engines; pairs with useSyncExternalStore. */
export function createSnapshotStore() {
  let snapshot: CallSnapshot = initialSnapshot;
  const listeners = new Set<(s: CallSnapshot) => void>();
  return {
    get: () => snapshot,
    set(patch: Partial<CallSnapshot> | ((s: CallSnapshot) => Partial<CallSnapshot>)) {
      snapshot = { ...snapshot, ...(typeof patch === "function" ? patch(snapshot) : patch) };
      listeners.forEach((l) => l(snapshot));
    },
    subscribe(listener: (s: CallSnapshot) => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
