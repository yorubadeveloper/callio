"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { Check } from "@phosphor-icons/react";
import { AgentFace } from "./agent-face";
import { agent } from "./agents";
import { EASE_OUT, SplitWords } from "./motion";

const REMEMBERED = ["Billing questions go to Dana", "Mondays: under a minute", "Weather: only if it rains"];

// 0 nothing · 1 your message · 2 Laura typing · 3 Laura replies · 4 memory saved
const STEP_AT_MS = [0, 300, 1100, 2300, 2900];

export function Memory() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [played, setPlayed] = useState(0);
  // Reduced motion skips the little performance and shows the finished exchange.
  const step = reduce && inView ? 4 : played;

  useEffect(() => {
    if (!inView || reduce) return;
    const timers = STEP_AT_MS.slice(1).map((ms, i) => setTimeout(() => setPlayed(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce]);

  const laura = agent("Laura");
  const pop = {
    initial: { opacity: 0, y: 10, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.4, ease: EASE_OUT },
  };

  return (
    <section className="mx-auto grid grid-cols-1 max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 md:grid-cols-2 md:py-36">
      <div>
        <h2 className="font-display text-[clamp(2rem,5vw,4rem)] leading-[1.04] font-medium tracking-[-0.035em] text-ink">
          <SplitWords show={inView} parts={[{ text: "They remember how you like it" }]} />
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft sm:text-lg">
          Say it once and it sticks. Each agent keeps notes from every call, and you can read or change them any time.
        </p>
      </div>

      <div ref={ref} className="rounded-[28px] bg-plate p-5 ring-1 ring-line sm:p-7">
        <div className="flex items-center gap-3">
          <span className="size-10 overflow-hidden rounded-full">
            <AgentFace agent={laura} className="size-full" />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-ink">Laura</p>
            <p className="text-[13px] text-ink-soft">Morning brief · on a call</p>
          </div>
        </div>

        <div className="mt-6 min-h-[150px] space-y-4 text-[15px] leading-snug">
          {step >= 1 && (
            <motion.p {...pop} className="ml-auto max-w-[85%] origin-bottom-right rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-page">
              Keep Mondays under a minute, and skip the weather unless it&apos;s raining.
            </motion.p>
          )}
          <AnimatePresence mode="wait">
            {step === 2 && (
              <motion.span
                key="typing"
                {...pop}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="inline-flex gap-1 rounded-full bg-line px-3 py-2.5"
                aria-label="Laura is replying"
              >
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="size-1.5 rounded-full bg-ink-soft"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.12 }}
                  />
                ))}
              </motion.span>
            )}
            {step >= 3 && (
              <motion.p key="reply" {...pop} className="max-w-[85%] text-ink">
                Got it. Short Mondays, and I&apos;ll only mention rain.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-7 border-t border-line pt-5">
          <p className="text-[12px] font-medium uppercase tracking-wider text-ink-soft">Laura remembers</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {REMEMBERED.map((item, i) => {
              // The first note was already known; the other two arrive from this call.
              const visible = i === 0 || step >= 4;
              return (
                <motion.li
                  key={item}
                  initial={i === 0 ? false : { opacity: 0, scale: 0.6 }}
                  animate={visible ? { opacity: 1, scale: 1 } : undefined}
                  transition={{ type: "spring", stiffness: 380, damping: 18, delay: visible && i > 0 ? (i - 1) * 0.15 : 0 }}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-[#121212]"
                  style={{ background: i === 0 ? "#D9DEF8" : "#CFE7E5" }}
                >
                  <Check weight="bold" className="text-[12px]" />
                  {item}
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
