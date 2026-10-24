"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, Globe, LockSimple, Monitor, Prohibit, WarningCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { AgentFace } from "@/components/landing/agent-face";
import type { PersonalAgent } from "@/lib/agents/personalize";
import { planAllows } from "@/lib/agents/skills";
import { api, ApiError } from "@/lib/api";
import { CREDIT_COSTS, type PlanId } from "@/lib/pricing";
import type { Task } from "@/lib/types";
import { btn, Field, inputClass } from "./ui";
import { UpgradeSheet } from "./upgrade";
import { Spinner } from "@/components/brand/logo-loader";

export const TASK_STATUS: Record<Task["status"], string> = {
  queued: "Waiting to start",
  running: "Working on it",
  needs_confirmation: "Needs your OK",
  done: "Done",
  failed: "Couldn't finish",
  cancelled: "Stopped",
};

const IDEAS = [
  "Find a table for 4 near me on Friday at 8pm",
  "Compare the three cheapest flights to Lagos next month",
  "Check if my library books can be renewed",
  "Find the opening hours of the nearest pharmacy",
];

export function NewTask({ agents, plan, credits }: { agents: PersonalAgent[]; plan: PlanId; credits: number }) {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [constraints, setConstraints] = useState("");
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const allowed = planAllows(plan, "plus");

  const start = async () => {
    if (!allowed) return setUpgrade(true);
    setBusy(true);
    setError(null);
    try {
      const task = await api<Task>("/tasks", {
        method: "POST",
        body: { agent_id: agentId, goal: goal.trim(), constraints: constraints.trim() || null },
      });
      router.push(`/app/tasks/${task.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start the task.");
      setBusy(false);
    }
  };

  return (
    <section className="rounded-[28px] bg-plate p-5 ring-1 ring-line sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[22px] font-medium tracking-[-0.03em]">Give an agent a job</h2>
          <p className="mt-1 text-[14px] text-ink-soft">
            They use a real browser to do it and report back. You approve anything that commits you. From{" "}
            {CREDIT_COSTS.computerTaskFrom} credits.
          </p>
        </div>
        {!allowed && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber/25 px-2.5 py-1 text-[12px] font-semibold">
            <LockSimple weight="bold" /> Plus
          </span>
        )}
      </div>

      <div className="mt-5 space-y-4">
        <Field label="What should they do?">
          {(id) => (
            <textarea
              id={id}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
              maxLength={500}
              className={cn(inputClass, "resize-none")}
              placeholder="Find a table for 4 near me on Friday at 8pm"
            />
          )}
        </Field>
        <div className="flex flex-wrap gap-2">
          {IDEAS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setGoal(i)}
              className="rounded-full bg-ink/[0.05] px-3 py-1.5 text-[13px] hover:bg-ink/10"
            >
              {i}
            </button>
          ))}
        </div>
        <Field label="Anything to keep in mind?" hint="Budget, times, names, places to avoid.">
          {(id) => (
            <input
              id={id}
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              maxLength={300}
              className={inputClass}
            />
          )}
        </Field>
        {agents.length > 1 && (
          <div>
            <p className="text-[14px] font-semibold">Who&apos;s doing it</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {agents.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={agentId === a.id}
                  onClick={() => setAgentId(a.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-[14px] font-medium",
                    agentId === a.id ? "bg-ink text-page" : "bg-ink/[0.06]",
                  )}
                >
                  <span className="size-8 overflow-hidden rounded-full">
                    <AgentFace agent={a} className="size-full" />
                  </span>
                  {a.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-4 text-[14px] text-[#B0412C] dark:text-coral">{error}</p>}
      <button
        type="button"
        onClick={start}
        disabled={allowed && (busy || goal.trim().length < 8 || credits < CREDIT_COSTS.computerTaskFrom)}
        className={cn(btn.primary, "mt-6 w-full sm:w-auto")}
      >
        {busy ? <Spinner /> : allowed ? <Monitor weight="fill" /> : <LockSimple weight="bold" />}
        {allowed ? "Start task" : "Unlock computer tasks"}
      </button>
      <UpgradeSheet
        open={upgrade}
        onClose={() => setUpgrade(false)}
        plan="plus"
        title="Computer tasks"
        reason="Your agents can use a real browser to book, fill in forms, compare prices and look things up for you, then tell you what they did. It's included in Plus."
      />
    </section>
  );
}

/** Live view of one task. While it runs: the browser and its steps. Once done: the report first, the steps tucked
 *  away. Polls while it's working. */
export function TaskLive({ task: initial, agent }: { task: Task; agent: PersonalAgent | null }) {
  const [task, setTask] = useState(initial);
  const [frame, setFrame] = useState(0);
  const [busy, setBusy] = useState(false);
  const active = task.status === "queued" || task.status === "running";
  const finished = task.status === "done" || task.status === "failed" || task.status === "cancelled";

  useEffect(() => {
    if (!active && task.status !== "needs_confirmation") return;
    const t = setInterval(async () => {
      const next = await api<Task>(`/tasks/${task.id}`).catch(() => null);
      if (next) setTask(next);
      setFrame((f) => f + 1);
    }, 1500);
    return () => clearInterval(t);
  }, [active, task.id, task.status]);

  const act = async (path: string, body?: unknown) => {
    setBusy(true);
    try {
      setTask(await api<Task>(`/tasks/${task.id}/${path}`, { method: "POST", body }));
    } finally {
      setBusy(false);
    }
  };

  const browser = (
    <div className="overflow-hidden rounded-[24px] bg-[#0E0E10] ring-1 ring-line">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 text-[13px] text-white/60">
        <Globe />
        <span className="truncate">{task.url ?? "about:blank"}</span>
        {active && <Spinner className="ml-auto" />}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- live screenshots, not static assets */}
      <img
        src={`/api/v1/tasks/${task.id}/screenshot?f=${frame}`}
        alt="What the agent's browser shows"
        className="aspect-[16/10] w-full bg-[#1A1A1D] object-cover object-top"
        onError={(e) => (e.currentTarget.style.visibility = "hidden")}
        onLoad={(e) => (e.currentTarget.style.visibility = "visible")}
      />
    </div>
  );

  const steps = (
    <ol className="space-y-3 border-l-2 border-line pl-4">
      {task.steps.map((s) => (
        <li key={s.n} className="relative">
          <span className="absolute -left-[23px] top-1.5 size-3 rounded-full bg-ink ring-4 ring-page" />
          <p className="text-[15px] leading-snug">{s.detail}</p>
          <p className="text-[12px] text-ink-soft">
            Step {s.n} · {s.action}
          </p>
        </li>
      ))}
      {task.steps.length === 0 && <li className="text-[15px] text-ink-soft">Opening a browser…</li>}
    </ol>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex items-center gap-3">
        {agent && (
          <span className="size-12 shrink-0 overflow-hidden rounded-full">
            <AgentFace agent={agent} className="size-full" />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-[13px] text-ink-soft">
            {TASK_STATUS[task.status]} · {task.credits} credits{active ? " so far" : ""}
          </p>
          <h1 className="font-display text-[clamp(22px,3vw,30px)] leading-tight font-medium tracking-[-0.03em]">
            {task.goal}
          </h1>
          {task.constraints && <p className="mt-1 text-[14px] text-ink-soft">Keeping in mind: {task.constraints}</p>}
        </div>
      </header>

      {task.status === "needs_confirmation" && task.confirmation && (
        <Waiting
          question={task.confirmation.question}
          kind={task.confirmation.kind ?? "confirm"}
          name={agent?.name ?? "Your agent"}
          busy={busy}
          onAnswer={(body) => act("confirm", body)}
        />
      )}

      {finished ? (
        <>
          <Report task={task} />
          <details className="group mt-6 rounded-[24px] bg-plate ring-1 ring-line">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
              How {agent?.name ?? "your agent"} got there · {task.steps.length} steps
              <span aria-hidden className="text-ink-soft transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="grid grid-cols-1 gap-6 px-5 pb-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              {browser}
              <div className="max-h-[520px] overflow-y-auto pr-1">{steps}</div>
            </div>
          </details>
        </>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {browser}
          <div>
            {steps}
            <button
              type="button"
              disabled={busy}
              onClick={() => act("cancel")}
              className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink hover:underline"
            >
              <Prohibit /> Stop task
            </button>
          </div>
        </div>
      )}

      <Link href="/app/tasks" className="mt-8 inline-block text-[14px] font-semibold underline-offset-4 hover:underline">
        All tasks
      </Link>
    </div>
  );
}

/** The agent is paused on them: an OK to go ahead, or a question that needs an answer. */
function Waiting({
  question,
  kind,
  name,
  busy,
  onAnswer,
}: {
  question: string;
  kind: "confirm" | "question";
  name: string;
  busy: boolean;
  onAnswer: (body: { approve: boolean; answer?: string }) => void;
}) {
  const [answer, setAnswer] = useState("");
  return (
    <div className="mt-6 rounded-[24px] bg-amber/20 p-5 ring-1 ring-amber/50">
      <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider">
        <WarningCircle weight="fill" /> {kind === "question" ? `${name} has a question` : `${name} needs your OK`}
      </p>
      <p className="mt-2 text-[17px] leading-snug">{question}</p>
      {kind === "question" ? (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (answer.trim()) onAnswer({ approve: true, answer: answer.trim() });
          }}
        >
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={2}
            maxLength={1000}
            aria-label="Your answer"
            className={cn(inputClass, "resize-none bg-page")}
            placeholder="Your answer"
          />
          <div className="grid grid-cols-2 gap-3">
            <button type="button" disabled={busy} onClick={() => onAnswer({ approve: false })} className={btn.soft}>
              Stop the task
            </button>
            <button type="submit" disabled={busy || !answer.trim()} className={btn.primary}>
              Send
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" disabled={busy} onClick={() => onAnswer({ approve: false })} className={btn.soft}>
            No, stop
          </button>
          <button type="button" disabled={busy} onClick={() => onAnswer({ approve: true })} className={btn.primary}>
            Yes, go ahead
          </button>
        </div>
      )}
    </div>
  );
}

const host = (link: string) => {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
};

/** The finished answer, readable at a glance: the short answer, then each option with its price, then notes. */
function Report({ task }: { task: Task }) {
  const report = task.report;
  const ok = task.status === "done";
  const summary = report?.summary ?? task.result?.replace(/[*_`#]+/g, "") ?? "";
  return (
    <section className={cn("mt-6 rounded-[28px] p-5 ring-1 sm:p-7", ok ? "bg-plate ring-line" : "bg-coral/10 ring-coral/30")}>
      <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-ink-soft">
        {ok ? <Check weight="bold" /> : <WarningCircle weight="fill" />} {ok ? "Result" : TASK_STATUS[task.status]}
      </p>
      {summary && <p className="mt-3 max-w-3xl text-[19px] leading-snug sm:text-[21px]">{summary}</p>}

      {report && report.items.length > 0 && (
        <ol className="mt-6 divide-y divide-line overflow-hidden rounded-[20px] bg-page ring-1 ring-line">
          {report.items.map((item, i) => (
            <li key={i} className="flex items-start gap-4 p-4 sm:p-5">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-ink/[0.06] text-[13px] font-semibold tabular-nums">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-semibold leading-snug">{item.title}</p>
                {item.detail && <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{item.detail}</p>}
                {item.link && host(item.link) && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold underline-offset-4 hover:underline"
                  >
                    {host(item.link)} <ArrowUpRight />
                  </a>
                )}
              </div>
              {item.price && (
                <p className="shrink-0 font-display text-[20px] font-medium tracking-[-0.02em] tabular-nums">
                  {item.price}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}

      {report && report.notes.length > 0 && (
        <div className="mt-6">
          <p className="text-[13px] font-semibold text-ink-soft">Good to know</p>
          <ul className="mt-2 space-y-1.5 text-[14px] leading-relaxed">
            {report.notes.map((n, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-ink-soft" />
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
