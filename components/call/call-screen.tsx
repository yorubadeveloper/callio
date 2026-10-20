"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  CaretDown,
  ChatText,
  Check,
  Lightbulb,
  Microphone,
  MicrophoneSlash,
  Phone,
  PhoneDisconnect,
  SpeakerHigh,
  SpeakerLow,
  WarningCircle,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo";
import { EASE_OUT } from "@/components/landing/motion";
import type { AgentProfile } from "@/lib/agents/catalog";
import { CREDIT_COSTS } from "@/lib/pricing";
import type { AudioOutput, CallEngine, CallSnapshot } from "@/lib/call/types";
import { AgentOrb } from "./agent-orb";
import { CallSummary } from "./call-summary";
import { SkillsSheet } from "./skills-sheet";
import { Spinner } from "@/components/brand/logo-loader";

const STATUS_LINE: Record<CallSnapshot["activity"], string> = {
  listening: "Listening",
  speaking: "Speaking",
  thinking: "Working on it",
};

export function CallScreen({
  agent,
  engine,
  credits,
  demo = false,
}: {
  agent: AgentProfile;
  engine: CallEngine;
  credits: number;
  /** A scripted call for visitors who haven't signed up. */
  demo?: boolean;
}) {
  const snap = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [outputs, setOutputs] = useState<AudioOutput[] | null>(null);

  // Like a phone: on desktop browsers that can route audio, pick the output;
  // otherwise the button flips between speaker and quieter earpiece volume.
  const onSpeaker = async () => {
    const audio = engine.audio;
    if (!audio) return;
    const list = await audio.listOutputs().catch(() => []);
    if (list.length > 1) setOutputs(list);
    else audio.setSpeaker(!snap.speaker);
  };

  // Hang up if the person leaves the page mid-call.
  useEffect(() => () => engine.end(), [engine]);

  const { status } = snap;
  const inCall = status === "connecting" || status === "live";
  const home = demo ? "/" : "/app";

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[#0E0E10] text-[#F3F2EE]">
      <Aurora color={agent.face.skin} tile={agent.face.tile} />

      {/* top bar */}
      <header className="relative z-10 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),1rem)]">
        <Link
          href={home}
          aria-label={demo ? "Back to Callio" : "Back to your agents"}
          className="grid size-11 place-items-center rounded-full bg-white/8 text-xl transition-colors hover:bg-white/15"
        >
          <CaretDown />
        </Link>
        <span className="flex items-center gap-1.5 text-[13px] text-white/60">
          <LogoMark className="size-4" /> {demo ? "Demo call" : "Callio call"}
        </span>
        <button
          type="button"
          onClick={() => setSkillsOpen(true)}
          aria-label="What can I ask?"
          className="grid size-11 place-items-center rounded-full bg-white/8 text-xl transition-colors hover:bg-white/15"
        >
          <Lightbulb />
        </button>
      </header>

      {/* agent, with the transcript beside it on wide screens */}
      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center px-6 pt-[6vh] lg:flex-row lg:items-center lg:justify-center lg:gap-20 lg:pt-0">
        <div className="flex w-full flex-col items-center lg:w-auto">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: status === "live" ? 0.92 : 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 140, damping: 18 }}
            className="w-[min(52vw,240px,30dvh)] lg:w-[min(300px,36dvh)]"
          >
            <AgentOrb agent={agent} levels={engine.levels} status={status} />
          </motion.div>
          <h1 className="mt-7 font-display text-[clamp(2.2rem,9vw,3rem)] leading-none font-medium tracking-[-0.04em]">
            {agent.name}
          </h1>
          <StatusLine snap={snap} role={agent.role} />

          <Actions snap={snap} />
        </div>

        <div className="mt-auto w-full max-w-md pb-4 lg:hidden">
          {status === "live" && captionsOn && <Captions snap={snap} name={agent.name} />}
        </div>
        {status === "live" && captionsOn && (
          <aside className="hidden h-[min(560px,62dvh)] w-[380px] flex-col rounded-[28px] bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur-xl lg:flex">
            <p className="text-[12px] font-medium uppercase tracking-wider text-white/45">Live transcript</p>
            <Captions snap={snap} name={agent.name} full />
          </aside>
        )}
      </main>

      {/* controls */}
      <footer className="relative z-10 px-6 pb-[max(env(safe-area-inset-bottom),1.75rem)] pt-2">
        {status === "idle" || status === "error" ? (
          <StartCall
            agentName={agent.name}
            credits={credits}
            error={snap.error}
            demo={demo}
            onStart={() => engine.start()}
          />
        ) : inCall ? (
          <div className="mx-auto flex max-w-sm items-end justify-between">
            <Control
              label={snap.muted ? "Unmute" : "Mute"}
              active={snap.muted}
              onClick={() => engine.setMuted(!snap.muted)}
              icon={snap.muted ? <MicrophoneSlash weight="fill" /> : <Microphone weight="fill" />}
              level={engine.levels}
            />
            {engine.audio && (
              <Control
                label="Speaker"
                active={snap.speaker}
                onClick={onSpeaker}
                icon={snap.speaker ? <SpeakerHigh weight="fill" /> : <SpeakerLow weight="fill" />}
              />
            )}
            <Control
              label="Captions"
              active={captionsOn}
              onClick={() => setCaptionsOn((v) => !v)}
              icon={<ChatText weight="fill" />}
            />
            <button
              type="button"
              onClick={() => engine.end()}
              className="flex flex-col items-center gap-2 text-[12px] text-white/70"
            >
              <span className="grid size-[72px] place-items-center rounded-full bg-coral text-[30px] text-white shadow-[0_10px_30px_-8px_#F17660] transition-transform active:scale-95">
                <PhoneDisconnect weight="fill" />
              </span>
              End
            </button>
          </div>
        ) : null}
      </footer>

      <AnimatePresence>
        {status === "ended" && (
          <CallSummary key="summary" agent={agent} snap={snap} demo={demo} onCallAgain={() => engine.start()} />
        )}
      </AnimatePresence>
      <SkillsSheet open={skillsOpen} onClose={() => setSkillsOpen(false)} agent={agent} />
      <OutputSheet
        outputs={outputs}
        current={snap.outputId}
        speaker={snap.speaker}
        onPick={(id) => void engine.audio?.setOutput(id)}
        onSpeaker={(on) => engine.audio?.setSpeaker(on)}
        onClose={() => setOutputs(null)}
      />
    </div>
  );
}

