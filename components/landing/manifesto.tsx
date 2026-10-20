"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { AgentFace } from "./agent-face";
import { agent } from "./agents";

const TEXT =
  "Callio agents aren't phone trees or chatbots. Each one has a name, a voice, and access to your calendar. They call when something needs you, answer when you ring, and make the calls you keep putting off.";

// Faces drifting around the paragraph, at different depths.
const DRIFTERS = [
  { name: "Noor", className: "left-[4%] top-[8%] size-14 sm:size-20", depth: 120 },
  { name: "Ravi", className: "right-[6%] top-[14%] size-10 sm:size-14", depth: 60 },
  { name: "Bea", className: "left-[10%] bottom-[10%] size-10 sm:size-16", depth: 90 },
  { name: "Sol", className: "right-[3%] bottom-[18%] size-14 sm:size-20", depth: 150 },
];

export function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.6"] });
  const words = TEXT.split(" ");

  return (
    <section ref={ref} className="relative mx-auto flex min-h-[90svh] max-w-6xl items-center justify-center px-4 py-24 sm:px-6">
      {DRIFTERS.map((d) => (
        <Drifter key={d.name} progress={scrollYProgress} {...d} />
      ))}
      <p className="relative max-w-3xl text-center font-display text-[clamp(1.6rem,4.2vw,3rem)] leading-[1.2] font-medium tracking-[-0.03em] text-ink">
        {words.map((word, i) => (
          <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
            {word}
          </Word>
        ))}
      </p>
    </section>
  );
}

function Word({
  children,
  progress,
  range,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <motion.span style={{ opacity }} className="inline">
      {children}{" "}
    </motion.span>
  );
}

function Drifter({
  name,
  className,
  depth,
  progress,
}: {
  name: string;
  className: string;
  depth: number;
  progress: MotionValue<number>;
}) {
  const y = useTransform(progress, [0, 1], [depth, -depth]);
  return (
    <motion.div style={{ y }} className={`absolute overflow-hidden rounded-full ${className}`} aria-hidden>
      <AgentFace agent={agent(name)} className="size-full" />
    </motion.div>
  );
}
