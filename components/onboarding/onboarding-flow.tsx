"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Bell, Check, Phone } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/brand/logo";
import { AgentFace } from "@/components/landing/agent-face";
import { AGENT_PROFILES, agentProfile } from "@/lib/agents/catalog";
import { api, ApiError } from "@/lib/api";
import { enablePush, pushSupported } from "@/lib/push";
import type { User, UserAgent } from "@/lib/types";
import { AgentEditor, AgentPreview, draftFromTemplate, type AgentDraft } from "@/components/app/agent-editor";
import { CityInput } from "@/components/app/city-input";
import { MemoryImport } from "@/components/app/memory-import";
import { TimezoneSelect } from "@/components/app/select-menu";
import { btn, Chip, Field, inputClass } from "@/components/app/ui";
import { Spinner } from "@/components/brand/logo-loader";

const STEPS = ["you", "goals", "agent", "memory", "ready"] as const;
type StepId = (typeof STEPS)[number];

export const GOALS = [
  { id: "mornings", label: "Start my day right", template: "laura" },
  { id: "meetings", label: "Be ready for meetings", template: "maya" },
  { id: "habits", label: "Stick to my goals", template: "kemi" },
  { id: "family", label: "Check in on family", template: "ada" },
  { id: "language", label: "Practise a language", template: "mateo" },
  { id: "errands", label: "Get things done for me", template: "theo" },
  { id: "evenings", label: "Wind down at night", template: "zoe" },
  { id: "inbox", label: "Stay on top of email", template: "grace" },
] as const;

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "nl", label: "Nederlands" },
  { code: "yo", label: "Yorùbá" },
  { code: "ig", label: "Igbo" },
  { code: "ha", label: "Hausa" },
  { code: "pcm", label: "Pidgin" },
  { code: "ar", label: "العربية" },
];

const TITLES: Record<StepId, string> = {
  you: "First, what should your agents call you?",
  goals: "What would help most?",
  agent: "Meet your first agent",
  memory: "Bring what your other AI knows about you",
  ready: "You're all set",
};

