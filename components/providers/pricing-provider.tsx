"use client";

import { createContext, useContext, useMemo } from "react";
import { PLANS, withLivePrices, type LivePrices, type PlanId } from "@/lib/pricing";

const PricingContext = createContext(withLivePrices(null));

export function PricingProvider({ live, children }: { live: LivePrices | null; children: React.ReactNode }) {
  const value = useMemo(() => withLivePrices(live), [live]);
  return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>;
}

/** Plans and top-ups with today's prices. */
export function usePricing() {
  const { plans, topUps } = useContext(PricingContext);
  return { plans, topUps, plan: (id: PlanId) => plans.find((p) => p.id === id) ?? PLANS.find((p) => p.id === id)! };
}
