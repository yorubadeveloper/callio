"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { cn } from "@/lib/utils";

// Google Analytics only loads after someone agrees (TDDDG §25 / GDPR). Until then
// nothing is sent to Google. Development never loads it, so local testing doesn't
// pollute the numbers.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || (process.env.NODE_ENV === "production" ? "G-16XM8JSVXR" : undefined);

type Consent = "granted" | "denied" | null;
const KEY = "callio-analytics-consent";
const EVENT = "callio-consent-change";

const consentStore = {
  subscribe(cb: () => void) {
    window.addEventListener(EVENT, cb);
    window.addEventListener("storage", cb);
    return () => {
      window.removeEventListener(EVENT, cb);
      window.removeEventListener("storage", cb);
    };
  },
  get(): Consent {
    try {
      const v = localStorage.getItem(KEY);
      return v === "granted" || v === "denied" ? v : null;
    } catch {
      return null;
    }
  },
  set(value: Consent) {
    try {
      if (value) localStorage.setItem(KEY, value);
      else localStorage.removeItem(KEY);
    } catch {}
    window.dispatchEvent(new Event(EVENT));
  },
};

/** Re-opens the consent choice (footer and settings link). */
export function openCookieSettings() {
  // Withdrawing consent after GA loaded needs a reload to fully stop it.
  const wasGranted = consentStore.get() === "granted";
  consentStore.set(null);
  if (wasGranted) window.location.reload();
}

export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      Cookie settings
    </button>
  );
}

export function Analytics() {
  // "unknown" during server render, so the banner never flashes before we've read the choice.
  const consent = useSyncExternalStore<Consent | "unknown">(consentStore.subscribe, consentStore.get, () => "unknown");
  const pathname = usePathname();
  // Never cover call controls.
  const quiet = pathname.startsWith("/call") || pathname.startsWith("/demo");
  const inApp = pathname.startsWith("/app");

  if (!GA_ID) return null;
  return (
    <>
      {consent === "granted" && <GoogleAnalytics gaId={GA_ID} />}
      <AnimatePresence>
        {consent === null && !quiet && (
          <motion.aside
            role="dialog"
            aria-label="Analytics consent"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1], delay: 1.2 }}
            className={cn(
              "fixed inset-x-3 z-[65] rounded-[24px] bg-plate p-5 font-body text-ink shadow-[0_20px_60px_-20px_rgb(0_0_0/0.35)] ring-1 ring-line sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-sm",
              inApp
                ? "bottom-[calc(env(safe-area-inset-bottom)+5rem)] lg:bottom-5"
                : "bottom-[max(env(safe-area-inset-bottom),0.75rem)]",
            )}
          >
            <p className="text-[15px] font-semibold">Can we count your visit?</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
              We use Google Analytics to see which pages help people. No ads, and it never sees your calls.{" "}
              <Link href="/privacy#cookies" className="text-ink underline underline-offset-4">
                Privacy policy
              </Link>
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => consentStore.set("denied")}
                className="h-11 rounded-full bg-ink/[0.06] text-[15px] font-semibold transition-colors hover:bg-ink/10"
              >
                No thanks
              </button>
              <button
                type="button"
                onClick={() => consentStore.set("granted")}
                className="h-11 rounded-full bg-ink text-[15px] font-semibold text-page"
              >
                Allow
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
