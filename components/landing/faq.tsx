"use client";

import { useId, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { Plus } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { LEGAL } from "@/lib/legal";
import { FAQ as QUESTIONS } from "@/lib/faq";
import { EASE_OUT, SplitWords } from "./motion";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const id = useId();

  return (
    <section
      id="faq"
      className="mx-auto grid grid-cols-1 max-w-6xl gap-10 px-5 py-24 sm:px-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-16 md:py-32"
    >
      <div className="md:sticky md:top-28 md:self-start">
        <h2
          ref={ref}
          className="font-display text-[clamp(2rem,5vw,4rem)] leading-[1.04] font-medium tracking-[-0.035em] text-ink"
        >
          <SplitWords show={inView} parts={[{ text: "Questions, answered" }]} />
        </h2>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-ink-soft sm:text-lg">
          Anything else? Write to{" "}
          <a href={`mailto:${LEGAL.operator.email}`} className="text-ink underline underline-offset-4">
            {LEGAL.operator.email}
          </a>
          . A person reads every message.
        </p>
      </div>

      <ul className="divide-y divide-line border-y border-line">
        {QUESTIONS.map((item, i) => {
          const isOpen = open === i;
          return (
            <li key={item.q}>
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`${id}-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left sm:py-6"
                >
                  <span className="text-[17px] font-semibold leading-snug text-ink sm:text-[19px]">{item.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full text-[18px] transition-colors",
                      isOpen ? "bg-ink text-page" : "bg-ink/[0.06] text-ink",
                    )}
                  >
                    <Plus weight="bold" />
                  </motion.span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`${id}-${i}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-xl pb-6 pr-12 text-[16px] leading-relaxed text-ink-soft">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
