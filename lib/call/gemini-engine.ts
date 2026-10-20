"use client";

import { GoogleGenAI, Modality, type FunctionCall, type LiveServerMessage, type Session } from "@google/genai";
import { TOOLS } from "@/lib/agents/tools";
import { createSnapshotStore } from "./store";
import type { CallEngine, Caption } from "./types";

interface Options {
  agentId: string;
  /** Why the call is happening, for calls the agent places. */
  purpose?: string;
}

interface SessionGrant {
  token: string;
  model: string;
  callId: string;
  /** Hang up after this long; the backend sets it from the credits left. */
  maxSeconds: number;
}

// Gemini Live straight from the browser: mic → 16 kHz PCM → Live, Live's 24 kHz
// audio → gapless playback. Our server only mints a locked, single-use token and
// runs tools, so the conversation itself never routes through us.
export function createGeminiEngine({ agentId, purpose }: Options): CallEngine {
  const store = createSnapshotStore();
  const levelBuf = new Float32Array(1024);

  let captureCtx: AudioContext | null = null;
  let playCtx: AudioContext | null = null;
  let stream: MediaStream | null = null;
  let player: AudioWorkletNode | null = null;
  let micAnalyser: AnalyserNode | null = null;
  let outAnalyser: AnalyserNode | null = null;
  let session: Session | null = null;
  let grant: SessionGrant | null = null;
  let ready = false;
  let hangUpAfterSpeech = false;
  let quietTimer: ReturnType<typeof setTimeout> | undefined;
  let limitTimer: ReturnType<typeof setTimeout> | undefined;
  let captionSeq = 0;
  const open: Partial<Record<Caption["who"], string>> = {};

  const rms = (a: AnalyserNode | null) => {
    if (!a) return 0;
    a.getFloatTimeDomainData(levelBuf);
    let sum = 0;
    for (let i = 0; i < levelBuf.length; i++) sum += levelBuf[i] * levelBuf[i];
    return Math.min(1, Math.sqrt(sum / levelBuf.length) * 5);
  };

  /** Appends transcription text to the speaker's open caption, or starts a new one. */
  const caption = (who: Caption["who"], text: string) => {
    const id = open[who];
    if (id) {
      store.set((s) => ({ captions: s.captions.map((c) => (c.id === id ? { ...c, text: c.text + text } : c)) }));
    } else {
      const newId = `c${captionSeq++}`;
      open[who] = newId;
      store.set((s) => ({ captions: [...s.captions, { id: newId, who, text: text.trimStart(), final: false }] }));
    }
  };
  const closeCaption = (who: Caption["who"]) => {
    const id = open[who];
    if (!id) return;
    delete open[who];
    store.set((s) => ({ captions: s.captions.map((c) => (c.id === id ? { ...c, final: true } : c)) }));
  };

  const finish = () => {
    if (store.get().status === "ended") return;
    clearTimeout(quietTimer);
    clearTimeout(limitTimer);
    ready = false;
    session?.close();
    session = null;
    stream?.getTracks().forEach((t) => t.stop());
    void captureCtx?.close();
    void playCtx?.close();
    captureCtx = playCtx = null;
    player = micAnalyser = outAnalyser = null;
    closeCaption("you");
    closeCaption("agent");

    const snap = store.get();
    store.set({ status: snap.status === "error" ? "error" : "ended", endedAt: Date.now(), activity: "listening" });
    if (grant) {
      void endOnServer(grant.callId, snap.captions);
      grant = null;
    }
  };

  const runFunction = async (fc: FunctionCall) => {
    const name = fc.name ?? "";
    const args = (fc.args ?? {}) as Record<string, unknown>;
    const meta = TOOLS[name];

    if (name === "end_call") {
      session?.sendToolResponse({ functionResponses: [{ id: fc.id, name, response: {} }] });
      // Let the goodbye finish playing before hanging up.
      hangUpAfterSpeech = true;
      if (store.get().activity !== "speaking") quietTimer = setTimeout(finish, 1200);
      return;
    }

    const actionId = fc.id ?? `t${captionSeq++}`;
    store.set((s) => ({
      activity: "thinking",
      actions: [
        ...s.actions,
        { id: actionId, label: meta?.label(args) ?? name, kind: meta?.kind ?? "other", state: "running" },
      ],
    }));
    const outcome = (await fetch(`/api/v1/calls/${grant?.callId}/tool`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, args }),
    })
      .then((r) => r.json())
      .catch(() => ({ ok: false, result: { error: "Couldn't reach Callio. Check the connection." } }))) as {
      ok: boolean;
      result: Record<string, unknown>;
    };
    store.set((s) => ({
      actions: s.actions.map((a) => (a.id === actionId ? { ...a, state: outcome.ok ? "done" : "failed" } : a)),
    }));
    session?.sendToolResponse({
      functionResponses: [{ id: fc.id, name, response: outcome.result, scheduling: meta?.scheduling }],
    });
  };

  // Live waits for input before speaking; nudge it to pick up like a person would.
  const greet = () =>
    session?.sendClientContent({
      turns: [{ role: "user", parts: [{ text: "(The call has just connected. Greet me now.)" }] }],
      turnComplete: true,
    });

  const onMessage = (m: LiveServerMessage) => {
    if (m.setupComplete) {
      ready = true;
      store.set({ status: "live", startedAt: Date.now() });
      limitTimer = setTimeout(finish, (grant?.maxSeconds ?? 60) * 1000);
      // setupComplete can arrive before live.connect() resolves; start() greets once it has the session.
      if (session) greet();
    }

    const sc = m.serverContent;
    if (sc?.interrupted) {
      player?.port.postMessage("flush");
      closeCaption("agent");
    }
    for (const part of sc?.modelTurn?.parts ?? []) {
      const data = part.inlineData?.data;
      if (data && player) {
        const pcm = base64ToBuffer(data);
        player.port.postMessage(pcm, [pcm]);
      }
    }
    if (sc?.inputTranscription?.text) caption("you", sc.inputTranscription.text);
    if (sc?.outputTranscription?.text) {
      closeCaption("you");
      caption("agent", sc.outputTranscription.text);
    }
    if (sc?.turnComplete) closeCaption("agent");

    for (const fc of m.toolCall?.functionCalls ?? []) void runFunction(fc);
  };

  return {
    levels: { agent: () => rms(outAnalyser), you: () => (store.get().muted ? 0 : rms(micAnalyser)) },
    subscribe: store.subscribe,
    getSnapshot: store.get,

    async start() {
      const status = store.get().status;
      if (status === "connecting" || status === "live") return;
      store.set({
        status: "connecting",
        captions: [],
        actions: [],
        startedAt: null,
        endedAt: null,
        error: undefined,
        muted: false,
      });
      hangUpAfterSpeech = false;

      try {
        // Create audio contexts inside the tap, before any await, or iOS Safari keeps them silent.
        playCtx = new AudioContext({ sampleRate: 24000 });
        captureCtx = new AudioContext();
        void playCtx.resume();
        void captureCtx.resume();

        const [media, granted] = await Promise.all([
          navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
          }),
          fetch("/api/calls/session", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ agentId, purpose }),
          }).then(async (r) => {
            if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail ?? "Couldn't start the call.");
            return r.json() as Promise<SessionGrant>;
          }),
          playCtx.audioWorklet.addModule("/worklets/playback-worklet.js"),
          captureCtx.audioWorklet.addModule("/worklets/capture-worklet.js"),
        ]);
        if (!playCtx || !captureCtx) {
          // Hung up while connecting: release the mic and close the call so it isn't billed.
          media.getTracks().forEach((t) => t.stop());
          void endOnServer(granted.callId, []);
          return;
        }
        stream = media;
        grant = granted;

        player = new AudioWorkletNode(playCtx, "playback-processor");
        outAnalyser = playCtx.createAnalyser();
        player.connect(outAnalyser).connect(playCtx.destination);
        player.port.onmessage = (e: MessageEvent<{ playing: boolean }>) => {
          clearTimeout(quietTimer);
          if (e.data.playing) {
            store.set({ activity: "speaking" });
          } else {
            // Short gaps between audio chunks aren't the end of a sentence.
            quietTimer = setTimeout(() => {
              store.set({ activity: "listening" });
              if (hangUpAfterSpeech) finish();
            }, 350);
          }
        };

        const mic = captureCtx.createMediaStreamSource(media);
        micAnalyser = captureCtx.createAnalyser();
        const capture = new AudioWorkletNode(captureCtx, "capture-processor");
        const sink = captureCtx.createGain();
        sink.gain.value = 0; // keeps the worklet pulled without echoing the mic
        mic.connect(micAnalyser);
        mic.connect(capture).connect(sink).connect(captureCtx.destination);
        capture.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
          if (!ready || store.get().muted) return;
          session?.sendRealtimeInput({ audio: { data: bufferToBase64(e.data), mimeType: "audio/pcm;rate=16000" } });
        };

        const ai = new GoogleGenAI({ apiKey: granted.token, httpOptions: { apiVersion: "v1beta" } });
        session = await ai.live.connect({
          model: granted.model,
          config: { responseModalities: [Modality.AUDIO] },
          callbacks: {
            onmessage: onMessage,
            onerror: () => store.set({ error: "The connection dropped." }),
            onclose: () => {
              if (store.get().status === "live" || store.get().status === "connecting") finish();
            },
          },
        });
        if (ready) greet();
      } catch (err) {
        const message =
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Callio needs your microphone. Allow it in your browser settings and try again."
            : err instanceof Error
              ? err.message
              : "Couldn't start the call.";
        store.set({ status: "error", error: message });
        finish();
      }
    },

    end: finish,

    setMuted(muted) {
      store.set({ muted });
      // Tell Live the stream paused so it doesn't wait on silence for end-of-turn.
      if (muted && ready) session?.sendRealtimeInput({ audioStreamEnd: true });
    },
  };
}

/** The backend bills from its own clock; keepalive lets this survive the person navigating away. */
function endOnServer(callId: string, captions: Caption[]) {
  return fetch(`/api/v1/calls/${callId}/end`, {
    method: "POST",
    keepalive: true,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ transcript: captions.map((c) => ({ who: c.who, text: c.text })) }),
  }).catch(() => undefined);
}

function bufferToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function base64ToBuffer(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}