function Aurora({ color, tile }: { color: string; tile: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div
        className="aurora-a absolute -left-1/4 top-[-10%] size-[80vmax] rounded-full opacity-35 blur-[90px]"
        style={{ background: color }}
      />
      <div
        className="aurora-b absolute -right-1/3 bottom-[-20%] size-[70vmax] rounded-full opacity-25 blur-[100px]"
        style={{ background: tile }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#0E0E10_85%)]" />
    </div>
  );
}

function StatusLine({ snap, role }: { snap: CallSnapshot; role: string }) {
  const text =
    snap.status === "idle"
      ? role
      : snap.status === "connecting"
        ? "Calling…"
        : snap.status === "live"
          ? STATUS_LINE[snap.activity]
          : snap.status === "ended"
            ? "Call ended"
            : "Couldn't connect";
  return (
    <div className="mt-3 flex h-6 items-center gap-2 text-[15px] text-white/65">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={text}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
      {snap.status === "live" && snap.startedAt && (
        <>
          <span className="text-white/30">·</span>
          <CallTimer startedAt={snap.startedAt} />
        </>
      )}
    </div>
  );
}

function CallTimer({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((now - startedAt) / 1000));
  return (
    <span className="font-mono text-[14px] tabular-nums">
      {String(Math.floor(s / 60)).padStart(2, "0")}:{String(s % 60).padStart(2, "0")}
    </span>
  );
}

function Actions({ snap }: { snap: CallSnapshot }) {
  const recent = snap.actions.slice(-2);
  return (
    <ul className="mt-6 flex min-h-[76px] w-full max-w-sm flex-col items-center gap-2" aria-live="polite">
      <AnimatePresence initial={false}>
        {recent.map((a) => (
          <motion.li
            key={a.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-[13px] backdrop-blur-md"
          >
            {a.state === "running" ? (
              <Spinner />
            ) : a.state === "done" ? (
              <Check weight="bold" className="text-teal" />
            ) : (
              <WarningCircle weight="fill" className="text-coral" />
            )}
            {a.label}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

function Captions({ snap, name, full = false }: { snap: CallSnapshot; name: string; full?: boolean }) {
  const lines = full ? snap.captions : snap.captions.slice(-3);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (full) end.current?.scrollIntoView({ block: "end" });
  }, [full, snap.captions]);
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        full
          ? "mt-4 min-h-0 flex-1 overflow-y-auto pr-1"
          : "max-h-[22dvh] justify-end overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_35%)]",
      )}
      aria-live="polite"
    >
      {lines.map((c) => (
        <motion.p
          key={c.id}
          layout="position"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("text-[17px] leading-snug", c.who === "agent" ? "text-white" : "text-white/55")}
        >
          <span className="mr-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            {c.who === "agent" ? name : "You"}
          </span>
          {c.text}
        </motion.p>
      ))}
      <div ref={end} />
    </div>
  );
}

function Control({
  label,
  icon,
  active,
  onClick,
  level,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  level?: { you(): number };
}) {
  const ring = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!level) return;
    let smooth = 0;
    let frame = requestAnimationFrame(function tick() {
      smooth += (level.you() - smooth) * 0.25;
      ring.current?.style.setProperty("transform", `scale(${1 + smooth * 0.35})`);
      ring.current?.style.setProperty("opacity", `${smooth * 0.9}`);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [level]);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex flex-col items-center gap-2 text-[12px] text-white/70"
    >
      <span className="relative grid size-[60px] place-items-center">
        {level && <span ref={ring} className="absolute inset-0 rounded-full bg-teal/40" />}
        <span
          className={cn(
            "relative grid size-full place-items-center rounded-full text-[24px] transition-colors active:scale-95",
            active ? "bg-[#F3F2EE] text-[#121212]" : "bg-white/12 text-white",
          )}
        >
          {icon}
        </span>
      </span>
      {label}
    </button>
  );
}

