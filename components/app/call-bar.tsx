"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { PhoneDisconnect } from "@phosphor-icons/react";
import { haptic } from "@/lib/haptics";
import { activeCall } from "@/lib/call/active";
import type { CallSnapshot } from "@/lib/call/types";

const idle = () => null;
const noop = () => () => {};

/** While a call goes on in the background, a bar to get back to it (like a phone's green call pill). */
export function CallBar() {
  const call = useSyncExternalStore(activeCall.subscribe, activeCall.get, idle);
  const snap = useSyncExternalStore(
    call?.engine.subscribe ?? noop,
    call?.engine.getSnapshot ?? idle,
    idle,
  ) as CallSnapshot | null;
  const on = call && snap && (snap.status === "connecting" || snap.status === "live");

  return (
    <AnimatePresence>
      {on && (
        <motion.div
          key="call-bar"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-50 mx-auto flex max-w-md items-center gap-2 rounded-full bg-teal p-1.5 pl-5 text-[#0E0E10] shadow-[0_14px_40px_-12px_#64B2AF] lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-[360px]"
        >
          <Link href={`/call/${call.agentId}`} onClick={() => haptic("tap")} className="flex min-w-0 flex-1 items-center gap-2.5 py-2">
            <span className="relative flex size-2.5 shrink-0">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#0E0E10]/40 motion-reduce:hidden" />
              <span className="relative size-2.5 rounded-full bg-[#0E0E10]" />
            </span>
            <span className="truncate text-[15px] font-semibold">
              {snap.status === "connecting" ? `Calling ${call.name}…` : `On a call with ${call.name}`}
            </span>
            {snap.startedAt && <Elapsed since={snap.startedAt} />}
            <span className="ml-auto shrink-0 text-[13px] font-medium underline underline-offset-4">Back</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              haptic("tap");
              call.engine.end();
            }}
            aria-label={`Hang up on ${call.name}`}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-coral text-[18px] text-white transition-transform active:scale-95"
          >
            <PhoneDisconnect weight="fill" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((now - since) / 1000));
  return (
    <span className="shrink-0 font-mono text-[13px] tabular-nums opacity-70">
      {Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}
    </span>
  );
}
