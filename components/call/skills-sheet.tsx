"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "@phosphor-icons/react";
import type { AgentProfile } from "@/lib/agents/catalog";
import { SKILLS } from "@/lib/agents/skills";
import { plan } from "@/lib/pricing";

/** "What can I ask?" — the agent's skills, its specialities first, with things to say. */
export function SkillsSheet({ open, onClose, agent }: { open: boolean; onClose: () => void; agent: AgentProfile }) {
  const focus = new Set(agent.persona.focus);
  const ordered = [...SKILLS].sort((a, b) => Number(focus.has(b.id)) - Number(focus.has(a.id)));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-40 flex items-end justify-center bg-black/50 backdrop-blur-sm lg:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            role="dialog"
            aria-label={`What you can ask ${agent.name}`}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="max-h-[80dvh] w-full overflow-y-auto rounded-t-[32px] bg-[#1A1A1D] px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-5 lg:max-w-xl lg:rounded-[32px] lg:pb-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[24px] font-medium tracking-[-0.03em]">
                Things you can ask {agent.name}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-10 place-items-center rounded-full bg-white/10"
              >
                <X />
              </button>
            </div>
            <ul className="mt-5 space-y-6">
              {ordered.map((s) => (
                <li key={s.id}>
                  <div className="flex items-center gap-2">
                    <p className="text-[16px] font-semibold">{s.title}</p>
                    {s.status === "soon" ? (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/60">Soon</span>
                    ) : s.minPlan !== "free" ? (
                      <span className="rounded-full bg-amber/20 px-2 py-0.5 text-[11px] text-amber">
                        {plan(s.minPlan).name}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[14px] text-white/60">{s.summary}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {s.examples.map((e) => (
                      <span key={e} className="rounded-full bg-white/8 px-3 py-1.5 text-[13px] text-white/85">
                        “{e}”
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
