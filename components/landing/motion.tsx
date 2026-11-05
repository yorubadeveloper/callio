"use client";

import { createContext, Fragment, useContext, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { motion, useReducedMotion } from "motion/react";
import { LOGO_BLOBS } from "@/components/brand/logo-paths";

export const EASE_OUT = [0.2, 0.8, 0.2, 1] as const;
const EASE_IN = [0.7, 0, 0.84, 0] as const;

// The intro plays on every fresh visit or refresh, but not when someone comes
// back to the landing page from elsewhere in the site without reloading.
let introPlayedThisLoad = false;
const INTRO_MS = 1500;

const IntroDone = createContext(true);
/** True once the loading intro has handed over to the page. */
export const useIntroDone = () => useContext(IntroDone);

type IntroPhase = "intro" | "leaving" | "gone";
const LEAVE_MS = 700;

export function LandingShell({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<IntroPhase>("intro");
  // Decided once per mount, so React's dev double-run of effects can't see its own flag and skip.
  const skip = useRef<boolean | null>(null);

  useEffect(() => {
    if (skip.current === null) {
      skip.current = introPlayedThisLoad;
      introPlayedThisLoad = true;
    }
    const instant = reduce || skip.current;
    const leave = setTimeout(() => setPhase(instant ? "gone" : "leaving"), instant ? 0 : INTRO_MS);
    const gone = setTimeout(() => setPhase("gone"), instant ? 0 : INTRO_MS + LEAVE_MS);
    return () => {
      clearTimeout(leave);
      clearTimeout(gone);
    };
  }, [reduce]);

  const done = phase !== "intro";

  // Smooth, inertial scrolling for the scroll-driven sections.
  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.9, anchors: true });
    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });
    if (!done) lenis.stop();
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [reduce, done]);

  return (
    <IntroDone.Provider value={done}>
      {children}
      {phase !== "gone" && <IntroOverlay leaving={phase === "leaving"} />}
    </IntroDone.Provider>
  );
}

// Where each blob flies in from before it settles into the C.
const BLOB_FROM = [
  { x: -70, y: -60, rotate: -50 },
  { x: 70, y: -70, rotate: 40 },
  { x: -80, y: 60, rotate: 30 },
  { x: 70, y: 70, rotate: -40 },
];

function IntroOverlay({ leaving }: { leaving: boolean }) {
  return (
    <motion.div
      className="fixed inset-0 z-[70] grid place-items-center bg-page"
      style={{ pointerEvents: leaving ? "none" : "auto" }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.28, delay: leaving ? 0.38 : 0, ease: "easeOut" }}
      aria-hidden
    >
      <motion.svg
        viewBox="0 0 100 100"
        className="size-24 overflow-visible sm:size-28"
        animate={
          leaving
            ? // The camera flies through the C into the page.
              { scale: 16, rotate: 40 }
            : // Once assembled, it wobbles like a ringing phone.
              { rotate: [0, 0, -9, 8, -5, 3, 0] }
        }
        transition={
          leaving
            ? { duration: 0.6, ease: EASE_IN }
            : { duration: 1.05, times: [0, 0.55, 0.65, 0.75, 0.84, 0.92, 1] }
        }
      >
        {LOGO_BLOBS.map((blob, i) => (
          <motion.path
            key={blob.name}
            d={blob.d}
            fill={blob.fill}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={{ ...BLOB_FROM[i], scale: 0.2, opacity: 0 }}
            animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 160, damping: 15, delay: 0.05 + i * 0.07 }}
          />
        ))}
      </motion.svg>
    </motion.div>
  );
}

/** Fades and drops an element in once the intro has finished. */
export function AfterIntro({
  children,
  delay = 0,
  y = 10,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const done = useIntroDone();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={done ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.7, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

export interface TextPart {
  text: string;
  italic?: boolean;
}

/** Headline that rises word by word out of a mask. */
export function SplitWords({
  parts,
  show,
  delay = 0,
  stagger = 0.06,
}: {
  parts: TextPart[];
  show: boolean;
  delay?: number;
  stagger?: number;
}) {
  const reduce = useReducedMotion();
  const words = parts.flatMap((p) => p.text.split(" ").map((w) => ({ w, italic: p.italic })));
  return (
    <>
      <span className="sr-only">{parts.map((p) => p.text).join(" ")}</span>
      <span aria-hidden>
        {words.map(({ w, italic }, i) => (
          <Fragment key={i}>
            <span className="-mx-[0.06em] -mb-[0.12em] inline-block overflow-hidden px-[0.06em] pb-[0.12em] align-bottom">
              <motion.span
                className={italic ? "inline-block italic" : "inline-block"}
                initial={reduce ? false : { y: "115%", rotate: 4 }}
                animate={show ? { y: "0%", rotate: 0 } : undefined}
                transition={{ duration: 0.85, delay: delay + i * stagger, ease: EASE_OUT }}
              >
                {w}
              </motion.span>
            </span>
            {i < words.length - 1 && " "}
          </Fragment>
        ))}
      </span>
    </>
  );
}
