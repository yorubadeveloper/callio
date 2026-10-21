"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { IncomingCallScreen, InCallScreen, LockScreen, MessageCallScreen, PhoneFrame } from "./phone";
import { EASE_OUT, SplitWords } from "./motion";

const BEATS: { title: string; body: string; Screen: React.ComponentType<{ active: boolean }> }[] = [
  {
    title: "They call you",
    body: "A morning call with your day, the news and how your sites are doing. A heads-up the moment one goes down. Miss it in the app, and it rings your real phone.",
    Screen: IncomingCallScreen,
  },
  {
    title: "You call them",
    body: "Tap call in the app, or ring the Callio number from your own phone. It picks up straight away and already knows what you're working on.",
    Screen: InCallScreen,
  },
  {
    title: "They call your people",
    body: "Tell Mum you're doing fine, or pass a message on. Your agent rings them, says it's an AI calling for you, and tells you what they said.",
    Screen: MessageCallScreen,
  },
  {
    title: "Routines that run without you",
    body: "Every weekday at 7:30. Ten minutes before each meeting. Sunday night. Set it once and your agents keep the schedule.",
    Screen: LockScreen,
  },
];

// Screens push through in the direction you scroll, like cards in a stack.
const screenVariants = {
  enter: (dir: number) => ({ y: dir > 0 ? "9%" : "-9%", scale: 0.92, opacity: 0, filter: "blur(8px)" }),
  center: { y: "0%", scale: 1, opacity: 1, filter: "blur(0px)" },
  exit: (dir: number) => ({ y: dir > 0 ? "-5%" : "5%", scale: 1.04, opacity: 0, filter: "blur(6px)" }),
};

export function CallStage() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(BEATS.length - 1, Math.max(0, Math.floor(v * BEATS.length)));
    if (next !== active) {
      setDir(next > active ? 1 : -1);
      setActive(next);
    }
  });

  // The phone turns slowly as you scroll past, so it reads as an object, not a screenshot.
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });
  const rotateY = useTransform(smooth, [0, 1], reduce ? [0, 0] : [-14, 10]);
  const rotateX = useTransform(smooth, [0, 0.5, 1], reduce ? [0, 0, 0] : [6, 0, 4]);

  const beat = BEATS[active];
  const { Screen } = beat;

  return (
    <section ref={ref} id="how" className="relative h-[400svh]">
      <div className="sticky top-0 mx-auto grid h-svh max-w-6xl grid-rows-[auto_1fr] items-center gap-6 px-4 pb-6 pt-20 sm:px-6 md:grid-cols-[1fr_auto] md:grid-rows-1 md:gap-16 md:pb-0 md:pt-16">
        <div className="relative min-h-[178px] md:min-h-[300px]">
          <ol className="mb-6 flex gap-1.5" aria-label="Ways to use Callio">
            {BEATS.map((b, i) => (
              <ProgressBar key={b.title} index={i} progress={scrollYProgress} label={b.title} />
            ))}
          </ol>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={beat.title} exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}>
              <h2 className="font-display text-[clamp(2rem,5vw,4rem)] leading-[1.04] font-medium tracking-[-0.035em] text-ink">
                <SplitWords show parts={[{ text: beat.title }]} stagger={0.05} />
              </h2>
              <motion.p
                className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft sm:text-lg"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25, ease: EASE_OUT }}
              >
                {beat.body}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex h-full min-h-0 items-center justify-center [perspective:1400px]">
          <motion.div style={{ rotateY, rotateX }} className="h-[min(620px,100%)] max-h-full">
            <PhoneFrame className="h-full">
              <AnimatePresence initial={false} custom={dir}>
                <motion.div
                  key={beat.title}
                  custom={dir}
                  variants={screenVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.55, ease: EASE_OUT }}
                  className="absolute inset-0"
                >
                  <Screen active />
                </motion.div>
              </AnimatePresence>
            </PhoneFrame>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ProgressBar({ index, progress, label }: { index: number; progress: MotionValue<number>; label: string }) {
  const n = BEATS.length;
  const fill = useTransform(progress, [index / n, (index + 1) / n], [0, 1]);
  return (
    <li className="relative h-1 w-10 overflow-hidden rounded-full bg-line">
      <motion.span style={{ scaleX: fill }} className="absolute inset-0 origin-left rounded-full bg-ink" />
      <span className="sr-only">{label}</span>
    </li>
  );
}
