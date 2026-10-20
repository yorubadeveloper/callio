import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentProfileView } from "@/components/app/agent-profile";
import { currentUser, userBackend } from "@/lib/server/backend";
import type { Memory, Schedule, UserAgent } from "@/lib/types";

export const metadata: Metadata = { title: "Agent" };

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await currentUser())!;
  const call = await userBackend();
  const [agents, memories, schedules] = await Promise.all([
    call<UserAgent[]>("/v1/agents"),
    call<Memory[]>(`/v1/memory?agent_id=${encodeURIComponent(id)}`),
    call<Schedule[]>("/v1/schedules"),
  ]);
  const agent = agents.find((a) => a.id === id);
  if (!agent) notFound();
  return (
    <AgentProfileView
      agent={agent}
      memories={memories}
      schedules={schedules.filter((s) => s.agent_id === id)}
      plan={user.plan}
      timezone={user.timezone}
      locale={user.locale}
    />
  );
}
