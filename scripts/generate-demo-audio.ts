// Records the demo-call voice lines with Gemini TTS.
//
//   GEMINI_API_KEY=… node scripts/generate-demo-audio.ts [template…]
//
// Writes public/demo/<template>/<index>.mp3 (one per spoken line), trimmed and
// loudness-normalised with ffmpeg. Re-run after editing lib/call/demo-scripts.ts.

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GoogleGenAI, Modality } from "@google/genai";
import { DEMO_SCRIPTS, spokenLines } from "../lib/call/demo-scripts.ts";

const MODEL = "gemini-3.8-flash-tts";
// Keep in sync with the persona voices in lib/agents/catalog.ts.
const AGENT_VOICES: Record<string, string> = { laura: "Aoede", maya: "Kore", theo: "Puck" };

const key = process.env.GEMINI_API_KEY;
if (!key) throw new Error("Set GEMINI_API_KEY");
const ai = new GoogleGenAI({ apiKey: key });

const only = process.argv.slice(2);
const scripts = Object.values(DEMO_SCRIPTS).filter((s) => !only.length || only.includes(s.template));

for (const script of scripts) {
  const dir = join("public", "demo", script.template);
  mkdirSync(dir, { recursive: true });
  const lines = spokenLines(script);
  for (const [i, line] of lines.entries()) {
    const voice = line.say === "agent" ? AGENT_VOICES[script.template] : script.youVoice;
    // This model reads prose instructions aloud; a leading [style] tag steers delivery silently.
    const prompt = line.style ? `[${line.style}] ${line.text}` : line.text;
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      },
    });
    const data = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData?.data;
    if (!data) throw new Error(`No audio for ${script.template} line ${i}`);
    const raw = join(dir, `${i}.wav`);
    writeFileSync(raw, Buffer.from(data, "base64"));
    // WAV (24 kHz mono) → trimmed, normalised MP3.
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", "-i", raw,
      "-af",
      "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-16:TP=-1.5:LRA=11",
      "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "96k", join(dir, `${i}.mp3`),
    ]);
    rmSync(raw);
    console.log(`${script.template} ${i} (${voice}): ${line.text}`);
  }
}
