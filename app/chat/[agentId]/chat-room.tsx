"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Alarm,
  ArrowLeft,
  ArrowUp,
  Brain,
  Browser,
  CalendarCheck,
  DotsThree,
  MagnifyingGlass,
  NotePencil,
  Phone,
  Sparkle,
  Trash,
  WarningCircle,
  type Icon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { AgentFace } from "@/components/landing/agent-face";
import { btn } from "@/components/app/btn";
import type { PersonalAgent } from "@/lib/agents/personalize";
import { TOOLS } from "@/lib/agents/tools";
import { api, ApiError } from "@/lib/api";
import { clockTime, dayLabel } from "@/lib/format";
import { CREDIT_COSTS } from "@/lib/pricing";
import type { CallAction } from "@/lib/call/types";
import type { ChatMessage } from "@/lib/types";

const KIND_ICON: Record<CallAction["kind"], Icon> = {
  memory: Brain,
  calendar: CalendarCheck,
  schedule: Alarm,
  search: MagnifyingGlass,
  task: Browser,
  recap: NotePencil,
  other: Sparkle,
};

const SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;

type Pending = ChatMessage & { pending?: true };

/** A text chat with one agent. Calling stays one tap away in the header. */
export function ChatRoom({
  agent,
  initial,
  hasMore: initialHasMore,
  credits,
  timezone,
  locale,
}: {
  agent: PersonalAgent;
  initial: ChatMessage[];
  hasMore: boolean;
  credits: number;
  timezone: string;
  locale: string;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [messages, setMessages] = useState<Pending[]>(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; status: number; retry?: string } | null>(null);
  const [menu, setMenu] = useState<"closed" | "open" | "confirm">("closed");
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const stick = useRef(true);
  const empty = messages.length === 0;

  // Follow the conversation down, unless they scrolled up to read.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTo({ top: el.scrollHeight, behavior: messages.length > 1 ? "smooth" : "auto" });
  }, [messages, busy]);

  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  async function send(text = draft) {
    text = text.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    setDraft("");
    stick.current = true;
    const temp: Pending = {
      id: `pending-${Date.now()}`,
      who: "you",
      text,
      tools: [],
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages((m) => [...m, temp]);
    try {
      const res = await api<{ messages: ChatMessage[] }>(`/agents/${agent.id}/chat`, {
        method: "POST",
        body: { text },
      });
      setMessages((m) => [...m.filter((x) => x.id !== temp.id), ...res.messages]);
      // Credits and anything the agent changed (memory, reminders) show elsewhere in the app.
      router.refresh();
    } catch (err) {
      setMessages((m) => m.filter((x) => x.id !== temp.id));
      const status = err instanceof ApiError ? err.status : 0;
      setError({ text: err instanceof Error ? err.message : "Something went wrong. Try again.", status, retry: text });
      setDraft((d) => d || text);
    } finally {
      setBusy(false);
      input.current?.focus();
    }
  }

  async function loadEarlier() {
    const first = messages[0];
    if (!first) return;
    const res = await api<{ messages: ChatMessage[]; has_more: boolean }>(
      `/agents/${agent.id}/chat?before=${encodeURIComponent(first.created_at)}`,
    );
    stick.current = false;
    setMessages((m) => [...res.messages, ...m]);
    setHasMore(res.has_more);
  }

  async function clear() {
    setMenu("closed");
    await api(`/agents/${agent.id}/chat`, { method: "DELETE" });
    setMessages([]);
    setHasMore(false);
  }

  return (
    <div className="flex h-dvh flex-col bg-page font-body text-ink">
      {/* header */}
      <header className="relative z-10 border-b border-line bg-page/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-2xl items-center gap-2 px-2 sm:px-4">
          <Link href={`/app/agents/${agent.id}`} aria-label="Back" className={btn.icon}>
            <ArrowLeft />
          </Link>
          <Link href={`/app/agents/${agent.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-full py-1">
            <span className="size-10 shrink-0 overflow-hidden rounded-full ring-2 ring-page">
              <AgentFace agent={agent} className="size-full" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-[19px] leading-tight font-medium tracking-[-0.03em]">
                {agent.name}
              </span>
              <span className="block truncate text-[13px] text-ink-soft">
                {busy ? <span className="text-teal">typing…</span> : agent.role}
              </span>
            </span>
          </Link>
          <div className="relative">
            <button
              type="button"
              aria-label="More"
              aria-expanded={menu !== "closed"}
              onClick={() => setMenu((m) => (m === "closed" ? "open" : "closed"))}
              className={btn.icon}
            >
              <DotsThree weight="bold" />
            </button>
            <AnimatePresence>
              {menu !== "closed" && (
                <motion.div
                  initial={reduce ? false : { opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 top-12 w-56 origin-top-right rounded-2xl bg-plate p-1.5 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.45)] ring-1 ring-line"
                >
                  <button
                    type="button"
                    disabled={empty}
                    onClick={() => (menu === "confirm" ? void clear() : setMenu("confirm"))}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-[#B0412C] transition-colors hover:bg-coral/10 disabled:opacity-40 dark:text-coral"
                  >
                    <Trash />
                    {menu === "confirm" ? "Tap again to clear" : "Clear this chat"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Link href={`/call/${agent.id}`} className={cn(btn.call, "h-10 px-4 text-[14px] sm:px-5")}>
            <Phone weight="fill" />
            <span>
              Call<span className="hidden sm:inline"> {agent.name}</span>
            </span>
          </Link>
        </div>
      </header>

      {/* messages */}
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex-1 overflow-y-auto overscroll-contain"
        onClick={() => menu !== "closed" && setMenu("closed")}
      >
        <div className="mx-auto flex min-h-full max-w-2xl flex-col px-4 pb-4 pt-6 sm:px-6">
          {empty ? (
            <Welcome agent={agent} onPick={(t) => { setDraft(t); input.current?.focus(); }} />
          ) : (
            <>
              {hasMore && (
                <button
                  type="button"
                  onClick={loadEarlier}
                  className="mx-auto mb-4 rounded-full bg-ink/[0.06] px-4 py-1.5 text-[13px] font-semibold text-ink-soft transition-colors hover:bg-ink/10"
                >
                  Show earlier
                </button>
              )}
              <div className="mt-auto flex flex-col gap-1.5">
                {messages.map((m, i) => {
                  const prev = messages[i - 1];
                  const day = dayLabel(m.created_at, timezone, locale);
                  const newDay = !prev || dayLabel(prev.created_at, timezone, locale) !== day;
                  const grouped = !newDay && prev?.who === m.who;
                  return (
                    <Fragment key={m.id}>
                      {newDay && (
                        <p className="my-3 text-center text-[12px] font-semibold uppercase tracking-wider text-ink-soft/80">
                          {day}
                        </p>
                      )}
                      <Bubble agent={agent} message={m} grouped={grouped} timezone={timezone} locale={locale} />
                    </Fragment>
                  );
                })}
                <AnimatePresence>{busy && <Typing agent={agent} />}</AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>

      {/* composer */}
      <div className="border-t border-line bg-page/90 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-3 sm:px-6">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-2 flex items-center gap-2 rounded-2xl bg-coral/10 px-3.5 py-2.5 text-[14px] text-[#B0412C] dark:text-coral"
                role="alert"
              >
                <WarningCircle weight="fill" className="shrink-0" />
                <span className="min-w-0 flex-1">{error.text}</span>
                {error.status === 402 ? (
                  <Link href="/app/billing" className="shrink-0 font-semibold underline underline-offset-4">
                    Top up
                  </Link>
                ) : (
                  error.retry && (
                    <button
                      type="button"
                      onClick={() => {
                        setDraft("");
                        void send(error.retry);
                      }}
                      className="shrink-0 font-semibold underline underline-offset-4"
                    >
                      Try again
                    </button>
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-end gap-2 rounded-[26px] bg-plate p-1.5 pl-4 ring-1 ring-line transition-shadow focus-within:ring-ink/30"
          >
            <label htmlFor="chat-input" className="sr-only">
              Message {agent.name}
            </label>
            <textarea
              id="chat-input"
              ref={input}
              rows={1}
              value={draft}
              maxLength={4000}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(hover: hover)").matches) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={`Message ${agent.name}`}
              className="max-h-40 min-h-9 flex-1 resize-none bg-transparent py-2 text-[16px] leading-snug text-ink outline-none placeholder:text-ink-soft/70"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={busy || !draft.trim()}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-[19px] text-page transition-[transform,opacity] duration-200 hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-25"
            >
              <ArrowUp weight="bold" />
            </button>
          </form>
          <p className="mt-2 text-center text-[12px] text-ink-soft/80">
            {CREDIT_COSTS.chatRepliesPerCredit} replies per credit · {credits} credits left
          </p>
        </div>
      </div>
    </div>
  );
}

function Welcome({ agent, onPick }: { agent: PersonalAgent; onPick: (text: string) => void }) {
  const ideas = ["What's on my calendar today?", "Remind me to call Mum at 6pm", "Remember that I'm vegetarian"];
  return (
    <div className="m-auto flex max-w-sm flex-col items-center py-10 text-center">
      <span className="relative">
        <span aria-hidden className="absolute -inset-6 rounded-full opacity-50 blur-2xl" style={{ background: agent.face.skin }} />
        <span className="relative block size-24 overflow-hidden rounded-full shadow-[0_18px_40px_-20px_rgb(0_0_0/0.6)] ring-4 ring-page">
          <AgentFace agent={agent} className="size-full" />
        </span>
      </span>
      <h1 className="mt-6 font-display text-[30px] leading-tight font-medium tracking-[-0.04em]">Message {agent.name}</h1>
      <p className="mt-2 text-[15px] text-ink-soft">
        Same {agent.name}, same memory, in writing. For anything you&apos;d rather talk through, call instead.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {ideas.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onPick(t)}
            className="rounded-full bg-plate px-3.5 py-2 text-[14px] text-ink ring-1 ring-line transition-transform duration-200 hover:-translate-y-0.5"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function Bubble({
  agent,
  message: m,
  grouped,
  timezone,
  locale,
}: {
  agent: PersonalAgent;
  message: Pending;
  grouped: boolean;
  timezone: string;
  locale: string;
}) {
  const reduce = useReducedMotion();
  const mine = m.who === "you";
  return (
    <motion.div
      layout={reduce ? false : "position"}
      initial={reduce ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: m.pending ? 0.7 : 1, y: 0, scale: 1 }}
      transition={SPRING}
      className={cn("group flex flex-col", mine ? "items-end" : "items-start", !grouped && "mt-2")}
    >
      <div
        title={clockTime(m.created_at, timezone, locale)}
        className={cn(
          "max-w-[85%] whitespace-pre-wrap break-words px-4 py-2.5 text-[16px] leading-[1.45] sm:max-w-[75%]",
          mine
            ? "rounded-[22px] rounded-br-md bg-ink text-page"
            : "rounded-[22px] rounded-bl-md text-[#161514]",
        )}
        style={mine ? undefined : { background: agent.face.tile }}
      >
        <Linked text={m.text} />
      </div>
      {m.tools.length > 0 && (
        <ul className="mt-1.5 flex max-w-[85%] flex-wrap gap-1.5">
          {m.tools.map((t, i) => (
            <ToolChip key={i} tool={t} />
          ))}
        </ul>
      )}
    </motion.div>
  );
}

function ToolChip({ tool }: { tool: ChatMessage["tools"][number] }) {
  const meta = TOOLS[tool.name];
  const Glyph = tool.ok ? KIND_ICON[meta?.kind ?? "other"] : WarningCircle;
  let label = tool.name.replaceAll("_", " ");
  try {
    if (meta) label = meta.label(tool.args);
  } catch {
    // a label that can't read these args falls back to the tool's name
  }
  return (
    <li
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-medium",
        tool.ok ? "bg-ink/[0.05] text-ink-soft" : "bg-coral/10 text-[#B0412C] dark:text-coral",
      )}
    >
      <Glyph weight="fill" className={cn("shrink-0", tool.ok && "text-teal")} />
      <span className="truncate">{tool.ok ? label : `Couldn't: ${label}`}</span>
    </li>
  );
}

function Typing({ agent }: { agent: PersonalAgent }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      transition={SPRING}
      className="mt-2 flex"
      aria-label={`${agent.name} is typing`}
    >
      <div className="flex gap-1 rounded-[22px] rounded-bl-md px-4 py-3.5" style={{ background: agent.face.tile }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-[#161514]/45"
            animate={reduce ? undefined : { y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/** Plain text with web links made clickable. */
function Linked({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s<>"')\]]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            {p.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>
        ) : (
          p
        ),
      )}
    </>
  );
}
