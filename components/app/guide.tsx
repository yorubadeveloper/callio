"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CaretRight, Check, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// "Get set up": the few things that make Callio useful, ticked off from what's really set up. It goes away
// when everything's done, or when they dismiss it (remembered on the account).

export interface GuideStep {
  id: string;
  label: string;
  hint: string;
  href: string;
  done: boolean;
}

export function GetSetUp({ steps, seen }: { steps: GuideStep[]; seen: string[] }) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const done = steps.filter((s) => s.done).length;
  if (hidden || done === steps.length) return null;

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
    <section className="relative overflow-hidden rounded-[24px] bg-plate p-4 ring-1 ring-line sm:rounded-[28px] sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-coral/30 blur-3xl dark:bg-coral/15"
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[20px] font-medium tracking-[-0.03em] sm:text-[22px]">Get set up</h2>
          <p className="mt-0.5 text-[14px] text-ink-soft">
            {done} of {steps.length} done. Each one makes your agents more useful.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Hide this list"
          className="grid size-10 shrink-0 place-items-center rounded-full text-[18px] text-ink-soft transition-colors hover:bg-ink/[0.06] hover:text-ink"
        >
          <X />
        </button>
      </div>
      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-ink/10">
        <motion.div
          className="h-full rounded-full bg-teal"
          initial={false}
          animate={{ width: `${(done / steps.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        />
      </div>
      <ul className="relative mt-3 grid gap-2 sm:mt-4 sm:grid-cols-2">
        {steps.map((s) => (
          // On phones only what's left is listed; the bar and the count show the rest.
          <li key={s.id} className={cn(s.done && "hidden sm:block")}>
            <Link
              href={s.href}
              aria-disabled={s.done}
              className={cn(
                "flex min-h-14 items-center gap-3 rounded-2xl px-3.5 py-3 ring-1 ring-line transition-colors",
                s.done ? "pointer-events-none bg-transparent" : "bg-page/70 hover:bg-ink/[0.04]",
              )}
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-[14px]",
                  s.done ? "bg-teal text-[#0E0E10]" : "ring-2 ring-ink/15",
                )}
              >
                {s.done && <Check weight="bold" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[15px] font-semibold", s.done && "text-ink-soft line-through")}>
                  {s.label}
                </span>
                {!s.done && <span className="block text-[13px] text-ink-soft">{s.hint}</span>}
              </span>
              {!s.done && <CaretRight className="shrink-0 text-ink-soft" />}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
