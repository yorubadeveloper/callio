"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Plus } from "@phosphor-icons/react";
import { AgentFace } from "./agent-face";
import { agent, AMBER, CORAL, PERI, TEAL } from "./agents";
import { EASE_OUT, SplitWords } from "./motion";

const TEMPLATES = [
  { name: "Laura", color: TEAL },
  { name: "Theo", color: AMBER },
  { name: "Ada", color: CORAL },
  { name: "Maya", color: PERI },
  { name: "Kemi", color: TEAL },
  { name: "Mateo", color: AMBER },
];

export function Templates() {
  const reduce = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingInView = useInView(headingRef, { once: true, amount: 0.6 });
  return (
    <section id="agents" className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32">
      <h2 ref={headingRef} className="font-display text-[clamp(2rem,5vw,4rem)] leading-[1.04] font-medium tracking-[-0.035em] text-ink">
        <SplitWords show={headingInView} parts={[{ text: "Start with an agent" }]} />
      </h2>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft sm:text-lg">
        Pick one, change its name and voice if you like, and choose when it calls.
      </p>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map(({ name, color }, i) => {
          const a = agent(name);
          return (
            <motion.li
              key={name}
              initial={reduce ? false : { opacity: 0, y: 40, rotate: i % 2 ? 1.5 : -1.5 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: (i % 3) * 0.08, ease: EASE_OUT }}
              className="group relative flex flex-col rounded-[28px] p-6 text-[#121212]"
              style={{ background: color }}
            >
              <div className="flex items-start justify-between">
                <span className="size-16 overflow-hidden rounded-full ring-4 ring-white/60 transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:-rotate-6 group-hover:scale-110">
                  <AgentFace agent={a} className="size-full" />
                </span>
                <Link
                  href="/signin"
                  aria-label={`Add ${a.name}, ${a.role}`}
                  className="grid size-10 place-items-center rounded-full bg-[#121212] text-white transition-transform group-hover:rotate-90"
                >
                  <Plus weight="bold" />
                </Link>
              </div>
              <p className="mt-6 font-display text-[30px] leading-none font-medium tracking-[-0.03em]">{a.name}</p>
              <p className="mt-1.5 text-[14px] font-semibold">{a.role}</p>
              <p className="mt-3 flex-1 text-[15px] leading-snug text-[#121212]/80">{a.pitch}</p>
              <p className="mt-5 self-start rounded-full bg-[#121212]/10 px-3 py-1 font-mono text-[12px]">
                {a.schedule}
              </p>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
