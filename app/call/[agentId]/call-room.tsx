"use client";

import { useState } from "react";
import { CallScreen } from "@/components/call/call-screen";
import type { PersonalAgent } from "@/lib/agents/personalize";
import { createDemoEngine } from "@/lib/call/demo-engine";
import { createGeminiEngine } from "@/lib/call/gemini-engine";

export function CallRoom({
  agent,
  credits,
  purpose,
  briefingId,
  demo = false,
}: {
  agent: PersonalAgent;
  credits: number;
  purpose?: string;
  briefingId?: string;
  demo?: boolean;
}) {
  // One engine per visit. The demo plays a scripted call with no microphone or network.
  const [engine] = useState(() =>
    demo ? createDemoEngine(agent.template) : createGeminiEngine({ agentId: agent.id, purpose, briefingId }),
  );
  return <CallScreen agent={agent} engine={engine} credits={credits} demo={demo} incoming={Boolean(purpose)} />;
}
