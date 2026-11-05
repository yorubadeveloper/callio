"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { DeviceMobileSpeaker, Phone } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { AgentFace } from "./agent-face";
import { AGENTS } from "./agents";
import { LevelBars } from "./level-bars";
import { AfterIntro, EASE_OUT, SplitWords, useIntroDone } from "./motion";

// A rotary dial: ten holes 30° apart, clockwise from 3 o'clock round to 6 o'clock,
// leaving the gap at bottom-right where the finger stop sits.
const HOLE_RADIUS = 38; // % of the dial, centre of each hole
const HOLE_SIZE = 17; // % of the dial
const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const holeAngle = (i: number) => 90 - 30 * i; // degrees clockwise from 12 o'clock

function polar(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { left: `${50 + radius * Math.sin(a)}%`, top: `${50 - radius * Math.cos(a)}%` };
}

// The order agents ring in, so it doesn't just walk round the dial.
const RING_ORDER = [0, 3, 6, 1, 8, 4, 2, 9, 5, 7];
const RING_MS = 2600;

export function DialHero() {
  const reduce = useReducedMotion();
  const done = useIntroDone();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const ringing = picked ?? RING_ORDER[step % RING_ORDER.length];
  const caller = AGENTS[ringing];

  useEffect(() => {
    if (!done) return;
    if (picked !== null) {
      const t = setTimeout(() => setPicked(null), RING_MS * 1.5);
      return () => clearTimeout(t);
    }
    const t = setInterval(() => setStep((s) => s + 1), RING_MS);
    return () => clearInterval(t);
  }, [done, picked]);

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  // Scrolling away "dials": the plate turns clockwise towards the finger stop and sinks back.
  const dialTurn = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 55]);
  const dialScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 0.86]);
  const fade = useTransform(scrollYProgress, [0.1, 0.85], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-svh flex-col items-center justify-center px-4 pb-10 pt-24 sm:pt-28"
    >
      <motion.div
        style={{ opacity: fade, scale: dialScale }}
        className="relative aspect-square w-[min(94vw,700px,calc(100svh-220px))] min-w-[300px]"
      >
        <motion.div className="absolute inset-0" style={{ rotate: dialTurn }}>
          {/* The plate springs back from a wind-up, like a dial being released. */}
          <motion.div
            className="absolute inset-0"
            initial={reduce ? false : { rotate: -70, scale: 0.7, opacity: 0 }}
            animate={done ? { rotate: 0, scale: 1, opacity: 1 } : undefined}
            transition={{
              rotate: { type: "spring", stiffness: 38, damping: 9 },
              scale: { type: "spring", stiffness: 90, damping: 14 },
              opacity: { duration: 0.35 },
            }}
          >
            <div className="absolute inset-[1.5%] rounded-full bg-plate shadow-[0_1px_0_var(--line),0_30px_80px_-30px_rgb(18_18_18/0.25)] ring-1 ring-line" />

            {/* finger stop */}
            <div
              className="absolute h-[2.2%] w-[9%] rounded-full bg-ink"
              style={{ ...polar(135, 46.5), transform: "translate(-50%, -50%) rotate(-45deg)" }}
            />

            {AGENTS.map((a, i) => {
              const isRinging = i === ringing && done;
              const enterDelay = 0.3 + i * 0.065;
              return (
                <div key={a.name}>
                  <motion.span
                    className="absolute hidden -translate-x-1/2 -translate-y-1/2 font-mono text-xs text-ink-soft sm:block"
                    style={polar(holeAngle(i), HOLE_RADIUS - 12.2)}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={done ? { opacity: 1 } : undefined}
                    transition={{ duration: 0.4, delay: enterDelay + 0.2 }}
                    aria-hidden
                  >
                    {DIGITS[i]}
                  </motion.span>
                  <motion.button
                    type="button"
                    onClick={() => setPicked(i)}
                    aria-label={`${a.name}, ${a.role}`}
                    className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-plate"
                    style={{ ...polar(holeAngle(i), HOLE_RADIUS), width: `${HOLE_SIZE}%`, height: `${HOLE_SIZE}%` }}
                    initial={reduce ? false : { opacity: 0, scale: 0.3 }}
                    animate={done ? { opacity: 1, scale: 1 } : undefined}
                    transition={{ delay: enterDelay, type: "spring", stiffness: 300, damping: 16 }}
                  >
                    {isRinging && (
                      <>
                        <span className="ring-pulse absolute inset-0 rounded-full border-[3px]" style={{ borderColor: a.face.skin }} />
                        <span className="ring-pulse-late absolute inset-0 rounded-full border-[3px]" style={{ borderColor: a.face.skin }} />
                      </>
                    )}
                    <span
                      className={cn(
                        "relative block size-full overflow-hidden rounded-full shadow-[inset_0_2px_6px_rgb(0_0_0/0.18)] ring-1 ring-black/5 transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-105",
                        isRinging && "scale-[1.08] group-hover:scale-[1.08]",
                      )}
                    >
                      <AgentFace agent={a} className="size-full" />
                    </span>
                  </motion.button>
                </div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* centre label */}
        <div className="absolute inset-[24%] flex flex-col items-center justify-center text-center">
          <h1 className="text-balance font-display text-[clamp(1.45rem,6vw,3.6rem)] leading-[1.04] font-medium tracking-[-0.04em] text-ink">
            <SplitWords
              show={done}
              delay={0.45}
              parts={[{ text: "Agents that" }, { text: "pick up", italic: true }, { text: "the phone" }]}
            />
          </h1>
          <AfterIntro delay={0.95}>
            <Link
              href="/signin"
              className="mt-4 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-page transition-transform duration-300 hover:-translate-y-0.5 sm:mt-6 sm:px-6 sm:py-3 sm:text-base"
            >
              Start free
            </Link>
          </AfterIntro>
        </div>
      </motion.div>

      {/* caller ID */}
      <AfterIntro delay={1.15} className="mt-2 h-12 sm:mt-4">
        <div aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={caller.name}
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="flex items-center gap-3 rounded-full bg-plate py-1.5 pl-1.5 pr-4 ring-1 ring-line"
            >
              <span className="size-8 overflow-hidden rounded-full">
                <AgentFace agent={caller} className="size-full" />
              </span>
              <span className="text-sm text-ink">
                <span className="font-semibold">{caller.name}</span>
                <span className="text-ink-soft"> is calling · {caller.role}</span>
              </span>
              <LevelBars color={caller.face.skin} />
            </motion.div>
          </AnimatePresence>
        </div>
      </AfterIntro>

      <AfterIntro delay={1.3} className="mt-6 flex items-center gap-3 text-sm text-ink-soft">
        <span>Talk in</span>
        <Channel icon={<DeviceMobileSpeaker weight="fill" />} label="The app" />
        <Channel icon={<Phone weight="fill" />} label="Phone" />
      </AfterIntro>
    </section>
  );
}

function Channel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink">
      <span className="text-[15px]">{icon}</span>
      {label}
    </span>
  );
}
