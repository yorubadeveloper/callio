"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { LockSimple, Phone, Plus, Trash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { AgentFace } from "@/components/landing/agent-face";
import { agentProfile } from "@/lib/agents/catalog";
import { personalize } from "@/lib/agents/personalize";
import { planAllows, SKILLS, type Skill } from "@/lib/agents/skills";
import { api, ApiError } from "@/lib/api";
import { when } from "@/lib/format";
import { plan as planById, type PlanId } from "@/lib/pricing";
import type { Memory, Schedule, UserAgent } from "@/lib/types";
import { AgentEditor, type AgentDraft } from "./agent-editor";
import { btn, inputClass, Segmented } from "./ui";
import { UpgradeSheet } from "./upgrade";
import { Spinner } from "@/components/brand/logo-loader";

type Tab = "skills" | "memory" | "customize";

export function AgentProfileView({
  agent: initial,
  memories: initialMemories,
  schedules,
  plan,
  timezone,
  locale,
}: {
  agent: UserAgent;
  memories: Memory[];
  schedules: Schedule[];
  plan: PlanId;
  timezone: string;
  locale: string;
}) {
  const router = useRouter();
  const [agent, setAgent] = useState(initial);
  const [tab, setTab] = useState<Tab>("skills");
  const [memories, setMemories] = useState(initialMemories);
  const a = personalize(agent);
  const base = agentProfile(agent.template)!;

  return (
    <div>
      {/* hero */}
      <section className="relative -mx-4 overflow-hidden px-4 pb-8 pt-4 sm:mx-0 sm:rounded-[32px] sm:bg-plate sm:p-8 sm:ring-1 sm:ring-line">
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block">
          <div
            className="absolute -left-20 -top-24 size-80 rounded-full opacity-30 blur-[80px]"
            style={{ background: a.face.skin }}
          />
          <div
            className="absolute -bottom-24 right-0 size-72 rounded-full opacity-30 blur-[80px]"
            style={{ background: a.face.tile }}
          />
        </div>
        <div className="relative flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="size-36 shrink-0 overflow-hidden rounded-full shadow-[0_24px_60px_-28px_rgb(0_0_0/0.6)] ring-4 ring-page sm:size-40 sm:ring-plate"
          >
            <AgentFace agent={a} className="size-full" />
          </motion.span>
          <div className="mt-5 min-w-0 flex-1 sm:mt-0">
            <h1 className="font-display text-[clamp(2.4rem,8vw,3.25rem)] leading-none font-medium tracking-[-0.045em]">
              {a.name}
            </h1>
            <p className="mt-2 text-[16px] text-ink-soft">
              {a.role} · {a.persona.voice} voice
            </p>
            {agent.name !== base.name && <p className="mt-1 text-[13px] text-ink-soft/80">Started as {base.name}</p>}
          </div>
          <Link href={`/call/${agent.id}`} className={cn(btn.call, "mt-6 w-full sm:mt-0 sm:w-auto sm:px-8")}>
            <Phone weight="fill" /> Call {a.name}
          </Link>
        </div>
      </section>

      <div className="mt-6 sm:mt-8 sm:max-w-md">
        <Segmented<Tab>
          label="Sections"
          value={tab}
          onChange={setTab}
          options={[
            { value: "skills", label: "What I do" },
            { value: "memory", label: "Memory" },
            { value: "customize", label: "Customize" },
          ]}
        />
      </div>

      <div className="mt-6">
        {tab === "skills" && (
          <Skills
            plan={plan}
            agentName={a.name}
            focus={a.persona.focus}
            schedules={schedules}
            timezone={timezone}
            locale={locale}
          />
        )}
        {tab === "memory" && (
          <AgentMemory agentId={agent.id} agentName={a.name} memories={memories} onChange={setMemories} />
        )}
        {tab === "customize" && (
          <Customize
            agent={agent}
            onSaved={(next) => {
              setAgent(next);
              router.refresh();
            }}
          />
        )}
      </div>
    </div>
  );
}

