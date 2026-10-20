import type { AudioOutput } from "./types";

// Shared phone-style output handling for the call engines.

/** Gain for the quieter, held-to-the-ear setting. */
export const EARPIECE_GAIN = 0.35;

type SinkContext = AudioContext & { setSinkId?: (id: string) => Promise<void> };

export const canPickOutput = () =>
  typeof window !== "undefined" &&
  typeof AudioContext !== "undefined" &&
  "setSinkId" in AudioContext.prototype &&
  Boolean(navigator.mediaDevices?.enumerateDevices);

export async function listOutputs(): Promise<AudioOutput[]> {
  if (!canPickOutput()) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  const outputs = devices.filter((d) => d.kind === "audiooutput");
  // Browsers hide device names until a page has had microphone access.
  return outputs.map((d, i) => ({
    id: d.deviceId,
    label: d.label || (d.deviceId === "default" ? "System default" : `Speaker ${i + 1}`),
  }));
}

export async function routeTo(ctx: AudioContext | null, id: string | null) {
  const sink = ctx as SinkContext | null;
  if (!sink?.setSinkId || id === null) return;
  await sink.setSinkId(id === "default" ? "" : id);
}