export function OnboardingFlow({ user: initialUser }: { user: User }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [step, setStep] = useState<StepId>("you");
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [nickname, setNickname] = useState(user.nickname ?? user.name.split(" ")[0]);
  const [city, setCity] = useState(user.city ?? "");
  const [timezone, setTimezone] = useState(user.timezone);
  const [languages, setLanguages] = useState<string[]>(user.languages.length ? user.languages : ["en"]);
  // Step 2
  const [goals, setGoals] = useState<string[]>([]);
  // Step 3
  const [draft, setDraft] = useState<AgentDraft>(() => draftFromTemplate("laura"));
  const [agent, setAgent] = useState<UserAgent | null>(null);
  // Step 5
  const [push, setPush] = useState<"idle" | "granted" | "denied" | "unsupported">("idle");

  useEffect(() => {
    // The browser knows the timezone better than the server's default.
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected && initialUser.timezone !== detected && !initialUser.onboarded) setTimezone(detected);
  }, [initialUser]);


  const index = STEPS.indexOf(step);
  const go = (to: StepId) => {
    setDir(STEPS.indexOf(to) > index ? 1 : -1);
    setError(null);
    setStep(to);
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const next = () =>
    run(async () => {
      if (step === "you") {
        setUser(
          await api<User>("/me", {
            method: "PATCH",
            body: { nickname: nickname.trim() || null, city: city.trim() || null, timezone, languages },
          }),
        );
        go("goals");
      } else if (step === "goals") {
        const template = GOALS.find((g) => g.id === goals[0])?.template ?? "laura";
        if (draft.template !== template && !agent) setDraft(draftFromTemplate(template));
        go("agent");
      } else if (step === "agent") {
        const body = {
          name: draft.name.trim() || agentProfile(draft.template)!.name,
          voice: draft.voice,
          look: draft.look,
          personality: draft.personality,
          instructions: draft.instructions.trim() || null,
        };
        setAgent(
          agent
            ? await api<UserAgent>(`/agents/${agent.id}`, { method: "PATCH", body })
            : await api<UserAgent>("/agents", { method: "POST", body: { template: draft.template, ...body } }),
        );
        go("memory");
      } else if (step === "ready" && agent) {
        await api<User>("/me", { method: "PATCH", body: { onboarded: true } });
        router.push(`/call/${agent.id}`);
      }
    });

  const agentName = draft.name.trim() || agentProfile(draft.template)!.name;
  const callName = nickname.trim() || user.name.split(" ")[0];

  return (
    <div className="flex min-h-dvh flex-col bg-page font-body text-ink lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center gap-3 px-5 pt-[max(env(safe-area-inset-top),1rem)] sm:px-10">
          {index > 0 && step !== "ready" ? (
            <button type="button" onClick={() => go(STEPS[index - 1])} aria-label="Back" className={btn.icon}>
              <ArrowLeft />
            </button>
          ) : (
            <span className="text-lg">
              <Wordmark />
            </span>
          )}
          <ol className="ml-auto flex gap-1.5" aria-label={`Step ${index + 1} of ${STEPS.length}`}>
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i <= index ? "w-7 bg-ink" : "w-3 bg-line",
                )}
              />
            ))}
          </ol>
        </header>

        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col bg-page px-5 pb-6 pt-8 sm:px-10 sm:pt-12">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -28 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              className="flex flex-1 flex-col sm:flex-none"
            >
              <h1 className="font-display text-[clamp(1.9rem,6vw,2.6rem)] leading-[1.05] font-medium tracking-[-0.04em]">
                {step === "agent" ? `Meet ${agentName}` : TITLES[step]}
              </h1>

              {step === "you" && (
                <div className="mt-8 space-y-6">
                  <Field label="Your name, as your agents say it" hint="A nickname is perfect.">
                    {(id) => (
                      <input
                        id={id}
                        value={nickname}
                        maxLength={40}
                        onChange={(e) => setNickname(e.target.value)}
                        className={inputClass}
                        autoComplete="nickname"
                        autoFocus
                      />
                    )}
                  </Field>
                  <Field label="Where are you?" hint="For the weather and the right time of day.">
                    {(id) => (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <CityInput
                          id={id}
                          value={city}
                          onChange={setCity}
                          onPick={(place) => {
                            setCity(place.name);
                            setTimezone(place.timezone);
                          }}
                        />
                        <TimezoneSelect value={timezone} onChange={setTimezone} />
                      </div>
                    )}
                  </Field>
                  <div>
                    <p className="text-[14px] font-semibold">Languages you speak</p>
                    <p className="mt-0.5 text-[13px] text-ink-soft">Agents follow your lead and switch when you do.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {LANGUAGES.map((l) => (
                        <Chip
                          key={l.code}
                          selected={languages.includes(l.code)}
                          onClick={() =>
                            setLanguages((all) =>
                              all.includes(l.code)
                                ? all.length > 1
                                  ? all.filter((c) => c !== l.code)
                                  : all
                                : [...all, l.code].slice(0, 5),
                            )
                          }
                        >
                          {l.label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === "goals" && (
                <>
                  <p className="mt-3 text-[16px] text-ink-soft">
                    Pick a few, {callName}. We&apos;ll match you with an agent who&apos;s good at it.
                  </p>
                  <div className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {GOALS.map((g) => {
                      const a = agentProfile(g.template)!;
                      const on = goals.includes(g.id);
                      return (
                        <button
                          key={g.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setGoals((all) => (on ? all.filter((x) => x !== g.id) : [...all, g.id]))}
                          className={cn(
                            "flex min-h-16 items-center gap-3 rounded-[20px] px-3 py-2.5 text-left transition-all active:scale-[0.98]",
                            on ? "bg-ink text-page" : "bg-plate ring-1 ring-line hover:ring-ink/30",
                          )}
                        >
                          <span className="size-11 shrink-0 overflow-hidden rounded-full">
                            <AgentFace agent={a} className="size-full" />
                          </span>
                          <span className="flex-1 text-[15px] font-semibold leading-tight">{g.label}</span>
                          {on && <Check weight="bold" className="mr-1 text-amber" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {step === "agent" && (
                <>
                  <p className="mt-3 text-[16px] text-ink-soft">
                    {agentProfile(draft.template)!.pitch} Make them yours: rename them, change how they sound and look.
                  </p>
                  <div className="mt-6 flex items-center gap-4 lg:hidden">
                    <AgentPreview draft={draft} size="sm" />
                    <div className="min-w-0">
                      <p className="font-display text-[22px] font-medium tracking-[-0.03em]">{agentName}</p>
                      <p className="text-[14px] text-ink-soft">
                        {agentProfile(draft.template)!.role} · {draft.voice}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <TemplateSwitcher value={draft.template} onPick={(t) => setDraft(draftFromTemplate(t))} />
                  </div>
                  <div className="mt-8">
                    <AgentEditor draft={draft} onChange={setDraft} />
                  </div>
                </>
              )}

              {step === "memory" && (
                <>
                  <p className="mt-3 text-[16px] text-ink-soft">
                    If you use ChatGPT, Claude or Gemini, they already know a lot about you, including how you like to
                    be spoken to. Bring it over so {agentName} doesn&apos;t start from zero.
                  </p>
                  <div className="mt-8">
                    <MemoryImport
                      onDone={(u) => {
                        setUser(u);
                        // An imported nickname or city is better than what we guessed.
                        if (u.nickname) setNickname(u.nickname);
                        if (u.city) setCity(u.city);
                        go("ready");
                      }}
                      onSkip={() => go("ready")}
                    />
                  </div>
                </>
              )}

              {step === "ready" && (
                <div className="mt-8 flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
                  <div className="lg:hidden">
                    <AgentPreview draft={draft} />
                  </div>
                  <p className="mt-6 max-w-sm text-[17px] text-ink-soft lg:mt-0">
                    {agentName} knows your name is {callName}
                    {user.city ? ` and that you're in ${user.city}` : ""}. Say hello. You have {user.credits.total}{" "}
                    minutes of calls to start.
                  </p>
                  {pushSupported() && push !== "granted" && (
                    <button
                      type="button"
                      onClick={async () => setPush(await enablePush())}
                      className={cn(btn.soft, "mt-6")}
                    >
                      <Bell weight="fill" /> Let {agentName} ring you for scheduled calls
                    </button>
                  )}
                  {push === "granted" && (
                    <p className="mt-6 flex items-center gap-2 text-[15px] text-ink">
                      <Check weight="bold" className="text-teal" /> Notifications on
                    </p>
                  )}
                  {push === "denied" && (
                    <p className="mt-6 text-[14px] text-ink-soft">
                      No problem. You can turn this on later in settings.
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <p role="alert" className="mt-6 rounded-2xl bg-coral/15 px-4 py-3 text-[15px]">
              {error}
            </p>
          )}

          {step !== "memory" && (
            <div className="sticky bottom-0 -mx-5 mt-8 bg-gradient-to-t from-page via-page to-transparent px-5 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-6 sm:static sm:mx-0 sm:bg-none sm:p-0">
              <button
                type="button"
                onClick={next}
                disabled={busy || (step === "goals" && goals.length === 0)}
                className={cn(step === "ready" ? btn.call : btn.primary, "w-full sm:w-auto sm:min-w-56")}
              >
                {busy ? <Spinner /> : step === "ready" ? <Phone weight="fill" /> : null}
                {step === "ready" ? `Call ${agentName}` : step === "agent" ? `Keep ${agentName}` : "Continue"}
              </button>
            </div>
          )}
        </main>
      </div>

      {/* desktop: the agent taking shape */}
      <aside className="relative hidden overflow-hidden bg-plate lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:items-center lg:justify-center">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="aurora-a absolute -left-1/4 top-[-10%] size-[50vmax] rounded-full opacity-30 blur-[110px]"
            style={{ background: draft.look.skin }}
          />
          <div
            className="aurora-b absolute -right-1/4 bottom-[-15%] size-[45vmax] rounded-full opacity-25 blur-[110px]"
            style={{ background: draft.look.tile }}
          />
        </div>
        <div className="relative flex flex-col items-center text-center">
          {step === "you" || step === "goals" ? (
            <div className="grid grid-cols-3 gap-4">
              {AGENT_PROFILES.slice(0, 9).map((a, i) => (
                <motion.span
                  key={a.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="size-24 overflow-hidden rounded-full ring-4 ring-plate"
                >
                  <AgentFace agent={a} className="size-full" />
                </motion.span>
              ))}
            </div>
          ) : (
            <>
              <AgentPreview draft={draft} />
              <p className="mt-6 font-display text-[40px] leading-none font-medium tracking-[-0.04em]">{agentName}</p>
              <p className="mt-2 text-[16px] text-ink-soft">
                {agentProfile(draft.template)!.role} · voice {draft.voice}
              </p>
              <p className="mt-6 max-w-xs text-[15px] text-ink-soft">
                &ldquo;Hi {callName}, it&apos;s {agentName}. {agentProfile(draft.template)!.pitch.split(".")[0]}.&rdquo;
              </p>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function TemplateSwitcher({ value, onPick }: { value: string; onPick: (template: string) => void }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <p className="mb-2 text-[13px] text-ink-soft">Or start from someone else</p>
      <div className="flex gap-2 pb-1">
        {AGENT_PROFILES.map((a) => {
          const on = a.name.toLowerCase() === value;
          return (
            <button
              key={a.name}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(a.name.toLowerCase())}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-[14px] font-medium transition-colors",
                on ? "bg-ink text-page" : "bg-ink/[0.06] hover:bg-ink/10",
              )}
            >
              <span className="size-8 overflow-hidden rounded-full">
                <AgentFace agent={a} className="size-full" />
              </span>
              {a.role}
            </button>
          );
        })}
      </div>
    </div>
  );
}
