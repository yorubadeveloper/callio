"use client";

import { useState } from "react";
import { CallScreen } from "@/components/call/call-screen";
import type { PersonalAgent } from "@/lib/agents/personalize";
import { engineFor, startCall } from "@/lib/call/active";
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
  // The demo plays a scripted call with no microphone or network. A real call picks up the one already going on with
  // this agent (back from elsewhere in the app), or gets a fresh engine.
  const [engine] = useState(() =>
    demo
      ? createDemoEngine(agent.template)
      : engineFor(agent.id, () => createGeminiEngine({ agentId: agent.id, purpose, briefingId })),
  );
  return (
    <CallScreen
      agent={agent}
      engine={engine}
      credits={credits}
      demo={demo}
      incoming={Boolean(purpose)}
      onStart={demo ? undefined : () => startCall({ agentId: agent.id, name: agent.name, engine })}
    />
  );
}
