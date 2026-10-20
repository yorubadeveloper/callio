"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowSquareOut, Check, CircleNotch, Copy } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import type { ImportedFact, ProfileSuggestion, User } from "@/lib/types";
import { btn, inputClass } from "./ui";

export const IMPORT_PROMPT = `I'm setting up Callio, a personal AI assistant that talks to me by voice. Using everything you remember and know about me from our conversations, write a profile so it can get to know me. Include:

1. What I like to be called, and any nicknames.
2. Who I am: what I do, where I live, my timezone, the languages I speak.
3. The important people in my life and how they relate to me.
4. My routines, goals, and what I'm working on right now.
5. How I talk and write: my tone, humour, phrases I use, how direct I am, how much detail I like, and how I like to be spoken to.
6. My interests and preferences: food, music, sport, teams, anything that would help someone help me.

Write plain bullet points, one fact per line, grouped under those six headings. Only include things you actually know about me; don't guess. Leave out passwords, account numbers and other sensitive details.`;

const PROVIDERS = [
  { id: "chatgpt", name: "ChatGPT", open: (p: string) => `https://chatgpt.com/?q=${encodeURIComponent(p)}` },
  { id: "claude", name: "Claude", open: (p: string) => `https://claude.ai/new?q=${encodeURIComponent(p)}` },
  { id: "gemini", name: "Gemini", open: () => "https://gemini.google.com/app" },
] as const;

const CATEGORY: Record<ImportedFact["category"], string> = {
  about: "About you",
  people: "People",
  work: "Work",
  preferences: "Preferences",
  routines: "Routines",
  goals: "Goals",
  other: "Other",
};

type Step = "prompt" | "review";

/**
 * Brings what another assistant knows about you into Callio. Nothing is saved
 * until you've reviewed it, and you can untick anything.
 */
