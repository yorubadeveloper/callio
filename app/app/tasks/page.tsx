import type { Metadata } from "next";
import Link from "next/link";
import { NewTask, TASK_STATUS } from "@/components/app/tasks";
import { PageTitle } from "@/components/app/ui";
import { AgentFace } from "@/components/landing/agent-face";
import { personalize } from "@/lib/agents/personalize";
import { when } from "@/lib/format";
import { cn } from "@/lib/utils";
import { currentUser, userBackend } from "@/lib/server/backend";
import type { Task, UserAgent } from "@/lib/types";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage() {
  const user = (await currentUser())!;
  const call = await userBackend();
  const [tasks, agents] = await Promise.all([call<Task[]>("/v1/tasks?limit=20"), call<UserAgent[]>("/v1/agents")]);
  const people = agents.map(personalize);
  const byId = new Map(people.map((a) => [a.id, a]));

  return (
    <>
      <PageTitle title="Tasks" subtitle="Things your agents do for you on the web." />
      <NewTask agents={people} plan={user.plan} credits={user.credits.total} />
      {tasks.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-[22px] font-medium tracking-[-0.03em]">Recent</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-[28px] bg-plate ring-1 ring-line">
            {tasks.map((t) => {
              const a = byId.get(t.agent_id);
              return (
                <li key={t.id}>
                  <Link href={`/app/tasks/${t.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-ink/[0.03]">
                    {a && (
                      <span className="size-10 shrink-0 overflow-hidden rounded-full">
                        <AgentFace agent={a} className="size-full" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{t.goal}</span>
                      <span className="block text-[13px] text-ink-soft">
                        {when(t.created_at, user.timezone, user.locale)} · {t.credits} credits
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold",
                        t.status === "done"
                          ? "bg-teal/20"
                          : t.status === "needs_confirmation"
                            ? "bg-amber/30"
                            : t.status === "failed"
                              ? "bg-coral/20"
                              : "bg-ink/[0.06]",
                      )}
                    >
                      {TASK_STATUS[t.status]}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
