// Records a short sample of every agent voice with the same Live model the calls use, so a preview
// sounds exactly like the call (the TTS model's take on a voice name differs slightly).
//
//   GEMINI_API_KEY=… node scripts/generate-voice-samples.ts [Voice…]
//
// Writes public/voices/<Voice>.mp3, trimmed and loudness-normalised with ffmpeg.
// Re-run after adding voices to VOICES in lib/agents/voices.ts.

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GoogleGenAI, Modality, type LiveServerMessage, type Session } from "@google/genai";
import { VOICES } from "../lib/agents/voices.ts";

const MODEL = "gemini-3.8-live";
const LINE = "Hi! I'm your Callio agent. This is how I'll sound when we talk.";

const key = process.env.GEMINI_API_KEY;
if (!key) throw new Error("Set GEMINI_API_KEY");
const ai = new GoogleGenAI({ apiKey: key });
const only = process.argv.slice(2);
const dir = join("public", "voices");
mkdirSync(dir, { recursive: true });

async function record(voice: string): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let session: Session | undefined;
  let ready = false;
  const say = () =>
    session!.sendClientContent({ turns: [{ role: "user", parts: [{ text: LINE }] }], turnComplete: true });
  await new Promise<void>(async (resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${voice}: timed out`)), 30_000);
    session = await ai.live.connect({
      model: MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: "Read the user's message aloud exactly as written, warmly and naturally. Say nothing else.",
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      },
      callbacks: {
        onmessage: (m: LiveServerMessage) => {
          if (m.setupComplete) {
            ready = true;
            if (session) say();
          }
          for (const p of m.serverContent?.modelTurn?.parts ?? []) {
            if (p.inlineData?.data) chunks.push(Buffer.from(p.inlineData.data, "base64"));
          }
          if (m.serverContent?.turnComplete) {
            clearTimeout(timer);
            session?.close();
            resolve();
          }
        },
        onerror: (e) => reject(new Error(`${voice}: ${e.message}`)),
      },
    });
    if (ready && !chunks.length) say();
  });
  return Buffer.concat(chunks);
}

for (const { id } of VOICES.filter((v) => !only.length || only.includes(v.id))) {
  const pcm = await record(id);
  const raw = join(dir, `${id}.pcm`);
  writeFileSync(raw, pcm);
  // 24 kHz mono PCM16 → trimmed, normalised MP3.
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", raw,
    "-af",
    "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-16:TP=-1.5:LRA=11",
    "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "96k", join(dir, `${id}.mp3`),
  ]);
  rmSync(raw);
  console.log(`${id}: ${(pcm.length / 48000).toFixed(1)} s`);
}