export function MemoryImport({ onDone, onSkip }: { onDone: (user: User, saved: number) => void; onSkip?: () => void }) {
  const [step, setStep] = useState<Step>("prompt");
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number]["id"]>("chatgpt");
  const [copied, setCopied] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facts, setFacts] = useState<(ImportedFact & { keep: boolean })[]>([]);
  const [profile, setProfile] = useState<ProfileSuggestion>({});
  const [keepProfile, setKeepProfile] = useState<Record<string, boolean>>({});

  const chosen = PROVIDERS.find((p) => p.id === provider)!;

  const copy = async () => {
    await navigator.clipboard.writeText(IMPORT_PROMPT).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const read = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ facts: ImportedFact[]; profile: ProfileSuggestion }>("/memory/import/parse", {
        method: "POST",
        body: { text },
      });
      setFacts(res.facts.map((f) => ({ ...f, keep: true })));
      const suggested = Object.fromEntries(Object.entries(res.profile ?? {}).filter(([, v]) => hasValue(v)));
      setProfile(suggested);
      setKeepProfile(Object.fromEntries(Object.keys(suggested).map((k) => [k, true])));
      setStep("review");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't read that. Try pasting it again.");
    } finally {
      setBusy(false);
    }
  };

  const keptFacts = facts.filter((f) => f.keep);
  const keptProfile = Object.fromEntries(Object.entries(profile).filter(([k]) => keepProfile[k]));
  const total = keptFacts.length + Object.keys(keptProfile).length;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ saved: number; user: User }>("/memory/import/commit", {
        method: "POST",
        body: { facts: keptFacts.map((f) => f.text), profile: keptProfile },
      });
      onDone(res.user, res.saved);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that. Try again.");
      setBusy(false);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<ImportedFact["category"], number[]>();
    facts.forEach((f, i) => map.set(f.category, [...(map.get(f.category) ?? []), i]));
    return [...map.entries()];
  }, [facts]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {step === "prompt" ? (
        <motion.div
          key="prompt"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <div role="tablist" aria-label="Your assistant" className="flex gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={provider === p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                className={cn(
                  "min-h-11 flex-1 rounded-full text-[14px] font-semibold transition-colors",
                  provider === p.id ? "bg-ink text-page" : "bg-ink/[0.06] text-ink hover:bg-ink/10",
                )}
              >
                {p.name}
              </button>
            ))}
          </div>

          <ol className="mt-5 space-y-4">
            <Step n={1} title={`Ask ${chosen.name} what it knows about you`}>
              <div className="mt-3 max-h-36 overflow-y-auto rounded-2xl bg-page p-4 text-[13px] leading-relaxed whitespace-pre-line text-ink-soft ring-1 ring-line">
                {IMPORT_PROMPT}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={copy} className={cn(btn.soft, "h-11 px-5")}>
                  {copied ? <Check weight="bold" className="text-teal" /> : <Copy />}{" "}
                  {copied ? "Copied" : "Copy prompt"}
                </button>
                <a
                  href={chosen.open(IMPORT_PROMPT)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => void copy()}
                  className={cn(btn.primary, "h-11 px-5")}
                >
                  Open {chosen.name} <ArrowSquareOut />
                </a>
              </div>
            </Step>
            <Step n={2} title="Paste its answer here">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                maxLength={30000}
                placeholder={`Paste what ${chosen.name} wrote…`}
                className={cn(inputClass, "mt-3 resize-y")}
              />
            </Step>
          </ol>

          {error && <p className="mt-4 text-[14px] text-[#B0412C] dark:text-coral">{error}</p>}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {onSkip && (
              <button type="button" onClick={onSkip} className={btn.soft}>
                Skip for now
              </button>
            )}
            <button type="button" onClick={read} disabled={text.trim().length < 20 || busy} className={btn.primary}>
              {busy && <CircleNotch className="animate-spin" />} {busy ? "Reading…" : "Read it"}
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="review"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <p className="text-[15px] text-ink-soft">
            Here&apos;s what we picked up. Untick anything you don&apos;t want your agents to know.
          </p>

          {Object.keys(profile).length > 0 && (
            <div className="mt-5">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-soft">How you come across</p>
              <ul className="mt-2 space-y-2">
                {Object.entries(profile).map(([key, value]) => (
                  <CheckRow
                    key={key}
                    checked={Boolean(keepProfile[key])}
                    onToggle={() => setKeepProfile((k) => ({ ...k, [key]: !k[key] }))}
                    label={PROFILE_LABELS[key] ?? key}
                    text={Array.isArray(value) ? value.join(", ") : String(value)}
                  />
                ))}
              </ul>
            </div>
          )}

          {grouped.map(([category, indexes]) => (
            <div key={category} className="mt-5">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-soft">{CATEGORY[category]}</p>
              <ul className="mt-2 space-y-2">
                {indexes.map((i) => (
                  <CheckRow
                    key={i}
                    checked={facts[i].keep}
                    onToggle={() => setFacts((all) => all.map((f, j) => (j === i ? { ...f, keep: !f.keep } : f)))}
                    text={facts[i].text}
                  />
                ))}
              </ul>
            </div>
          ))}

          {error && <p className="mt-4 text-[14px] text-[#B0412C] dark:text-coral">{error}</p>}
          <div className="sticky bottom-0 -mx-1 mt-6 flex flex-col-reverse gap-3 bg-inherit px-1 pb-1 pt-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setStep("prompt")} className={btn.soft}>
              Back
            </button>
            <button type="button" onClick={save} disabled={total === 0 || busy} className={btn.primary}>
              {busy && <CircleNotch className="animate-spin" />} Save {total} {total === 1 ? "thing" : "things"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const PROFILE_LABELS: Record<string, string> = {
  nickname: "Call you",
  about: "Who you are",
  style: "How you talk",
  tone: "Tone",
  detail: "Detail you like",
  interests: "Interests",
  languages: "Languages",
  city: "City",
  timezone: "Timezone",
};

function hasValue(v: unknown) {
  return Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && String(v).trim() !== "";
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-semibold text-page">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="pt-0.5 text-[15px] font-semibold text-ink">{title}</p>
        {children}
      </div>
    </li>
  );
}

function CheckRow({
  checked,
  onToggle,
  label,
  text,
}: {
  checked: boolean;
  onToggle: () => void;
  label?: string;
  text: string;
}) {
  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onToggle}
        className={cn(
          "flex w-full items-start gap-3 rounded-2xl px-3.5 py-3 text-left transition-colors",
          checked ? "bg-teal/12" : "bg-ink/[0.04] opacity-60",
        )}
      >
        <span
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md ring-1 transition-colors",
            checked ? "bg-ink text-page ring-ink" : "ring-line",
          )}
        >
          {checked && <Check weight="bold" className="size-3.5" />}
        </span>
        <span className="text-[15px] leading-snug text-ink">
          {label && <span className="font-semibold">{label}: </span>}
          {text}
        </span>
      </button>
    </li>
  );
}
