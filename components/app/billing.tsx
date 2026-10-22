"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Coins } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { plan as planById, PLANS, TOP_UPS, type PlanId } from "@/lib/pricing";
import type { Billing } from "@/lib/types";
import { btn, Field, inputClass, PageTitle, Segmented, Sheet } from "./ui";
import { useCheckout } from "./upgrade";
import { Spinner } from "@/components/brand/logo-loader";

const REASONS: Record<string, string> = {
  signup: "Welcome credits",
  plan_grant: "Monthly credits",
  topup: "Top-up",
  usage_online_min: "Calls",
  usage_phone_min: "Phone calls",
  usage_cu_task: "Computer tasks",
  refund_clawback: "Refund",
  expiry: "Plan credits reset",
  adjustment: "Adjustment",
};

export function BillingView({
  billing: initial,
  timezone,
  locale,
  intent,
  status,
}: {
  billing: Billing;
  timezone: string;
  locale: string;
  intent: { plan: PlanId; interval: "month" | "year" } | null;
  status?: string;
}) {
  const router = useRouter();
  const [billing, setBilling] = useState(initial);
  const [interval, setInterval] = useState<"month" | "year">(intent?.interval ?? billing.interval ?? "month");
  const { busy, error, go } = useCheckout();
  const started = useRef(false);
  const current = planById(billing.plan);
  const date = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: timezone }).format(
      new Date(iso),
    );

  // Arriving from the pricing page with a plan picked: go straight to checkout.
  useEffect(() => {
    if (!intent || started.current || intent.plan === billing.plan) return;
    started.current = true;
    void go(intent.plan, { kind: "plan", plan: intent.plan, interval: intent.interval });
  }, [intent, billing.plan, go]);

  return (
    <>
      <PageTitle title="Plan & credits" />

      {status === "success" && (
        <p role="status" className="mb-6 rounded-2xl bg-teal/15 px-4 py-3 text-[15px]">
          Payment received. Your credits appear here within a minute.
        </p>
      )}
      {error && (
        <p role="alert" className="mb-6 rounded-2xl bg-coral/15 px-4 py-3 text-[15px]">
          {error}
        </p>
      )}

      {/* One summary: the plan on the left, what's left to spend on the right. */}
      <section className="flex flex-col gap-6 rounded-[28px] bg-[#121212] p-6 text-[#F3F2EE] sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] text-white/60">Your plan</p>
          <p className="mt-1 font-display text-[36px] leading-none font-medium tracking-[-0.04em]">{current.name}</p>
          <p className="mt-2 text-[14px] text-white/60">
            {billing.cancel_at
              ? `Ends on ${date(billing.cancel_at)}. You'll move to Free after that.`
              : billing.renews_at
                ? `Renews on ${date(billing.renews_at)}${billing.interval === "year" ? " (yearly)" : ""}`
                : billing.plan === "free"
                  ? "Free forever. Upgrade for monthly credits."
                  : `${current.name} is active on your account.`}
          </p>
          {billing.plan !== "free" && <ManageButton />}
        </div>
        <div className="shrink-0 border-t border-white/10 pt-5 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0 sm:text-right">
          <p className="flex items-center gap-2 text-[13px] text-white/60 sm:justify-end">
            <Coins weight="fill" className="text-amber" /> Credits
          </p>
          <p className="mt-1 font-display text-[36px] leading-none font-medium tracking-[-0.04em] tabular-nums">
            {billing.credits.total}
          </p>
          <p className="mt-2 text-[14px] text-white/60">
            {billing.credits.plan} from your plan · {billing.credits.topup} top-up
          </p>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-[22px] font-medium tracking-[-0.03em]">Plans</h2>
          <div className="w-full sm:w-64">
            <Segmented
              label="Billing period"
              value={interval}
              onChange={setInterval}
              options={[
                { value: "month", label: "Monthly" },
                { value: "year", label: "Yearly · 2 months free" },
              ]}
            />
          </div>
        </div>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PLANS.filter((p) => p.id !== "free").map((p) => {
            const isCurrent = p.id === billing.plan;
            const price = interval === "year" ? p.yearlyPerMonth : p.monthly;
            return (
              <li
                key={p.id}
                className={cn(
                  "flex flex-col rounded-[24px] p-5 ring-1",
                  p.highlight ? "bg-plate ring-ink" : "bg-plate ring-line",
                )}
              >
                <p className="text-[16px] font-semibold">{p.name}</p>
                <p className="mt-1 font-display text-[30px] leading-none font-medium tracking-[-0.04em]">
                  ${price}
                  <span className="font-body text-[14px] font-normal tracking-normal text-ink-soft"> / month</span>
                </p>
                <ul className="mt-4 flex-1 space-y-1.5 text-[14px]">
                  {p.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check weight="bold" className="mt-0.5 shrink-0 text-teal" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={isCurrent || busy !== null}
                  onClick={() =>
                    // Subscribers switch plans in Stripe's portal (prorated); new buyers go to checkout.
                    billing.plan === "free" ? go(p.id, { kind: "plan", plan: p.id, interval }) : openPortal()
                  }
                  className={cn(isCurrent ? btn.soft : btn.primary, "mt-5 h-11")}
                >
                  {busy === p.id && <Spinner />}
                  {isCurrent ? "Current plan" : `Choose ${p.name}`}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mb-1 font-display text-[22px] font-medium tracking-[-0.03em]">Top up</h2>
        <p className="mb-4 text-[14px] text-ink-soft">
          One-off packs. They never expire and are used after your plan credits.
        </p>
        <ul className="grid grid-cols-3 gap-3">
          {TOP_UPS.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => go(t.id, { kind: "topup", pack: t.id })}
                className="flex w-full flex-col items-start rounded-[24px] bg-plate p-4 text-left ring-1 ring-line transition-colors hover:ring-ink/30 disabled:opacity-60"
              >
                <span className="font-display text-[26px] leading-none font-medium tracking-[-0.04em]">
                  {t.credits}
                </span>
                <span className="text-[13px] text-ink-soft">credits</span>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-semibold">
                  {busy === t.id && <Spinner />} ${t.price}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {billing.ledger.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-[22px] font-medium tracking-[-0.03em]">Activity</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-[24px] bg-plate ring-1 ring-line">
            {billing.ledger.slice(0, 20).map((l, i) => (
              <li key={i} className="flex items-center justify-between px-5 py-3 text-[15px]">
                <span>
                  {REASONS[l.reason] ?? l.reason}
                  <span className="block text-[13px] text-ink-soft">{date(l.created_at)}</span>
                </span>
                <span className={cn("font-semibold tabular-nums", l.delta > 0 ? "text-teal" : "text-ink")}>
                  {l.delta > 0 ? `+${l.delta}` : l.delta}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {billing.plan !== "free" && (
        <ContractActions
          billing={billing}
          onChange={(b) => {
            setBilling(b);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

async function openPortal() {
  const { url } = await api<{ url: string }>("/billing/portal", { method: "POST" });
  window.location.assign(url);
}

function ManageButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await openPortal();
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Couldn't open billing.");
            setBusy(false);
          }
        }}
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-white/12 px-5 text-[15px] font-semibold hover:bg-white/20"
      >
        {busy && <Spinner />} Payment details & invoices
      </button>
      {error && <p className="mt-2 text-[13px] text-coral">{error}</p>}
    </>
  );
}

/** The cancel (§312k BGB) and withdrawal (§356a BGB) buttons. Two taps each, no retention tricks. */
function ContractActions({ billing, onChange }: { billing: Billing; onChange: (b: Billing) => void }) {
  const [sheet, setSheet] = useState<"cancel" | "withdraw" | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setResult(null);
    try {
      await fn();
    } catch (err) {
      setResult(err instanceof ApiError ? err.message : "Something went wrong. Try again or email us.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-12 border-t border-line pt-8">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">Your contract</h2>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {billing.cancel_at ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(async () => onChange(await api<Billing>("/billing/resume", { method: "POST" })))}
            className={btn.soft}
          >
            Keep my plan
          </button>
        ) : (
          <button type="button" onClick={() => setSheet("cancel")} className={btn.soft}>
            Cancel contract here
          </button>
        )}
        <button type="button" onClick={() => setSheet("withdraw")} className={btn.soft}>
          Withdraw from contract here
        </button>
      </div>
      {result && !sheet && <p className="mt-3 text-[14px] text-ink-soft">{result}</p>}

      <Sheet open={sheet === "cancel"} onClose={() => setSheet(null)} title="Cancel your plan">
        <p className="text-[15px] text-ink-soft">
          Your plan stays active until the end of this billing period, then you move to Free. Your agents, memory and
          top-up credits stay.
        </p>
        {result && <p className="mt-4 text-[14px]">{result}</p>}
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run(async () => {
              onChange(await api<Billing>("/billing/cancel", { method: "POST" }));
              setSheet(null);
            })
          }
          className={cn(btn.primary, "mt-6 w-full")}
        >
          {busy && <Spinner />} Confirm cancellation
        </button>
      </Sheet>

      <Sheet open={sheet === "withdraw"} onClose={() => setSheet(null)} title="Withdraw from your contract">
        <p className="text-[15px] text-ink-soft">
          Within 14 days of buying, you can withdraw and get your money back for anything you haven&apos;t used. After
          that we cancel at the end of the period instead.
        </p>
        <div className="mt-5">
          <Field label="Reason (optional)">
            {(id) => (
              <textarea
                id={id}
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={cn(inputClass, "resize-none")}
              />
            )}
          </Field>
        </div>
        {result && <p className="mt-4 text-[15px]">{result}</p>}
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run(async () => {
              const res = await api<{ detail: string }>("/billing/withdraw", {
                method: "POST",
                body: { reason: reason.trim() || undefined },
              });
              setResult(res.detail);
              onChange(await api<Billing>("/billing"));
            })
          }
          className={cn(btn.primary, "mt-6 w-full")}
        >
          {busy && <Spinner />} Confirm withdrawal
        </button>
      </Sheet>
    </section>
  );
}
