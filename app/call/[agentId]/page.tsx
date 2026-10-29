import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { personalize } from "@/lib/agents/personalize";
import { currentUser, userBackend } from "@/lib/server/backend";
import type { Nudge, UserAgent } from "@/lib/types";
import { CallRoom } from "./call-room";

export const metadata: Metadata = { title: "Call", robots: { index: false, follow: false } };

export default async function CallPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentId: string }>;
  searchParams: Promise<{ purpose?: string; briefing?: string; nudge?: string }>;
}) {
  const [{ agentId }, { purpose, briefing, nudge: nudgeId }] = await Promise.all([params, searchParams]);
  const user = await currentUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(`/call/${agentId}${nudgeId ? `?nudge=${nudgeId}` : ""}`)}`);
  if (!user.onboarded) redirect("/welcome");

  const call = await userBackend();
  const agents = await call<UserAgent[]>("/v1/agents");
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) notFound();
  // Opened from the agent's own note: show it, and the call starts from it. A note that's gone just opens the call.
  const nudge =
    nudgeId && /^[0-9a-f-]{36}$/i.test(nudgeId) ? await call<Nudge>(`/v1/nudges/${nudgeId}`).catch(() => null) : null;

  return (
    <CallRoom
      agent={personalize(agent)}
      credits={user.credits.total}
      purpose={purpose}
      briefingId={briefing}
      nudge={nudge && nudge.agent_id === agent.id ? nudge : null}
    />
  );
}
