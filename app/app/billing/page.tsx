import type { Metadata } from "next";
import { BillingView } from "@/components/app/billing";
import { PLANS, type PlanId } from "@/lib/pricing";
import { currentUser, userBackend } from "@/lib/server/backend";
import type { Billing } from "@/lib/types";

export const metadata: Metadata = { title: "Plan & credits" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; interval?: string; status?: string }>;
}) {
  const { plan, interval, status } = await searchParams;
  const user = (await currentUser())!;
  const billing = await (await userBackend())<Billing>("/v1/billing");
  const intent =
    plan && PLANS.some((p) => p.id === plan && p.id !== "free")
      ? { plan: plan as PlanId, interval: interval === "year" ? ("year" as const) : ("month" as const) }
      : null;
  return (
    <BillingView billing={billing} timezone={user.timezone} locale={user.locale} intent={intent} status={status} />
  );
}
