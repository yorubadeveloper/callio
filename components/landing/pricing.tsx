"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { PLANS, TOP_UPS, type Plan } from "@/lib/pricing";
import { EASE_OUT, SplitWords } from "./motion";

type Billing = "monthly" | "yearly";

export function Pricing() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingInView = useInView(headingRef, { once: true, amount: 0.6 });
  const smallestTopUp = TOP_UPS[0];

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2
            ref={headingRef}
            className="font-display text-[clamp(2rem,5vw,4rem)] leading-[1.04] font-medium tracking-[-0.035em] text-ink"
          >
            <SplitWords show={headingInView} parts={[{ text: "Start free. Pay for talk time." }]} />
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft sm:text-lg">
            Every plan comes with monthly credits. Spend them on calls and tasks, and top up whenever you need more.
          </p>
        </div>
        <BillingToggle value={billing} onChange={setBilling} />
      </div>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p, i) => (
          <PlanCard key={p.id} plan={p} billing={billing} index={i} />
        ))}
      </ul>

      <p className="mt-6 text-sm text-ink-soft">
        One credit is a minute of talking. Top up any time from ${smallestTopUp.price}. Prices are the same in dollars and
        euros; tax is added at checkout.
      </p>
    </section>
  );
}

function BillingToggle({ value, onChange }: { value: Billing; onChange: (b: Billing) => void }) {
  return (
    <div role="radiogroup" aria-label="Billing period" className="relative flex self-start rounded-full bg-plate p-1 ring-1 ring-line">
      {(["monthly", "yearly"] as const).map((b) => (
        <button
          key={b}
          type="button"
          role="radio"
          aria-checked={value === b}
          onClick={() => onChange(b)}
          className={cn(
            "relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300",
            value === b ? "text-page" : "text-ink-soft hover:text-ink",
          )}
        >
          {value === b && (
            <motion.span
              layoutId="billing-pill"
              className="absolute inset-0 -z-10 rounded-full bg-ink"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          {b === "monthly" ? "Monthly" : "Yearly"}
          {b === "yearly" && <span className={cn("ml-1.5 text-xs", value === b ? "text-amber" : "text-teal")}>2 months free</span>}
        </button>
      ))}
    </div>
  );
}

function PlanCard({ plan: p, billing, index }: { plan: Plan; billing: Billing; index: number }) {
  const reduce = useReducedMotion();
  const price = billing === "yearly" ? p.yearlyPerMonth : p.monthly;
  const dark = p.highlight;

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: index * 0.07, ease: EASE_OUT }}
      className={cn(
        "relative flex flex-col rounded-[28px] p-6",
        dark ? "bg-[#121212] text-[#F3F2EE]" : "bg-plate text-ink ring-1 ring-line",
      )}
    >
      {dark && (
        <span className="absolute right-5 top-5 rounded-full bg-amber px-2.5 py-1 text-[12px] font-semibold text-[#121212]">
          Most popular
        </span>
      )}
      <p className="font-display text-[26px] leading-none font-medium tracking-[-0.03em]">{p.name}</p>
      <p className={cn("mt-2 text-sm", dark ? "text-[#F3F2EE]/65" : "text-ink-soft")}>{p.tagline}</p>

      <div className="mt-6 flex items-baseline gap-1.5">
        <span className="font-display text-[44px] leading-none font-medium tracking-[-0.04em]">
          $
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={price}
              className="inline-block"
              initial={{ y: "60%", opacity: 0, filter: "blur(4px)" }}
              animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
              exit={{ y: "-60%", opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
            >
              {price}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className={cn("text-sm", dark ? "text-[#F3F2EE]/65" : "text-ink-soft")}>
          {p.monthly === 0 ? "forever" : "/ month"}
        </span>
      </div>
      <p className={cn("mt-1 h-5 text-xs", dark ? "text-[#F3F2EE]/50" : "text-ink-soft")}>
        {billing === "yearly" && p.monthly > 0 ? `$${p.yearlyPerMonth * 12} billed yearly` : ""}
      </p>

      <ul className="mt-5 flex-1 space-y-2.5 text-[14px]">
        {p.features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <Check weight="bold" className={cn("mt-0.5 shrink-0", dark ? "text-amber" : "text-teal")} />
            {f}
          </li>
        ))}
      </ul>

      <Link
        href={p.id === "free" ? "/signin" : `/signin?plan=${p.id}&billing=${billing}`}
        className={cn(
          "mt-7 rounded-full py-3 text-center text-[15px] font-semibold transition-transform duration-300 hover:-translate-y-0.5",
          dark ? "bg-[#F3F2EE] text-[#121212]" : "bg-ink text-page",
        )}
      >
        {p.id === "free" ? "Start free" : `Choose ${p.name}`}
      </Link>
    </motion.li>
  );
}
