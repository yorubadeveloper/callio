import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CallRoom } from "@/app/call/[agentId]/call-room";
import { agentProfile } from "@/lib/agents/catalog";
import { DEMO_SCRIPTS } from "@/lib/call/demo-scripts";

export const metadata: Metadata = {
  title: "Try a call",
  description: "Hear what a call with a Callio agent sounds like. No sign-up needed.",
};

// A pre-recorded sample call anyone can try before signing up. No microphone, no credits.
export default async function DemoPage({ params }: { params: Promise<{ template: string }> }) {
  const template = (await params).template.toLowerCase();
  // Only agents with a recorded script have a demo; send others to Laura's.
  if (!DEMO_SCRIPTS[template]) redirect("/demo/laura");
  const base = agentProfile(template);
  if (!base) notFound();
  return <CallRoom demo credits={20} agent={{ ...base, id: "demo", template, customInstructions: null }} />;
}
