import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CallRoom } from "@/app/call/[agentId]/call-room";
import { agentProfile } from "@/lib/agents/catalog";

export const metadata: Metadata = {
  title: "Try a call",
  description: "Hear what a call with a Callio agent feels like. No sign-up needed.",
};

// A scripted call anyone can try before signing up. No microphone, no credits.
export default async function DemoPage({ params }: { params: Promise<{ template: string }> }) {
  const base = agentProfile((await params).template);
  if (!base) notFound();
  return (
    <CallRoom
      demo
      credits={20}
      agent={{ ...base, id: "demo", template: base.name.toLowerCase(), customInstructions: null }}
    />
  );
}
