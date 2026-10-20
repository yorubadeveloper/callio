"use client";

import { useState } from "react";
import { Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { plan as planById, type PlanId } from "@/lib/pricing";
import { btn, Sheet } from "./ui";
import { Spinner } from "@/components/brand/logo-loader";

/** Sends the person to Stripe Checkout. Credits are granted by the webhook, never on return. */
export async function startCheckout(
  body: { kind: "plan"; plan: PlanId; interval: "month" | "year" } | { kind: "topup"; pack: string },
) {
  const { url } = await api<{ url: string }>("/billing/checkout", { method: "POST", body });
  window.location.assign(url);
}

export function useCheckout() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const go = async (key: string, body: Parameters<typeof startCheckout>[0]) => {
    setBusy(key);
    setError(null);
    try {
      await startCheckout(body);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 503
          ? "Payments aren't switched on yet. Check back soon."
          : err instanceof Error
            ? err.message
            : "Couldn't open checkout.",
      );
      setBusy(null);
    }
  };
  return { busy, error, go };
}

/** Explains what a feature needs and upgrades in one tap. */
export function UpgradeSheet({
  open,
  onClose,
  title,
  reason,
  plan,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  reason: string;
  plan: PlanId;
}) {
  const p = planById(plan);
  const { busy, error, go } = useCheckout();
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className="text-[15px] text-ink-soft">{reason}</p>
      <div className="mt-5 rounded-[24px] bg-[#121212] p-5 text-[#F3F2EE]">
        <div className="flex items-baseline justify-between">
          <p className="font-display text-[26px] font-medium tracking-[-0.03em]">{p.name}</p>
          <p className="font-display text-[26px] font-medium tracking-[-0.03em]">
            ${p.monthly}
            <span className="font-body text-[14px] font-normal text-white/60"> / month</span>
          </p>
        </div>
        <ul className="mt-4 space-y-2 text-[14px]">
          {p.features.map((f) => (
            <li key={f} className="flex gap-2">
              <Check weight="bold" className="mt-0.5 shrink-0 text-amber" /> {f}
            </li>
          ))}
        </ul>
      </div>
      {error && <p className="mt-4 text-[14px] text-[#B0412C] dark:text-coral">{error}</p>}
      <button
        type="button"
        onClick={() => go(plan, { kind: "plan", plan, interval: "month" })}
        disabled={busy !== null}
        className={cn(btn.primary, "mt-5 w-full")}
      >
        {busy && <Spinner />} Upgrade to {p.name}
      </button>
      <p className="mt-3 text-center text-[13px] text-ink-soft">Cancel any time. Tax is added at checkout.</p>
    </Sheet>
  );
}
