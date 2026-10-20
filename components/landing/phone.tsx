"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  CaretLeft,
  DotsNine,
  MicrophoneSlash,
  Phone,
  PhoneDisconnect,
  Play,
  SpeakerHigh,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo";
import { AgentFace } from "./agent-face";
import { agent, CORAL, TEAL } from "./agents";
import { LevelBars } from "./level-bars";

export function PhoneFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[9/19.2] rounded-[2.8rem] bg-[#0B0B0B] p-[9px] shadow-[0_40px_90px_-30px_rgb(18_18_18/0.45)] ring-1 ring-white/10",
        className,
      )}
    >
      <div className="relative size-full overflow-hidden rounded-[2.25rem] bg-white">
        {children}
        <div className="pointer-events-none absolute left-1/2 top-2.5 z-20 h-[26px] w-[34%] -translate-x-1/2 rounded-full bg-[#0B0B0B]" />
      </div>
    </div>
  );
}

function StatusBar({ dark = false, time = "9:41" }: { dark?: boolean; time?: string }) {
  return (
    <div
      className={cn(
        "relative z-10 flex h-11 items-center justify-between px-7 pt-1 text-[13px] font-semibold",
        dark ? "text-white" : "text-[#121212]",
      )}
    >
      <span>{time}</span>
      <span className="flex items-center gap-1" aria-hidden>
        <span className="flex items-end gap-[2px]">
          {[4, 6, 8, 10].map((h) => (
            <span key={h} className="w-[3px] rounded-sm bg-current" style={{ height: h }} />
          ))}
        </span>
        <span className="ml-1 h-[10px] w-[20px] rounded-[3px] border border-current p-[1.5px]">
          <span className="block h-full w-3/4 rounded-[1px] bg-current" />
        </span>
      </span>
    </div>
  );
}

