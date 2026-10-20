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

  let start: CallStart;
  try {
    const call = await userBackend();
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
  const token = await ai.authTokens.create({
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
              endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
              prefixPaddingMs: 20,
              silenceDurationMs: 600,
            },
          },
          tools: toolsForPlan(user.plan),
        },
      },
      // lockAdditionalFields is omitted, so the whole config is locked. (Passing [] makes the
      // SDK send a field mask the API currently rejects: "field_mask is invalid".)
    },
  });

  return NextResponse.json({
    token: token.name,
    model: LIVE_MODEL,
    callId: start.call_id,
    maxSeconds: start.max_seconds,
  });
}
