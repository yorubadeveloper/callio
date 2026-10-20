"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AgentFace } from "@/components/landing/agent-face";
import { AGENTS } from "@/components/landing/agents";
import { LevelBars } from "@/components/landing/level-bars";

const LINES: Record<string, string> = {
  Laura: "Morning! Your 10 o'clock moved to 11, and it'll rain after four.",
  Juno: "Your call with Dana is in ten. Last time you promised her the deck.",
  Kemi: "You said you'd run at six. Still on?",
  Ada: "Called your mum. She's in good spirits and asked about Sunday.",
  Theo: "Booked: table for four, Friday at eight, under your name.",
  Mateo: "¿Listo para practicar? Ten minutes, I promise.",
};
const ORDER = Object.keys(LINES);

/** Agents taking turns to "call", for the sign-in page. */
export function IncomingCalls({ compact = false }: { compact?: boolean }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((n) => (n + 1) % ORDER.length), 3600);
    return () => clearInterval(t);
  }, [reduce]);
  const agent = AGENTS.find((a) => a.name === ORDER[i])!;

  if (compact) {
    return (
      <div className="flex -space-x-3" aria-hidden>
        {ORDER.slice(0, 5).map((name, n) => (
          <motion.span
            key={name}
            initial={reduce ? false : { opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1 + n * 0.06, type: "spring", stiffness: 300, damping: 18 }}
            className="size-12 overflow-hidden rounded-full ring-4 ring-page"
          >
            <AgentFace agent={AGENTS.find((a) => a.name === name)!} className="size-full" />
          </motion.span>
        ))}
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={agent.name}
          initial={{ opacity: 0, y: 30, scale: 0.94, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -24, scale: 0.96, filter: "blur(6px)" }}
          transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
          className="rounded-[32px] bg-[#0E0E10] p-6 text-[#F3F2EE] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.5)]"
        >
          <div className="flex items-center gap-4">
            <span className="relative size-16 shrink-0">
              <span
                className="ring-pulse absolute inset-0 rounded-full border-2"
                style={{ borderColor: agent.face.skin }}
              />
              <span className="relative block size-full overflow-hidden rounded-full">
                <AgentFace agent={agent} className="size-full" />
              </span>
            </span>
            <div className="min-w-0">
              <p className="font-display text-[26px] leading-none font-medium tracking-[-0.03em]">{agent.name}</p>
              <p className="mt-1.5 flex items-center gap-2 text-[13px] text-white/55">
                {agent.role} · calling <LevelBars color={agent.face.skin} className="h-3" />
              </p>
            </div>
          </div>
          <p className="mt-5 text-[17px] leading-snug text-white/90">&ldquo;{LINES[agent.name]}&rdquo;</p>
        </motion.div>
      </AnimatePresence>
      <div className="mt-6 flex justify-center gap-1.5">
        {ORDER.map((name, n) => (
          <span
            key={name}
            className={`h-1.5 rounded-full transition-all duration-500 ${n === i ? "w-6 bg-ink" : "w-1.5 bg-line"}`}
          />
        ))}
      </div>
    </div>
  );
}