/** Fades children in one after another while `active`. */
function Reveal({
  active,
  delay,
  children,
  className,
}: {
  active: boolean;
  delay: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={active ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: 0.35, delay: active ? delay : 0, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Counts up from `start` seconds while the screen is mounted. */
function useCallTimer(start: number) {
  const [seconds, setSeconds] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

/* ---------- They call you ---------- */

export function IncomingCallScreen() {
  const laura = agent("Laura");
  return (
    <div className="flex size-full flex-col" style={{ background: "linear-gradient(170deg, #CFE7E5 0%, #F3F2EE 75%)" }}>
      <StatusBar time="7:30" />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center pb-4 text-[#121212]">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#5E5C57]">
          <LogoMark className="size-3.5" /> Callio
        </span>
        <div className="relative mt-6 size-28">
          <span className="ring-pulse absolute inset-0 rounded-full border-[3px]" style={{ borderColor: CORAL }} />
          <span className="ring-pulse-late absolute inset-0 rounded-full border-[3px]" style={{ borderColor: CORAL }} />
          <span className="relative block size-full overflow-hidden rounded-full ring-4 ring-white">
            <AgentFace agent={laura} className="size-full" />
          </span>
        </div>
        <p className="mt-5 font-display text-[34px] leading-none font-medium tracking-[-0.03em]">Laura</p>
        <p className="mt-2 text-[13px] text-[#5E5C57]">Morning brief · calling…</p>
        <div className="mx-6 mt-6 rounded-2xl bg-white/70 px-4 py-3 text-[13px] leading-snug shadow-sm">
          &ldquo;Three meetings today, the 10:00 moved to 11:00. Rain after four.&rdquo;
        </div>
      </div>
      <div className="flex justify-between px-10 pb-[12%]">
        <CallButton label="Decline" color={CORAL} icon={<PhoneDisconnect weight="fill" />} />
        <CallButton label="Accept" color={TEAL} icon={<Phone weight="fill" />} nudge />
      </div>
    </div>
  );
}

function CallButton({
  label,
  color,
  icon,
  nudge,
}: {
  label: string;
  color: string;
  icon: React.ReactNode;
  nudge?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-[12px] text-[#121212]">
      <span
        className={cn("grid size-16 place-items-center rounded-full text-[28px] text-white", nudge && "accept-nudge")}
        style={{ background: color }}
      >
        {icon}
      </span>
      {label}
    </div>
  );
}

/* ---------- You call them ---------- */

const IN_CALL_LINES = [
  { who: "You", text: "Move my 3pm to tomorrow, and let Dana know." },
  { who: "Juno", text: "Done. It's Thursday at 3, and I've emailed Dana." },
  { who: "You", text: "Remind me to bring the contract." },
  { who: "Juno", text: "I'll call you at 2:50 with it." },
];

export function InCallScreen({ active }: { active: boolean }) {
  const juno = agent("Juno");
  const timer = useCallTimer(38);
  return (
    <div className="flex size-full flex-col bg-[#161616] text-white">
      <StatusBar dark />
      <div className="flex flex-col items-center pt-6">
        <span className="size-16 overflow-hidden rounded-full">
          <AgentFace agent={juno} className="size-full" />
        </span>
        <p className="mt-3 font-display text-[26px] leading-none font-medium tracking-[-0.03em]">Juno</p>
        <p className="mt-1.5 font-mono text-[12px] text-white/60">{timer}</p>
      </div>
      <div className="mt-6 flex flex-1 flex-col gap-3 px-5">
        {IN_CALL_LINES.map((line, i) => (
          <Reveal key={i} active={active} delay={0.4 + i * 0.9}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">{line.who}</p>
            <p className={cn("text-[14px] leading-snug", line.who === "You" ? "text-white/75" : "text-white")}>
              {line.text}
            </p>
          </Reveal>
        ))}
      </div>
      <div className="flex justify-center pb-4">
        <LogoMark speaking={active} className="size-11" />
      </div>
      <div className="grid grid-cols-4 gap-2 px-6 pb-10 text-[22px]">
        {[<MicrophoneSlash key="m" />, <DotsNine key="k" />, <SpeakerHigh key="s" />].map((icon, i) => (
          <span key={i} className="grid aspect-square place-items-center rounded-full bg-white/12">
            {icon}
          </span>
        ))}
        <span className="grid aspect-square place-items-center rounded-full" style={{ background: CORAL }}>
          <PhoneDisconnect weight="fill" />
        </span>
      </div>
    </div>
  );
}

/* ---------- They call for you ---------- */

export function TextThreadScreen({ active }: { active: boolean }) {
  const theo = agent("Theo");
  return (
    <div className="flex size-full flex-col bg-white text-[#121212]">
      <StatusBar />
      <div className="flex flex-col items-center border-b border-black/5 pb-3 pt-2">
        <div className="flex w-full items-center px-4">
          <CaretLeft className="text-[20px] text-[#8896E3]" />
        </div>
        <span className="-mt-3 size-11 overflow-hidden rounded-full">
          <AgentFace agent={theo} className="size-full" />
        </span>
        <p className="mt-1 text-[12px] font-semibold">Theo</p>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-3 pt-4 text-[14px] leading-snug">
        <Reveal active={active} delay={0.3} className="ml-auto max-w-[78%]">
          <p className="rounded-[18px] rounded-br-md bg-[#121212] px-3.5 py-2 text-white">
            Can you book Bella Napoli for 4, Friday at 8?
          </p>
        </Reveal>
        <Reveal active={active} delay={1.0} className="max-w-[78%]">
          <p className="rounded-[18px] rounded-bl-md bg-[#EFEEEA] px-3.5 py-2">Calling them now.</p>
        </Reveal>
        <Reveal active={active} delay={1.8} className="max-w-[82%]">
          <div className="rounded-[18px] rounded-bl-md bg-[#EFEEEA] p-2.5">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full text-white" style={{ background: TEAL }}>
                <Play weight="fill" className="text-[14px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold">Call with Bella Napoli</p>
                <div className="mt-1 flex items-center gap-2">
                  <LevelBars color={TEAL} className="h-3" />
                  <span className="font-mono text-[11px] text-[#5E5C57]">2:14</span>
                </div>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-[#5E5C57]">Transcript saved to your notes</p>
          </div>
        </Reveal>
        <Reveal active={active} delay={2.6} className="max-w-[80%]">
          <p className="rounded-[18px] rounded-bl-md bg-[#EFEEEA] px-3.5 py-2">
            Booked: table for 4, Friday at 8pm, under Alex. They&apos;ll hold it for 15 minutes.
          </p>
        </Reveal>
      </div>
      <div className="mx-3 mb-9 rounded-full border border-black/10 px-4 py-2 text-[13px] text-[#9A9893]">Text Theo</div>
    </div>
  );
}

/* ---------- Routines ---------- */

const NOTIFICATIONS = [
  { name: "Kemi", title: "Gym check-in", body: "You said 6pm. Are you on your way?", when: "now" },
  { name: "Ada", title: "Called Mum", body: "She's in good spirits and took her meds.", when: "40m ago" },
  { name: "Theo", title: "Dentist moved", body: "Thursday at 2pm, confirmed by phone.", when: "3h ago" },
  { name: "Laura", title: "Morning brief", body: "3 meetings, rain after four. Call lasted 1:52.", when: "7:30" },
];

export function LockScreen({ active }: { active: boolean }) {
  return (
    <div className="relative flex size-full flex-col overflow-hidden bg-[#1A1A22] text-white">
      {/* wallpaper: the logo, blown up and blurred */}
      <LogoMark className="absolute -left-1/4 top-[8%] w-[150%] max-w-none opacity-90 blur-2xl" />
      <div className="absolute inset-0 bg-black/15" />
      <StatusBar dark time="" />
      <div className="relative text-center">
        <p className="text-[14px] font-medium text-white/85">Monday 26 October</p>
        <p className="font-display text-[72px] leading-[1.05] font-medium tracking-[-0.04em]">18:05</p>
      </div>
      <div className="relative mt-auto flex flex-col gap-2 px-3 pb-10">
        {NOTIFICATIONS.map((n, i) => (
          <Reveal key={n.name} active={active} delay={0.2 + i * 0.25}>
            <div className="flex gap-2.5 rounded-[18px] bg-white/80 p-2.5 text-[#121212] backdrop-blur-md">
              <span className="size-9 shrink-0 overflow-hidden rounded-[10px]">
                <AgentFace agent={agent(n.name)} className="size-full" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[13px] font-semibold">
                    {n.name} · {n.title}
                  </p>
                  <span className="shrink-0 text-[11px] text-[#5E5C57]">{n.when}</span>
                </div>
                <p className="text-[12.5px] leading-snug text-[#3A3936]">{n.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
