"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CaretDown, CaretRight, Check, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// "Get set up": one line that names the next thing worth doing, with the full list a tap away. It goes away
// when everything's done, or when they dismiss it (remembered on the account).

export interface GuideStep {
  id: string;
  label: string;
  hint: string;
  href: string;
  done: boolean;
}

function Ring({ done, total }: { done: number; total: number }) {
  const r = 17;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative grid size-11 shrink-0 place-items-center">
      <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="20" cy="20" r={r} fill="none" strokeWidth="4" className="stroke-ink/10" />
        <motion.circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          className="stroke-teal"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - done / total) }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        />
      </svg>
      <span className="text-[12px] font-semibold tabular-nums">
        {done}/{total}
      </span>
    </span>
  );
}

export function GetSetUp({ steps, seen }: { steps: GuideStep[]; seen: string[] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const done = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);
  if (hidden || !next) return null;

  const dismiss = () => {
    setHidden(true);
    void api("/me", {
      method: "PATCH",
      body: { seen: [...new Set([...seen, "guide"])] },
    })
      .then(() => router.refresh())
      .catch(() => undefined);
  };

  return (
    <section aria-label="Get set up" className="rounded-[24px] bg-plate ring-1 ring-line">
      <div className="flex items-center gap-3 p-3 pr-2 sm:gap-4 sm:p-4 sm:pr-3">
        <Ring done={done} total={steps.length} />
        <Link href={next.href} className="group min-w-0 flex-1">
          <span className="block text-[13px] text-ink-soft">Next step</span>
          <span className="flex items-center gap-1 text-[15px] font-semibold">
            <span className="truncate">{next.label}</span>
            <CaretRight className="shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Hide all steps" : "Show all steps"}
          className="grid size-10 shrink-0 place-items-center rounded-full text-[16px] text-ink-soft transition-colors hover:bg-ink/[0.06] hover:text-ink"
        >
          <CaretDown className={cn("transition-transform duration-200", open && "rotate-180")} />
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Hide setup"
          className="grid size-10 shrink-0 place-items-center rounded-full text-[16px] text-ink-soft transition-colors hover:bg-ink/[0.06] hover:text-ink"
        >
          <X />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden border-t border-line"
          >
            {steps.map((s) => (
              <li key={s.id}>
                <Link
                  href={s.href}
                  aria-disabled={s.done}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors",
                    s.done ? "pointer-events-none" : "hover:bg-ink/[0.03]",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full text-[12px]",
                      s.done ? "bg-teal text-[#0E0E10]" : "ring-2 ring-ink/15",
                    )}
                  >
                    {s.done && <Check weight="bold" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-[15px] font-medium", s.done && "text-ink-soft line-through")}>
                      {s.label}
                    </span>
                    {!s.done && <span className="block text-[13px] text-ink-soft">{s.hint}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </section>
  );
}
