import Link from "next/link";
import { Phone } from "@phosphor-icons/react/dist/ssr";
import { AgentFace } from "@/components/landing/agent-face";
import type { PersonalAgent } from "@/lib/agents/personalize";

/** An agent with a one-tap call button. The card opens its profile. */
export function AgentCard({ agent, lastTalked }: { agent: PersonalAgent; lastTalked?: string | null }) {
  return (
    <div className="group relative flex flex-col rounded-[28px] bg-plate p-5 ring-1 ring-line transition-shadow hover:shadow-[0_20px_50px_-30px_rgb(0_0_0/0.4)]">
      <Link
        href={`/app/agents/${agent.id}`}
        className="absolute inset-0 rounded-[28px]"
        aria-label={`${agent.name}'s profile`}
      />
      <span className="relative size-20 overflow-hidden rounded-full transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:-rotate-3 group-hover:scale-105">
        <AgentFace agent={agent} className="size-full" />
      </span>
      <p className="mt-4 font-display text-[24px] leading-none font-medium tracking-[-0.03em]">{agent.name}</p>
      <p className="mt-1.5 text-[14px] text-ink-soft">{agent.role}</p>
      <p className="mt-1 h-5 text-[13px] text-ink-soft/80">
        {lastTalked ? `Last talked ${lastTalked}` : "Haven't talked yet"}
      </p>
      <Link
        href={`/call/${agent.id}`}
        className="relative mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-teal text-[15px] font-semibold text-[#0E0E10] transition-transform duration-200 hover:-translate-y-0.5"
      >
        <Phone weight="fill" /> Call
      </Link>
    </div>
  );
}
