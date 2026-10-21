"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CalendarBlank, CloudSun, Newspaper, Plus, SunHorizon, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { when } from "@/lib/format";
import { AgentFace } from "@/components/landing/agent-face";
import type { PersonalAgent } from "@/lib/agents/personalize";
import type { Briefing, BriefingItem, Connector, MorningCall, User } from "@/lib/types";
import { Spinner } from "@/components/brand/logo-loader";
import { KIND } from "./sources";
import { SelectMenu } from "./select-menu";
import { btn, Chip, Field, inputClass, Segmented, Sheet } from "./ui";

// The morning call: one call a day that covers what the person connected, plus their day, news and weather.
// The briefing is written on the server a few minutes before it rings, so the call starts with everything ready.

const REPEAT = [
  { value: "daily" as const, label: "Every day" },
  { value: "weekdays" as const, label: "Weekdays" },
];

const LEVEL: Record<BriefingItem["level"], { label: string; tint: string }> = {
  act: { label: "Needs you", tint: "bg-coral/25" },
  watch: { label: "Worth knowing", tint: "bg-amber/35" },
  info: { label: "FYI", tint: "bg-ink/[0.07]" },
};

export function MorningCallCard({
  morning,
  agents,
  connectors,
  user,
}: {
  morning: MorningCall;
  agents: PersonalAgent[];
  connectors: Connector[];
  user: User;
}) {
  const [open, setOpen] = useState(false);
  const agent = agents.find((a) => a.id === morning.agent_id);
  const covered = [
    ...connectors.filter((c) => c.in_briefing).map((c) => c.name),
    morning.prefs.calendar && user.integrations?.google_calendar?.connected && "Calendar",
    morning.prefs.weather && user.city && "Weather",
    morning.prefs.news && "News",
  ].filter(Boolean) as string[];

  return (
    <section className="relative overflow-hidden rounded-[30px] bg-plate ring-1 ring-line">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="absolute -right-10 -top-16 size-56 rounded-full bg-amber/45 blur-3xl dark:bg-amber/25" />
        <span className="absolute -bottom-20 right-24 size-48 rounded-full bg-coral/30 blur-3xl dark:bg-coral/20" />
      </div>
      <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-[22px] bg-amber/40 text-[30px]">
          {agent ? <AgentFace agent={agent} className="size-full" /> : <SunHorizon weight="fill" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[24px] leading-tight font-medium tracking-[-0.03em]">Your morning call</p>
          {morning.enabled && agent ? (
            <>
              <p className="mt-1 text-[15px] text-ink-soft">
                {agent.name} calls {morning.repeat === "weekdays" ? "every weekday" : "every day"} at{" "}
                <span className="font-mono text-ink">{morning.time}</span>
                {morning.next_at && <> · next {when(morning.next_at, user.timezone, user.locale).toLowerCase()}</>}
              </p>
              {covered.length > 0 && (
                <p className="mt-2 flex flex-wrap gap-1.5">
                  {covered.map((name) => (
                    <span key={name} className="rounded-full bg-page/70 px-2.5 py-1 text-[12px] font-semibold ring-1 ring-line">
                      {name}
                    </span>
                  ))}
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-[15px] text-ink-soft">
              One call each morning with what matters today: your sites and servers, your day, the news and the
              weather. You can ask follow-ups, so it&apos;s a conversation, not a report.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={agents.length === 0}
          className={cn(morning.enabled ? btn.soft : btn.primary, "shrink-0")}
        >
          {morning.enabled ? "Edit" : agents.length === 0 ? "Create an agent first" : "Set it up"}
        </button>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title="Your morning call" wide>
        <MorningForm morning={morning} agents={agents} connectors={connectors} user={user} onDone={() => setOpen(false)} />
      </Sheet>
    </section>
  );
}

function MorningForm({
  morning,
  agents,
  connectors,
  user,
  onDone,
}: {
  morning: MorningCall;
  agents: PersonalAgent[];
  connectors: Connector[];
  user: User;
  onDone: () => void;
}) {
  const router = useRouter();
  const [agentId, setAgentId] = useState(morning.agent_id ?? agents[0]?.id ?? "");
  const [time, setTime] = useState(morning.time);
  const [repeat, setRepeat] = useState(morning.repeat);
  const [prefs, setPrefs] = useState(morning.prefs);
  const [topics, setTopics] = useState(morning.topics);
  const [draft, setDraft] = useState("");
  const [included, setIncluded] = useState(() => new Set(connectors.filter((c) => c.in_briefing).map((c) => c.id)));
  const [busy, setBusy] = useState<"save" | "off" | "preview" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Briefing | null>(null);

  const calendarOn = Boolean(user.integrations?.google_calendar?.connected);

  const addTopic = () => {
    const t = draft.trim();
    if (t && topics.length < 12 && !topics.some((x) => x.toLowerCase() === t.toLowerCase())) setTopics([...topics, t]);
    setDraft("");
  };

  // Connectors keep their own "in my morning call" switch; only send what changed.
  const saveConnectors = () =>
    Promise.all(
      connectors
        .filter((c) => c.in_briefing !== included.has(c.id))
        .map((c) => api(`/connectors/${c.id}`, { method: "PATCH", body: { in_briefing: included.has(c.id) } })),
    );

  const save = async (enabled: boolean) => {
    setBusy(enabled ? "save" : "off");
    setError(null);
    try {
      await saveConnectors();
      await api("/briefing", {
        method: "PUT",
        body: enabled ? { enabled, agent_id: agentId, time, repeat, prefs, topics } : { enabled: false },
      });
      router.refresh();
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const runPreview = async () => {
    setBusy("preview");
    setError(null);
    try {
      await saveConnectors();
      await api("/briefing", { method: "PUT", body: { enabled: morning.enabled, prefs, topics } });
      setPreview(await api<Briefing>("/briefing/preview", { method: "POST" }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't write a preview. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Who calls">
          {(id) => (
            <SelectMenu
              id={id}
              label="Who calls"
              value={agentId}
              onChange={setAgentId}
              options={agents.map((a) => ({ value: a.id, label: a.name, description: a.role }))}
            />
          )}
        </Field>
        <Field label="When">
          {(id) => (
            <input
              id={id}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              // iOS sizes date/time inputs to their own content unless told otherwise.
              className={cn(inputClass, "min-w-0 appearance-none font-mono")}
            />
          )}
        </Field>
      </div>
      <Segmented label="How often" value={repeat} options={REPEAT} onChange={setRepeat} />

      <div>
        <p className="text-[14px] font-semibold">What it covers</p>
        <p className="mt-0.5 text-[13px] text-ink-soft">
          Only what&apos;s worth hearing makes it in. A quiet, healthy day gets one line.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {connectors.map((c) => {
            const Icon = KIND[c.kind].icon;
            const on = included.has(c.id);
            return (
              <Chip
                key={c.id}
                selected={on}
                onClick={() =>
                  setIncluded((s) => {
                    const next = new Set(s);
                    if (on) next.delete(c.id);
                    else next.add(c.id);
                    return next;
                  })
                }
              >
                <Icon weight="fill" /> {c.name}
              </Chip>
            );
          })}
          <Chip selected={prefs.calendar && calendarOn} onClick={() => setPrefs({ ...prefs, calendar: !prefs.calendar })}>
            <CalendarBlank weight="fill" /> Calendar
          </Chip>
          <Chip selected={prefs.weather} onClick={() => setPrefs({ ...prefs, weather: !prefs.weather })}>
            <CloudSun weight="fill" /> Weather
          </Chip>
          <Chip selected={prefs.news} onClick={() => setPrefs({ ...prefs, news: !prefs.news })}>
            <Newspaper weight="fill" /> News
          </Chip>
        </div>
        {(!calendarOn || !user.city || connectors.length === 0) && (
          <ul className="mt-3 space-y-1 text-[13px] text-ink-soft">
            {connectors.length === 0 && <li>Add your sites, servers or Analytix below to hear how they&apos;re doing.</li>}
            {!calendarOn && <li>Connect Google Calendar below to hear about your day.</li>}
            {!user.city && <li>Add your city on the You page for the weather.</li>}
          </ul>
        )}
      </div>

      {prefs.news && (
        <div>
          <p className="text-[14px] font-semibold">News about</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <AnimatePresence initial={false}>
              {topics.map((t) => (
                <motion.span
                  key={t}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="inline-flex min-h-10 items-center gap-1 rounded-full bg-peri/25 pl-3.5 pr-1 text-[14px] font-medium"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => setTopics(topics.filter((x) => x !== t))}
                    aria-label={`Remove ${t}`}
                    className="grid size-8 place-items-center rounded-full hover:bg-ink/10"
                  >
                    <X weight="bold" className="size-3.5" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
            {topics.length < 12 && (
              <span className="inline-flex items-center gap-1">
                <input
                  aria-label="Add a topic"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTopic();
                    }
                  }}
                  maxLength={40}
                  placeholder={topics.length ? "Add another" : "AI, startups, Lagos…"}
                  className="h-10 w-40 rounded-full bg-page px-4 text-[14px] ring-1 ring-line outline-none focus:ring-2 focus:ring-ink"
                />
                {draft.trim() && (
                  <button type="button" onClick={addTopic} aria-label="Add topic" className={cn(btn.icon, "size-10")}>
                    <Plus weight="bold" />
                  </button>
                )}
              </span>
            )}
          </div>
          {topics.length === 0 && (
            <p className="mt-2 text-[13px] text-ink-soft">With no topics, you&apos;ll hear tech and big world news.</p>
          )}
        </div>
      )}

      <div className="rounded-[24px] bg-page/70 p-4 ring-1 ring-line">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[14px] font-semibold">What it would say right now</p>
            <p className="mt-0.5 text-[13px] text-ink-soft">Checks everything for real. Takes about 20 seconds.</p>
          </div>
          <button
            type="button"
            onClick={runPreview}
            disabled={busy !== null}
            className={cn(btn.soft, "h-10 shrink-0 px-4 text-[14px]")}
          >
            {busy === "preview" && <Spinner />} {preview ? "Again" : "Preview"}
          </button>
        </div>
        <AnimatePresence initial={false}>
          {preview && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <p className="mt-4 text-[15px] italic">“{preview.opening}”</p>
              <ol className="mt-3 space-y-2.5">
                {preview.items.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className={cn(
                        "mt-0.5 h-fit shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        LEVEL[item.level].tint,
                      )}
                    >
                      {LEVEL[item.level].label}
                    </span>
                    <span className="text-[14px] leading-relaxed">{item.say}</span>
                  </li>
                ))}
              </ol>
              {preview.unreachable.length > 0 && (
                <p className="mt-3 text-[13px] text-ink-soft">Couldn&apos;t reach: {preview.unreachable.join(", ")}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p role="alert" className="rounded-2xl bg-coral/15 px-4 py-3 text-[14px]">
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {morning.enabled && (
          <button type="button" onClick={() => save(false)} disabled={busy !== null} className={btn.danger}>
            {busy === "off" && <Spinner />} Turn off
          </button>
        )}
        <button
          type="button"
          onClick={() => save(true)}
          disabled={busy !== null || !agentId || !time}
          className={btn.primary}
        >
          {busy === "save" && <Spinner />} {morning.enabled ? "Save" : "Start my morning calls"}
        </button>
      </div>
    </div>
  );
}
