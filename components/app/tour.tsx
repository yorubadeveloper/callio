"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { btn } from "./ui";

// A one-time spotlight tour of the app for new people: it points at the nav one place at a time, in the
// sidebar on desktop and the tab bar on phones. Finishing or skipping marks it seen on the account, and the
// You page can start it again (/app?tour=1).

interface Step {
  /** data-tour values to point at, first visible one wins. None = a centred card. */
  targets?: string[];
  title: string;
  body: string;
  /** Said instead when the first target isn't on screen (phones keep some pages under You). */
  fallbackBody?: string;
}

const STEPS: Step[] = [
  {
    title: "Welcome to Callio",
    body: "A quick look around before your first call. It takes about thirty seconds.",
  },
  {
    targets: ["home"],
    title: "Call your agents",
    body: "Home is where you call. Tap an agent and talk, just like a phone call. Say it however you'd say it.",
  },
  {
    targets: ["agents"],
    title: "Your agents",
    body: "Each one has its own name, voice and personality. Tweak them, or make more for different parts of your life.",
  },
  {
    targets: ["upcoming"],
    title: "They call you too",
    body: "Calls and reminders your agents booked show up here. Just ask on a call: “call me at 7 tomorrow”.",
  },
  {
    targets: ["memory"],
    title: "What they remember",
    body: "Your agents remember what matters about you. You can see, change or delete every bit of it here.",
  },
  {
    targets: ["contacts", "you"],
    title: "Your phone and your people",
    body: "Add your number so a missed call reaches your real phone, and the people your agent can call with a message.",
    fallbackBody:
      "Under You: add your number so a missed call reaches your real phone, and the people your agent can call with a message.",
  },
  {
    targets: ["connections", "you"],
    title: "Your morning call",
    body: "Set up one call each morning with your day, the news, the weather and how your sites are doing.",
    fallbackBody:
      "Under You, in Connections: one call each morning with your day, the news, the weather and your sites.",
  },
  {
    title: "You're all set",
    body: "Try saying: “Call me tomorrow at 8 with my briefing.” Your agent books it and rings you then.",
  },
];

const PAD = 6;

function visible(el: Element) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
}

function findTarget(step: Step): { rect: DOMRect; fallback: boolean } | null {
  for (const [i, key] of (step.targets ?? []).entries()) {
    const el = [...document.querySelectorAll(`[data-tour="${key}"]`)].find(visible);
    if (el) return { rect: el.getBoundingClientRect(), fallback: i > 0 };
  }
  return null;
}

export function Tour({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [index, setIndex] = useState<number | null>(null);
  const [target, setTarget] = useState<{
    rect: DOMRect;
    fallback: boolean;
  } | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const seen = useMemo(() => user.seen ?? [], [user.seen]);
  const toured = seen.includes("tour");

  // Start on Home: the first time, or when asked to from the You page.
  useEffect(() => {
    if (pathname !== "/app") return;
    const asked = new URLSearchParams(window.location.search).get("tour") === "1";
    if (asked) window.history.replaceState(null, "", "/app");
    if (!asked && (toured || started.current)) return;
    started.current = true;
    const t = setTimeout(() => setIndex(0), asked ? 150 : 700);
    return () => clearTimeout(t);
  }, [pathname, toured]);

  const step = index === null ? null : STEPS[index];

  const measure = useCallback(() => setTarget(step ? findTarget(step) : null), [step]);
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(measure);
    if (!step) return () => cancelAnimationFrame(frame);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure, step]);

  const close = useCallback(() => {
    setIndex(null);
    if (!seen.includes("tour")) {
      void api("/me", { method: "PATCH", body: { seen: [...seen, "tour"] } })
        .then(() => router.refresh())
        .catch(() => undefined);
    }
  }, [router, seen]);

  const next = useCallback(() => setIndex((i) => (i === null || i >= STEPS.length - 1 ? null : i + 1)), []);
  const back = useCallback(() => setIndex((i) => (i ? i - 1 : i)), []);
  const last = index === STEPS.length - 1;

  useEffect(() => {
    if (index === null) return;
    card.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") (last ? close : next)();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, last, close, next, back]);

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 320, damping: 34 };
  const r = target?.rect;
  const hole = r && {
    top: r.top - PAD,
    left: r.left - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
  };

  // Beside the sidebar, above the tab bar, below the top bar; centred when there's nothing to point at.
  let place: React.CSSProperties = {};
  if (typeof window !== "undefined") {
    const w = Math.min(340, window.innerWidth - 32);
    if (!hole)
      place = {
        left: (window.innerWidth - w) / 2,
        top: Math.max(16, window.innerHeight / 2 - 130),
      };
    else if (hole.left + hole.width < window.innerWidth * 0.4) {
      place = {
        left: hole.left + hole.width + 16,
        top: Math.min(Math.max(16, hole.top - 12), window.innerHeight - 280),
      };
    } else if (hole.top > window.innerHeight / 2) {
      place = {
        left: Math.min(Math.max(16, hole.left + hole.width / 2 - w / 2), window.innerWidth - w - 16),
        bottom: window.innerHeight - hole.top + 14,
      };
    } else {
      place = {
        left: Math.min(Math.max(16, hole.left + hole.width / 2 - w / 2), window.innerWidth - w - 16),
        top: hole.top + hole.height + 14,
      };
    }
  }

  return (
    <AnimatePresence>
      {step && (
        <motion.div
          key="tour"
          className="fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
        >
          {/* The dim, with a rounded hole over what we're pointing at. */}
          {hole ? (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute rounded-[18px] ring-2 ring-white/70"
              initial={false}
              animate={hole}
              transition={spring}
              style={{ boxShadow: "0 0 0 200vmax rgb(0 0 0 / 0.55)" }}
            />
          ) : (
            <div aria-hidden className="absolute inset-0 bg-black/55" />
          )}
          <motion.div
            ref={card}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-title"
            tabIndex={-1}
            className="absolute w-[min(340px,calc(100vw-32px))] rounded-[26px] bg-plate p-5 text-ink shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)] outline-none ring-1 ring-line"
            style={place}
            layout={!reduce}
            transition={spring}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={index}
                initial={{ opacity: 0, y: reduce ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduce ? 0 : -6 }}
                transition={{ duration: reduce ? 0 : 0.16 }}
              >
                <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-soft">
                  {index! > 0 && !last ? `${index} of ${STEPS.length - 2}` : "Tour"}
                </p>
                <h2
                  id="tour-title"
                  className="mt-1 font-display text-[22px] leading-tight font-medium tracking-[-0.03em]"
                >
                  {step.title}
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
                  {target?.fallback && step.fallbackBody ? step.fallbackBody : step.body}
                </p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-5 flex items-center gap-2">
              {index === 0 ? (
                <button type="button" onClick={close} className={`${btn.soft} h-10 px-4 text-[14px]`}>
                  Skip
                </button>
              ) : (
                !last && (
                  <button type="button" onClick={back} className={`${btn.soft} h-10 px-4 text-[14px]`}>
                    Back
                  </button>
                )
              )}
              <span className="ml-auto flex items-center gap-1.5" aria-hidden>
                {STEPS.slice(1, -1).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i + 1 === index ? "w-4 bg-ink" : "w-1.5 bg-ink/20"}`}
                  />
                ))}
              </span>
              <button type="button" onClick={last ? close : next} className={`${btn.primary} h-10 px-5 text-[14px]`}>
                {index === 0 ? "Show me" : last ? "Start talking" : "Next"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
