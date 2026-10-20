"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "motion/react";
import { LogoMark, Wordmark } from "@/components/brand/logo";
import { EASE_OUT, SplitWords } from "./motion";

export function Closing() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: inView ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.7, delay, ease: EASE_OUT },
  });

  return (
    <section ref={ref} className="flex flex-col items-center px-4 py-28 text-center md:py-40">
      <motion.div
        initial={{ opacity: 0, scale: 0.4, rotate: -90 }}
        animate={inView ? { opacity: 1, scale: 1, rotate: 0 } : undefined}
        transition={{ type: "spring", stiffness: 120, damping: 12 }}
      >
        <LogoMark speaking className="size-16 sm:size-20" />
      </motion.div>
      <h2 className="mt-8 font-display text-[clamp(3.5rem,13vw,10rem)] leading-[0.98] font-medium tracking-[-0.05em] text-ink">
        <SplitWords show={inView} delay={0.15} stagger={0.1} parts={[{ text: "Let's" }, { text: "talk", italic: true }]} />
      </h2>
      <motion.p {...rise(0.45)} className="mt-6 max-w-md text-[15px] leading-relaxed text-ink-soft sm:text-lg">
        Pick an agent and tap call. Your first conversation is free.
      </motion.p>
      <motion.div {...rise(0.6)}>
        <Link
          href="/signin"
          className="mt-8 inline-flex rounded-full bg-ink px-7 py-3.5 text-base font-semibold text-page transition-transform duration-300 hover:-translate-y-0.5"
        >
          Start free
        </Link>
      </motion.div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Wordmark className="text-lg text-ink" />
        <nav className="flex flex-wrap gap-x-6 gap-y-3">
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#agents" className="hover:text-ink">Agents</a>
          <a href="#pricing" className="hover:text-ink">Pricing</a>
          <Link href="/signin" className="hover:text-ink">Sign in</Link>
        </nav>
        <p>© 2026 Callio · callio.site</p>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 border-t border-line px-4 py-5 text-[13px] text-ink-soft sm:px-6">
        <Link href="/privacy" className="hover:text-ink">Privacy</Link>
        <Link href="/terms" className="hover:text-ink">Terms</Link>
        <Link href="/refunds" className="hover:text-ink">Refunds</Link>
        <Link href="/acceptable-use" className="hover:text-ink">Acceptable use</Link>
        <Link href="/imprint" className="hover:text-ink">Imprint</Link>
      </div>
    </footer>
  );
}
