"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Check, Phone, WarningCircle } from "@phosphor-icons/react";
import type { AgentProfile } from "@/lib/agents/catalog";
import { CREDIT_COSTS } from "@/lib/pricing";
import type { CallSnapshot } from "@/lib/call/types";

export function CallSummary({
  agent,
  snap,
  demo,
  onCallAgain,
}: {
  agent: AgentProfile;
  snap: CallSnapshot;
  demo: boolean;
  onCallAgain: () => void;
}) {
  const seconds = snap.startedAt && snap.endedAt ? Math.round((snap.endedAt - snap.startedAt) / 1000) : 0;
  // Billing rounds up to the started minute; a call that never connected is free.
  const credits = seconds > 0 ? Math.ceil(seconds / 60) * CREDIT_COSTS.onlineMinute : 0;
  const done = snap.actions.filter((a) => a.state !== "running");

  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-end justify-center bg-black/40 backdrop-blur-sm lg:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.section
        role="dialog"
        aria-label="Call summary"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="max-h-[85dvh] w-full overflow-y-auto rounded-t-[32px] bg-[#1A1A1D] px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-3 lg:max-w-lg lg:rounded-[32px] lg:pb-6"
      >
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-white/15" />
        <p className="text-[13px] text-white/50">Call with {agent.name}</p>
        <div className="mt-1 flex items-baseline gap-3">
          <p className="font-display text-[34px] leading-none font-medium tracking-[-0.04em]">
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </p>
          <p className="text-sm text-white/50">
            {demo ? "Sample call · free" : `${credits} ${credits === 1 ? "credit" : "credits"}`}
          </p>
        </div>

        <h2 className="mt-7 text-[12px] font-medium uppercase tracking-wider text-white/45">What {agent.name} did</h2>
        {done.length ? (
          <ul className="mt-3 space-y-2.5">
            {done.map((a) => (
              <li key={a.id} className="flex items-start gap-3 text-[15px]">
                {a.state === "done" ? (
                  <Check weight="bold" className="mt-1 shrink-0 text-teal" />
                ) : (
                  <WarningCircle weight="fill" className="mt-1 shrink-0 text-coral" />
                )}
                {a.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[15px] text-white/60">Just a conversation this time.</p>
        )}

        {snap.captions.length > 0 && (
          <details className="group mt-7 rounded-2xl bg-white/5 px-4 py-3">
            <summary className="cursor-pointer list-none text-[15px] font-medium marker:hidden">
              Transcript <span className="text-white/40 group-open:hidden">· {snap.captions.length} lines</span>
            </summary>
            <div className="mt-3 space-y-2.5 text-[14px] leading-snug">
              {snap.captions.map((c) => (
                <p key={c.id} className={c.who === "agent" ? "text-white" : "text-white/55"}>
                  <span className="mr-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    {c.who === "agent" ? agent.name : "You"}
                  </span>
                  {c.text}
                </p>
              ))}
            </div>
          </details>
        )}

        {demo ? (
          <div className="mt-8 rounded-[24px] bg-white/[0.06] p-5 ring-1 ring-white/10">
            <p className="font-display text-[22px] leading-tight font-medium tracking-[-0.03em]">
              Now make {agent.name} yours.
            </p>
            <p className="mt-2 text-[14px] text-white/60">
              Name your agent, pick its voice, and talk for real. Free to start, no card needed.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onCallAgain}
                className="rounded-full bg-white/10 py-3.5 text-[15px] font-semibold"
              >
                Replay
              </button>
              <Link
                href="/signin"
                className="rounded-full bg-teal py-3.5 text-center text-[15px] font-semibold text-[#0E0E10]"
              >
                Start free
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Link href="/app" className="rounded-full bg-white/10 py-3.5 text-center text-[15px] font-semibold">
              Done
            </Link>
            <button
              type="button"
              onClick={onCallAgain}
              className="flex items-center justify-center gap-2 rounded-full bg-teal py-3.5 text-[15px] font-semibold text-[#0E0E10]"
            >
              <Phone weight="fill" /> Call again
            </button>
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}
