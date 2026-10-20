import type { Metadata } from "next";
import { LogoMark } from "@/components/brand/logo";
import { RetryButton } from "@/components/pwa/retry-button";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };

// Cached by the service worker and shown when there's no connection.
export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-page px-6 text-center text-ink">
      <div className="max-w-sm">
        <LogoMark className="mx-auto size-16" />
        <h1 className="mt-6 font-display text-[32px] leading-tight font-medium tracking-[-0.03em]">
          You&apos;re offline
        </h1>
        <p className="mt-2 text-[16px] text-ink-soft">
          Callio needs a connection to reach your agents. It&apos;ll work again as soon as you&apos;re back online.
        </p>
        <RetryButton />
      </div>
    </main>
  );
}
