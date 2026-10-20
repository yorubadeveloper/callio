import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/app/ui";
import { AgentFace } from "@/components/landing/agent-face";
import { personalize } from "@/lib/agents/personalize";
import { duration, when } from "@/lib/format";
import { currentUser, userBackend } from "@/lib/server/backend";
import type { Call, UserAgent } from "@/lib/types";

export const metadata: Metadata = { title: "Calls" };

export default async function CallsPage() {
  const user = (await currentUser())!;
  const call = await userBackend();
  const [calls, agents] = await Promise.all([call<Call[]>("/v1/calls?limit=100"), call<UserAgent[]>("/v1/agents")]);
  const byId = new Map(agents.map((a) => [a.id, personalize(a)]));
  const day = (iso: string) =>
    new Intl.DateTimeFormat(user.locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: user.timezone,
    }).format(new Date(iso));
  const groups = calls.reduce<Map<string, Call[]>>(
    (m, c) => m.set(day(c.started_at), [...(m.get(day(c.started_at)) ?? []), c]),
    new Map(),
  );

  return (
    <>
      <PageTitle title="Calls" subtitle="Every conversation, with a summary of what happened." />
      {calls.length === 0 && (
        <p className="rounded-[28px] bg-plate p-6 text-[15px] text-ink-soft ring-1 ring-line">
          No calls yet. Pick an agent on the home screen and say hello.
        </p>
      )}
      <div className="space-y-8">
        {[...groups.entries()].map(([label, items]) => (
          <section key={label}>
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-ink-soft">{label}</h2>
            <ul className="divide-y divide-line overflow-hidden rounded-[28px] bg-plate ring-1 ring-line">
              {items.map((c) => {
                const a = byId.get(c.agent_id);
                return (
                  <li key={c.id}>
                    <Link
                      href={`/app/calls/${c.id}`}
                      className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-ink/[0.03]"
                    >
                      {a && (
                        <span className="size-11 shrink-0 overflow-hidden rounded-full">
                          <AgentFace agent={a} className="size-full" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold leading-snug">
                          {c.summary ?? `Call with ${a?.name ?? "your agent"}`}
                        </span>
                        <span className="block text-[13px] text-ink-soft">
                          {a?.name ?? "Deleted agent"} · {when(c.started_at, user.timezone, user.locale)} ·{" "}
                          {duration(c.seconds)} · {c.credits} {c.credits === 1 ? "credit" : "credits"}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
