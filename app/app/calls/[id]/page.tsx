import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone } from "@phosphor-icons/react/dist/ssr";
import { btn } from "@/components/app/ui";
import { AgentFace } from "@/components/landing/agent-face";
import { personalize } from "@/lib/agents/personalize";
import { duration, when } from "@/lib/format";
import { cn } from "@/lib/utils";
import { currentUser, userBackend } from "@/lib/server/backend";
import type { Call, UserAgent } from "@/lib/types";

export const metadata: Metadata = { title: "Call" };

export default async function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await currentUser())!;
  const call = await userBackend();
  const [c, agents] = await Promise.all([
    call<Call | undefined>(`/v1/calls/${id}`).catch(() => undefined),
    call<UserAgent[]>("/v1/agents"),
  ]);
  if (!c) notFound();
  const raw = agents.find((a) => a.id === c.agent_id);
  const a = raw ? personalize(raw) : null;

  return (
    <article className="mx-auto max-w-2xl">
      <Link href="/app/calls" className={cn(btn.icon, "-ml-2")} aria-label="All calls">
        <ArrowLeft />
      </Link>
      <header className="mt-2 flex items-center gap-4">
        {a && (
          <span className="size-16 shrink-0 overflow-hidden rounded-full">
            <AgentFace agent={a} className="size-full" />
          </span>
        )}
        <div>
          <h1 className="font-display text-[30px] leading-tight font-medium tracking-[-0.035em]">
            Call with {a?.name ?? "your agent"}
          </h1>
          <p className="text-[14px] text-ink-soft">
            {when(c.started_at, user.timezone, user.locale)} · {duration(c.seconds)} · {c.credits}{" "}
            {c.credits === 1 ? "credit" : "credits"}
          </p>
        </div>
      </header>
      {c.summary && (
        <p className="mt-6 rounded-[24px] bg-plate p-5 text-[16px] leading-relaxed ring-1 ring-line">{c.summary}</p>
      )}
      <h2 className="mt-8 text-[13px] font-semibold uppercase tracking-wider text-ink-soft">Transcript</h2>
      {c.transcript?.length ? (
        <ol className="mt-3 space-y-3">
          {c.transcript.map((l, i) => (
            <li key={i} className={cn("flex", l.who === "you" ? "justify-end" : "justify-start")}>
              <p
                className={cn(
                  "max-w-[85%] rounded-[20px] px-4 py-2.5 text-[15px] leading-snug",
                  l.who === "you" ? "rounded-br-md bg-ink text-page" : "rounded-bl-md bg-plate ring-1 ring-line",
                )}
              >
                {l.text}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-[15px] text-ink-soft">No transcript for this call.</p>
      )}
      {a && (
        <Link href={`/call/${a.id}`} className={cn(btn.call, "mt-10 w-full sm:w-auto")}>
          <Phone weight="fill" /> Call {a.name} again
        </Link>
      )}
    </article>
  );
}
