import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { buildContactInstructions, buildInstructions } from "@/lib/agents/instructions";
import { personalize } from "@/lib/agents/personalize";
import { CONTACT_CALL_TOOLS, TOOL_SCHEDULING, toolsForPlan } from "@/lib/agents/tools";
import { liveConfig } from "@/lib/server/live";
import { LIVE_MODEL } from "@/lib/server/models";
import type { PhoneCallSetup } from "@/lib/types";

// Server-to-server: the backend bridges phone calls itself (Twilio ⇄ Gemini Live) and asks here for the
// agent's instructions and tools, so a phone call sounds like the same agent as an app call. Authenticated
// with the shared backend key; it reads nothing and stores nothing.
export async function POST(req: Request) {
  const expected = Buffer.from(process.env.API_KEY ?? "");
  const given = Buffer.from(req.headers.get("x-api-key") ?? "");
  if (!expected.length || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ detail: "Not allowed." }, { status: 401 });
  }
  const setup = (await req.json().catch(() => null)) as PhoneCallSetup | null;
  if (!setup || (setup.kind !== "user" && setup.kind !== "contact")) {
    return NextResponse.json({ detail: "Unknown call." }, { status: 400 });
  }

  const now = new Date();
  if (setup.kind === "contact") {
    const agent = personalize(setup.agent);
    const systemInstruction = buildContactInstructions({
      agent,
      user: setup.user,
      contact: setup.contact,
      message: setup.message,
      maxSeconds: setup.max_seconds,
      now,
    });
    return NextResponse.json({
      model: LIVE_MODEL,
      config: liveConfig({ systemInstruction, voice: agent.persona.voice, tools: CONTACT_CALL_TOOLS }),
      scheduling: TOOL_SCHEDULING,
    });
  }

  const { start } = setup;
  const agent = personalize(start.agent);
  const systemInstruction = buildInstructions({
    agent,
    user: start.user,
    memory: { facts: start.memory.facts, recentCalls: start.memory.recent_calls },
    purpose: setup.purpose?.slice(0, 200) || undefined,
    briefing: start.briefing,
    sources: start.sources,
    contacts: start.contacts,
    channel: "phone",
    inbound: setup.inbound,
    maxSeconds: start.max_seconds,
    now,
  });
  return NextResponse.json({
    model: LIVE_MODEL,
    config: liveConfig({ systemInstruction, voice: agent.persona.voice, tools: toolsForPlan(start.user.plan) }),
    scheduling: TOOL_SCHEDULING,
  });
}
