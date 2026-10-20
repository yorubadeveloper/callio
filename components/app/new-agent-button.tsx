"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { plan as planById, PLANS, type PlanId } from "@/lib/pricing";
import { btn } from "./ui";
import { UpgradeSheet } from "./upgrade";

/** "New agent", or an upgrade prompt once the plan's agent limit is reached. */
export function NewAgentButton({ count, plan }: { count: number; plan: PlanId }) {
  const [open, setOpen] = useState(false);
  const limit = planById(plan).agents;
  const atLimit = limit !== "unlimited" && count >= limit;
  const next = PLANS.find((p) => p.agents === "unlimited" || p.agents > count)!;

  if (!atLimit) {
    return (
      <Link href="/app/agents/new" className={cn(btn.primary, "h-11 px-5")}>
        <Plus weight="bold" /> New agent
      </Link>
    );
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn(btn.primary, "h-11 px-5")}>
        <Plus weight="bold" /> New agent
      </button>
      <UpgradeSheet
        open={open}
        onClose={() => setOpen(false)}
        plan={next.id}
        title="Room for more agents"
        reason={`Your ${planById(plan).name} plan includes ${limit} ${limit === 1 ? "agent" : "agents"}. ${next.name} gives you ${next.agents === "unlimited" ? "as many as you like" : next.agents}, plus ${next.credits} credits a month.`}
      />
    </>
  );
}