function Skills({
  plan,
  agentName,
  focus,
  schedules,
  timezone,
  locale,
}: {
  plan: PlanId;
  agentName: string;
  focus: string[];
  schedules: Schedule[];
  timezone: string;
  locale: string;
}) {
  const [locked, setLocked] = useState<Skill | null>(null);
  const ordered = [...SKILLS].sort((x, y) => Number(focus.includes(y.id)) - Number(focus.includes(x.id)));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <ul className="grid gap-3 sm:grid-cols-2">
        {ordered.map((s) => {
          const allowed = planAllows(plan, s.minPlan);
          const soon = s.status === "soon";
          return (
            <li key={s.id}>
              <button
                type="button"
                disabled={allowed || soon}
                onClick={() => setLocked(s)}
                className={cn(
                  "flex h-full w-full flex-col rounded-[24px] bg-plate p-5 text-left ring-1 ring-line",
                  !allowed && !soon && "transition-colors hover:ring-amber",
                  "disabled:cursor-default",
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-[16px] font-semibold">{s.title}</span>
                  {soon ? (
                    <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[11px] text-ink-soft">Soon</span>
                  ) : !allowed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber/25 px-2 py-0.5 text-[11px] font-semibold">
                      <LockSimple weight="bold" /> {planById(s.minPlan).name}
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 text-[14px] text-ink-soft">{s.summary}</span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {s.examples.slice(0, 2).map((e) => (
                    <span
                      key={e}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[12px]",
                        allowed && !soon ? "bg-teal/15" : "bg-ink/[0.05] text-ink-soft",
                      )}
                    >
                      “{e}”
                    </span>
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <aside className="self-start rounded-[24px] bg-plate p-5 ring-1 ring-line">
        <p className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">Coming up with {agentName}</p>
        {schedules.length ? (
          <ul className="mt-3 space-y-3">
            {schedules.slice(0, 5).map((s) => (
              <li key={s.id}>
                <p className="text-[15px] font-semibold">{s.text}</p>
                <p className="text-[13px] text-ink-soft">
                  {s.type === "call" ? "Call" : "Reminder"} · {when(s.when, timezone, locale)}
                  {s.repeat !== "none" && ` · ${s.repeat}`}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[14px] text-ink-soft">
            Nothing yet. Ask {agentName} to call you back at a time that suits you.
          </p>
        )}
      </aside>
      {locked && (
        <UpgradeSheet
          open
          onClose={() => setLocked(null)}
          plan={locked.minPlan}
          title={locked.title}
          reason={`${locked.summary} It's included in ${planById(locked.minPlan).name}.`}
        />
      )}
    </div>
  );
}

function AgentMemory({
  agentId,
  agentName,
  memories,
  onChange,
}: {
  agentId: string;
  agentName: string;
  memories: Memory[];
  onChange: (m: Memory[]) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const own = memories.filter((m) => m.agent_id === agentId);
  const shared = memories.filter((m) => m.agent_id === null);

  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      const m = await api<Memory>("/memory", { method: "POST", body: { text: text.trim(), agent_id: agentId } });
      onChange([m, ...memories]);
      setText("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that.");
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id: string) => {
    onChange(memories.filter((m) => m.id !== id));
    await api(`/memory/${id}`, { method: "DELETE" }).catch(() => undefined);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) void add();
          }}
          className="flex gap-2"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={300}
            placeholder={`Tell ${agentName} something to remember`}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={!text.trim() || busy}
            aria-label="Add"
            className={cn(btn.primary, "w-12 shrink-0 px-0")}
          >
            {busy ? <Spinner /> : <Plus weight="bold" />}
          </button>
        </form>
        {error && <p className="mt-2 text-[14px] text-[#B0412C] dark:text-coral">{error}</p>}
        <MemoryList
          title={`Only ${agentName} knows`}
          items={own}
          onRemove={remove}
          empty={`${agentName} hasn't noted anything yet. It saves things as you talk.`}
        />
      </section>
      <MemoryList
        title="Every agent knows"
        items={shared}
        onRemove={remove}
        empty="Things you share with all your agents show up here."
        footer={
          <Link
            href="/app/memory?import=1"
            className="mt-3 inline-block text-[14px] font-semibold underline-offset-4 hover:underline"
          >
            Import from ChatGPT, Claude or Gemini
          </Link>
        }
      />
    </div>
  );
}

export function MemoryList({
  title,
  items,
  onRemove,
  empty,
  footer,
}: {
  title: string;
  items: Memory[];
  onRemove: (id: string) => void;
  empty: string;
  footer?: React.ReactNode;
}) {
  return (
    <section className="mt-4 lg:mt-0">
      <p className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">{title}</p>
      {items.length ? (
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-[24px] bg-plate ring-1 ring-line">
          {items.map((m) => (
            <li key={m.id} className="group flex items-start gap-3 px-4 py-3">
              <p className="flex-1 text-[15px] leading-snug">{m.text}</p>
              <button
                type="button"
                onClick={() => onRemove(m.id)}
                aria-label={`Forget: ${m.text}`}
                className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-coral/15 hover:text-[#B0412C] sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
              >
                <Trash />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-[24px] bg-plate p-5 text-[14px] text-ink-soft ring-1 ring-line">{empty}</p>
      )}
      {footer}
    </section>
  );
}

function Customize({ agent, onSaved }: { agent: UserAgent; onSaved: (a: UserAgent) => void }) {
  const router = useRouter();
  const base = agentProfile(agent.template)!;
  const [draft, setDraft] = useState<AgentDraft>({
    template: agent.template,
    name: agent.name,
    voice: agent.voice ?? base.persona.voice,
    look: agent.look ?? { ...base.face, glasses: Boolean(base.face.glasses) },
    personality: agent.personality,
    instructions: agent.instructions ?? "",
  });
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async () => {
    setBusy("save");
    setMessage(null);
    try {
      const next = await api<UserAgent>(`/agents/${agent.id}`, {
        method: "PATCH",
        body: {
          name: draft.name.trim() || base.name,
          voice: draft.voice,
          look: draft.look,
          personality: draft.personality,
          instructions: draft.instructions.trim() || null,
        },
      });
      onSaved(next);
      setMessage("Saved. They'll be like this on your next call.");
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy("delete");
    try {
      await api(`/agents/${agent.id}`, { method: "DELETE" });
      router.push("/app/agents");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Couldn't delete. Try again.");
      setBusy(null);
    }
  };

  return (
    <div className="max-w-2xl">
      <AgentEditor draft={draft} onChange={setDraft} />
      {message && (
        <p className="mt-6 text-[15px] text-ink-soft" role="status">
          {message}
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button type="button" onClick={save} disabled={busy !== null} className={btn.primary}>
          {busy === "save" && <Spinner />} Save changes
        </button>
        {confirmDelete ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmDelete(false)} className={btn.soft}>
              Keep {draft.name || base.name}
            </button>
            <button type="button" onClick={remove} disabled={busy !== null} className={btn.danger}>
              {busy === "delete" && <Spinner />} Delete for good
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} className={btn.danger}>
            <Trash /> Delete agent
          </button>
        )}
      </div>
      {confirmDelete && (
        <p className="mt-3 text-[14px] text-ink-soft">
          This deletes {draft.name || base.name} and everything only they remember. Your call history stays.
        </p>
      )}
    </div>
  );
}
