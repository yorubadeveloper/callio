"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  CalendarDots,
  ChatCircleText,
  CheckCircle,
  Monitor,
  Phone,
  Repeat,
  SunHorizon,
  Warning,
  X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { AgentFace } from "@/components/landing/agent-face";
import type { PersonalAgent } from "@/lib/agents/personalize";
import { api } from "@/lib/api";
import { clockTime, dayLabel, when } from "@/lib/format";
import type { AppNotification, Schedule } from "@/lib/types";
import { NotificationSetup } from "./notification-setup";
import { btn, PageTitle } from "./ui";
import { Spinner } from "@/components/brand/logo-loader";

const REPEAT: Record<Schedule["repeat"], string | null> = {
  none: null,
  daily: "Every day",
  weekdays: "Weekdays",
  weekly: "Every week",
};

export function UpcomingView({
  schedules: initial,
  notifications,
  agents,
  timezone,
  locale,
}: {
  schedules: Schedule[];
  notifications: AppNotification[];
  agents: PersonalAgent[];
  timezone: string;
  locale: string;
}) {
  const [schedules, setSchedules] = useState(() => [...initial].sort((a, b) => a.when.localeCompare(b.when)));
  const byId = new Map(agents.map((a) => [a.id, a]));
  const unread = notifications.some((n) => !n.read);

  // Opening this page counts as seeing everything in Recent.
  useEffect(() => {
    if (unread) void api("/notifications/read-all", { method: "POST" }).catch(() => undefined);
  }, [unread]);

  const groups = schedules.reduce<Map<string, Schedule[]>>((map, s) => {
    const label = dayLabel(s.when, timezone, locale);
    map.set(label, [...(map.get(label) ?? []), s]);
    return map;
  }, new Map());

  return (
    <>
      <PageTitle
        title="Upcoming"
        subtitle="Calls and reminders your agents have lined up. Ask any agent to add, move or cancel one."
      />
      <NotificationSetup compact />

      <section className="mt-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">Coming up</h2>
        {schedules.length === 0 ? (
          <div className="mt-3 rounded-[28px] bg-plate p-6 ring-1 ring-line">
            <span className="grid size-12 place-items-center rounded-2xl bg-amber/30 text-[24px]">
              <CalendarDots weight="fill" />
            </span>
            <p className="mt-4 text-[17px] font-semibold">Nothing lined up yet</p>
            <p className="mt-1 text-[15px] text-ink-soft">
              On a call, try “Call me every weekday at 8 with my plan for the day” or “Remind me at 6 to call my mum.”
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-6">
            {[...groups].map(([label, items]) => (
              <div key={label}>
                <p className="mb-2 px-1 text-[15px] font-semibold">{label}</p>
                <ul className="divide-y divide-line overflow-hidden rounded-[28px] bg-plate ring-1 ring-line">
                  <AnimatePresence initial={false}>
                    {items.map((s) => (
                      <ScheduleRow
                        key={s.id}
                        schedule={s}
                        agent={byId.get(s.agent_id)}
                        timezone={timezone}
                        locale={locale}
                        onCancelled={() => setSchedules((list) => list.filter((x) => x.id !== s.id))}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="recent" className="mt-10 scroll-mt-24">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">Recent</h2>
        {notifications.length === 0 ? (
          <p className="mt-3 rounded-[28px] bg-plate p-5 text-[15px] text-ink-soft ring-1 ring-line">
            Reminders, call recaps and task updates show up here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-[28px] bg-plate ring-1 ring-line">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                <span
                  className={cn(
                    "mt-0.5 grid size-9 shrink-0 place-items-center rounded-full text-[17px]",
                    n.kind === "reminder"
                      ? "bg-amber/30"
                      : n.kind === "alert"
                        ? "bg-coral/30"
                        : n.kind === "call"
                        ? "bg-teal/25"
                        : n.kind === "task"
                          ? "bg-peri/30"
                          : "bg-coral/20",
                  )}
                >
                  {n.kind === "reminder" ? (
                    <Bell weight="fill" />
                  ) : n.kind === "alert" ? (
                    <Warning weight="fill" />
                  ) : n.kind === "call" ? (
                    <Phone weight="fill" />
                  ) : n.kind === "task" ? (
                    <Monitor weight="fill" />
                  ) : (
                    <CheckCircle weight="fill" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[15px] font-semibold">
                    {n.title}
                    {!n.read && <span className="size-2 rounded-full bg-coral" aria-label="New" />}
                  </p>
                  <p className="mt-0.5 text-[14px] text-ink-soft">{n.body}</p>
                </div>
                <span className="shrink-0 text-[12px] text-ink-soft">{when(n.created_at, timezone, locale)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function ScheduleRow({
  schedule: s,
  agent,
  timezone,
  locale,
  onCancelled,
}: {
  schedule: Schedule;
  agent?: PersonalAgent;
  timezone: string;
  locale: string;
  onCancelled: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const repeat = REPEAT[s.repeat];

  const cancel = async () => {
    setBusy(true);
    try {
      await api(`/schedules/${s.id}`, { method: "DELETE" });
      onCancelled();
    } catch {
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-3 px-4 py-3.5 sm:px-5"
    >
      <span className="relative size-11 shrink-0">
        <span className="block size-11 overflow-hidden rounded-full">
          {agent && <AgentFace agent={agent} className="size-full" />}
        </span>
        <span
          className={cn(
            "absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full text-[11px] ring-2 ring-plate",
            s.type === "call" ? "bg-teal text-[#0E0E10]" : "bg-amber text-[#0E0E10]",
          )}
        >
          {s.briefing ? (
            <SunHorizon weight="fill" />
          ) : s.contact_name ? (
            <ChatCircleText weight="fill" />
          ) : s.type === "call" ? (
            <Phone weight="fill" />
          ) : (
            <Bell weight="fill" />
          )}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-semibold">{s.text}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[14px] text-ink-soft">
          <span className="font-mono text-[13px] text-ink">{clockTime(s.when, timezone, locale)}</span>
          <span>
            {s.contact_name
              ? `${agent?.name ?? "Your agent"} calls ${s.contact_name}`
              : `${s.briefing ? "Morning call" : s.type === "call" ? "Call" : "Reminder"}${agent ? ` from ${agent.name}` : ""}`}
          </span>
          {repeat && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink/[0.06] px-2 py-0.5 text-[12px] font-medium text-ink">
              <Repeat weight="bold" /> {repeat}
            </span>
          )}
        </p>
      </div>
      {confirming ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={() => setConfirming(false)} className={cn(btn.soft, "h-9 px-3 text-[13px]")}>
            Keep
          </button>
          <button type="button" onClick={cancel} disabled={busy} className={cn(btn.danger, "h-9 px-3 text-[13px]")}>
            {busy && <Spinner />} {repeat ? "Cancel all" : "Cancel"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Cancel: ${s.text}`}
          className="grid size-10 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-coral/15 hover:text-[#B0412C]"
        >
          <X weight="bold" />
        </button>
      )}
    </motion.li>
  );
}
