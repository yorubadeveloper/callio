import { NextResponse } from "next/server";
import { EndSensitivity, GoogleGenAI, Modality, StartSensitivity } from "@google/genai";
import { buildInstructions } from "@/lib/agents/instructions";
import { personalize } from "@/lib/agents/personalize";
import { toolsForPlan } from "@/lib/agents/tools";
import { BackendError, userBackend } from "@/lib/server/backend";
import { geminiKey, LIVE_MODEL } from "@/lib/server/models";
import type { CallStart } from "@/lib/types";

// Starts an in-app call: the backend checks credits and opens the call record,
// then we mint a single-use Gemini Live token with this person's agent,
// instructions and tools locked in. The browser talks to Gemini directly.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { agentId?: string; purpose?: string };
  if (!body.agentId) return NextResponse.json({ detail: "Pick an agent to call." }, { status: 400 });
  // Check before opening a call record, so a missing key never leaves a call running (and billed).
  if (!process.env.GEMINI_API_KEY) {
    console.error("calls: GEMINI_API_KEY is not set");
    return NextResponse.json({ detail: "Calls aren't available right now. Please try again soon." }, { status: 503 });
  }

  let start: CallStart;
  let call: Awaited<ReturnType<typeof userBackend>>;
  try {
    call = await userBackend();
    start = await call<CallStart>("/v1/calls/start", { method: "POST", body: { agent_id: body.agentId } });
  } catch (err) {
    const status = err instanceof BackendError ? err.status : 502;
    const detail = err instanceof Error ? err.message : "Couldn't start the call.";
    return NextResponse.json({ detail }, { status });
  }

  const { user } = start;
  const agent = personalize(start.agent);
  const systemInstruction = buildInstructions({
    agent,
    user,
    memory: { facts: start.memory.facts, recentCalls: start.memory.recent_calls },
    purpose: body.purpose?.slice(0, 200),
    channel: "app",
    now: new Date(),
  });

  const ai = new GoogleGenAI({ apiKey: geminiKey() });
  const now = Date.now();
  let token;
  try {
    token = await ai.authTokens.create({
      config: {
        uses: 1,
        // The token can't outlive the credits the call is allowed to spend.
        expireTime: new Date(now + (start.max_seconds + 60) * 1000).toISOString(),
        newSessionExpireTime: new Date(now + 60_000).toISOString(),
        liveConnectConstraints: {
          model: LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction,
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: agent.persona.voice } } },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            // Live re-bills the whole context every turn; compress early to keep long calls affordable.
            contextWindowCompression: { triggerTokens: "16000", slidingWindow: { targetTokens: "8000" } },
            realtimeInputConfig: {
              automaticActivityDetection: {
                startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
                // Answer as soon as the caller stops: eager end-of-speech, half a second of silence.
                endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_HIGH,
                prefixPaddingMs: 20,
                silenceDurationMs: 500,
              },
            },
            tools: toolsForPlan(user.plan),
          },
        },
        // lockAdditionalFields is omitted, so the whole config is locked. (Passing [] makes the
        // SDK send a field mask the API currently rejects: "field_mask is invalid".)
      },
    });
  } catch (err) {
    // Close the call we just opened. With no transcript and a few seconds on the clock it isn't charged.
    console.error("calls: couldn't mint a Gemini Live token", err instanceof Error ? err.message : err);
    await call(`/v1/calls/${start.call_id}/end`, { method: "POST", body: { transcript: [] } }).catch(() => undefined);
    return NextResponse.json({ detail: "We couldn't connect your call. Please try again." }, { status: 502 });
  }

  return NextResponse.json({
    token: token.name,
    model: LIVE_MODEL,
    callId: start.call_id,
    maxSeconds: start.max_seconds,
  });
}
