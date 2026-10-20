// Voices people can pick for an agent (Gemini prebuilt voices). Each has a recorded sample in
// public/voices/<id>.mp3 (scripts/generate-voice-samples.ts). No imports, so scripts can load it directly.

export const VOICES = [
  { id: "Aoede", hint: "Breezy", pitch: "higher" },
  { id: "Kore", hint: "Firm", pitch: "higher" },
  { id: "Leda", hint: "Youthful", pitch: "higher" },
  { id: "Zephyr", hint: "Bright", pitch: "higher" },
  { id: "Sulafat", hint: "Warm", pitch: "higher" },
  { id: "Achernar", hint: "Soft", pitch: "higher" },
  { id: "Vindemiatrix", hint: "Gentle", pitch: "higher" },
  { id: "Despina", hint: "Smooth", pitch: "higher" },
  { id: "Puck", hint: "Upbeat", pitch: "deeper" },
  { id: "Orus", hint: "Firm", pitch: "deeper" },
  { id: "Charon", hint: "Informative", pitch: "deeper" },
  { id: "Fenrir", hint: "Excitable", pitch: "deeper" },
  { id: "Achird", hint: "Friendly", pitch: "deeper" },
  { id: "Algieba", hint: "Smooth", pitch: "deeper" },
  { id: "Gacrux", hint: "Mature", pitch: "higher" },
  { id: "Sadachbia", hint: "Lively", pitch: "deeper" },
] as const;

export const voiceSample = (id: string) => `/voices/${id}.mp3`;
