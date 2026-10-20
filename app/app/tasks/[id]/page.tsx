import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaskLive } from "@/components/app/tasks";
import { personalize } from "@/lib/agents/personalize";
import { userBackend } from "@/lib/server/backend";
import type { Task, UserAgent } from "@/lib/types";

export const metadata: Metadata = { title: "Task" };

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const call = await userBackend();
  const [task, agents] = await Promise.all([
    call<Task | undefined>(`/v1/tasks/${id}`).catch(() => undefined),
    call<UserAgent[]>("/v1/agents"),
  ]);
  if (!task) notFound();
  const agent = agents.find((a) => a.id === task.agent_id);
  return <TaskLive task={task} agent={agent ? personalize(agent) : null} />;
}