function StartCall({
  agentName,
  credits,
  error,
  demo,
  onStart,
}: {
  agentName: string;
  credits: number;
  error?: string;
  demo: boolean;
  onStart: () => void;
}) {
  const empty = !demo && credits < CREDIT_COSTS.onlineMinute;
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4">
      {error && <p className="text-center text-sm text-coral">{error}</p>}
      <button
        type="button"
        onClick={onStart}
        disabled={empty}
        className="flex w-full items-center justify-center gap-3 rounded-full bg-teal py-4 text-[17px] font-semibold text-[#0E0E10] shadow-[0_12px_40px_-10px_#64B2AF] transition-transform active:scale-[0.98] disabled:opacity-40"
      >
        <Phone weight="fill" className="text-[22px]" /> {demo ? `Hear a call with ${agentName}` : `Call ${agentName}`}
      </button>
      <p className="text-center text-[13px] text-white/50">
        {demo ? (
          "Turn your sound on. A 30-second sample call, no microphone needed."
        ) : empty ? (
          <>
            You&apos;re out of credits.{" "}
            <Link href="/app/billing" className="text-white underline underline-offset-4">
              Top up to keep talking
            </Link>
          </>
        ) : (
          `${CREDIT_COSTS.onlineMinute} credit a minute · ${credits} credits left`
        )}
      </p>
    </div>
  );
}

/** Audio output picker, shown where the browser can route sound to a chosen device. */
function OutputSheet({
  outputs,
  current,
  speaker,
  onPick,
  onSpeaker,
  onClose,
}: {
  outputs: AudioOutput[] | null;
  current: string | null;
  speaker: boolean;
  onPick: (id: string) => void;
  onSpeaker: (on: boolean) => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {outputs && (
        <motion.div
          className="absolute inset-0 z-40 flex items-end justify-center bg-black/50 backdrop-blur-sm lg:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            role="dialog"
            aria-label="Audio output"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="w-full rounded-t-[32px] bg-[#1A1A1D] px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-5 lg:max-w-sm lg:rounded-[32px] lg:pb-5"
          >
            <h2 className="px-1 font-display text-[22px] font-medium tracking-[-0.03em]">Audio output</h2>
            <ul className="mt-4 space-y-1">
              {outputs.map((o) => {
                const selected = (current ?? "default") === o.id;
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onPick(o.id);
                        onClose();
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-[15px] transition-colors",
                        selected ? "bg-white/12" : "hover:bg-white/6",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <SpeakerHigh weight="fill" className="text-white/60" /> {o.label}
                      </span>
                      {selected && <Check weight="bold" className="text-teal" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => onSpeaker(!speaker)}
              className="mt-3 flex w-full items-center justify-between rounded-2xl bg-white/6 px-4 py-3.5 text-[15px]"
            >
              <span>{speaker ? "Full volume" : "Quiet, like holding the phone"}</span>
              <span className="text-[13px] text-white/50">Tap to switch</span>
            </button>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
