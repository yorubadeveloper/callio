import Link from "next/link";
import { Phone } from "@phosphor-icons/react/dist/ssr";
import { AgentFace } from "@/components/landing/agent-face";
import type { PersonalAgent } from "@/lib/agents/personalize";
import { LinkPending } from "./link-pending";
import { HearVoice } from "./voice-preview";

/** An agent in their own colours, with a voice sample and a one-tap call. The card opens their profile. */
export function AgentCard({ agent, lastTalked }: { agent: PersonalAgent; lastTalked?: string | null }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[30px] bg-plate ring-1 ring-line transition-[box-shadow,transform] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-30px_rgb(0_0_0/0.45)]">
      <Link
        href={`/app/agents/${agent.id}`}
        className="absolute inset-0 z-[1] rounded-[30px]"
        aria-label={`${agent.name}'s profile`}
      >
        <LinkPending />
      </Link>
      <div aria-hidden className="relative h-24 overflow-hidden" style={{ background: agent.face.tile }}>
        <span
          className="absolute -right-6 -top-10 size-36 rounded-full opacity-60 blur-2xl"
          style={{ background: agent.face.skin }}
        />
        <span className="absolute right-5 top-4 rounded-full bg-white/70 px-2.5 py-1 text-[12px] font-semibold text-[#161514] backdrop-blur">
          {agent.persona.voice} voice
        </span>
      </div>
      <span className="relative -mt-12 ml-5 size-24 overflow-hidden rounded-full shadow-[0_14px_30px_-18px_rgb(0_0_0/0.6)] ring-4 ring-plate transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:-rotate-3 group-hover:scale-105">
        <AgentFace agent={agent} className="size-full" />
      </span>
      <div className="px-5 pt-3">
        <p className="font-display text-[26px] leading-none font-medium tracking-[-0.035em]">{agent.name}</p>
        <p className="mt-1.5 text-[14px] text-ink-soft">{agent.role}</p>
        <p className="mt-1 text-[13px] text-ink-soft/80">
          {lastTalked ? `Last talked ${lastTalked}` : "Haven't talked yet"}
        </p>
      </div>
      <div className="relative z-[2] mt-auto flex gap-2 p-5 pt-4">
        <HearVoice voice={agent.persona.voice} name={agent.name} />
        <Link
          href={`/call/${agent.id}`}
          className="relative inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-teal text-[15px] font-semibold text-[#0E0E10] transition-transform duration-200 hover:-translate-y-0.5"
        >
          <Phone weight="fill" /> Call
          <LinkPending veil={false} className="bg-teal" />
        </Link>
      </div>
    </div>
  );
}
