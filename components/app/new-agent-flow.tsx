"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, CircleNotch } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { AgentFace } from "@/components/landing/agent-face";
import { AGENT_PROFILES, agentProfile } from "@/lib/agents/catalog";
import { api, ApiError } from "@/lib/api";
import type { UserAgent } from "@/lib/types";
import { AgentEditor, AgentPreview, draftFromTemplate, type AgentDraft } from "./agent-editor";
import { btn } from "./ui";

/** Pick who they start as, then make them yours. */
export function NewAgentFlow({ initialTemplate }: { initialTemplate?: string }) {
  const router = useRouter();
  const valid = initialTemplate && agentProfile(initialTemplate) ? initialTemplate.toLowerCase() : null;
  const [draft, setDraft] = useState<AgentDraft | null>(valid ? draftFromTemplate(valid) : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      const agent = await api<UserAgent>("/agents", {
        method: "POST",
        body: {
          template: draft.template,
          name: draft.name.trim() || agentProfile(draft.template)!.name,
          voice: draft.voice,
          look: draft.look,
          personality: draft.personality,
          instructions: draft.instructions.trim() || null,
        },
      });
      router.push(`/app/agents/${agent.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create the agent. Try again.");
      setBusy(false);
    }
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!draft ? (
        <motion.div
          key="pick"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
        >
          <h1 className="font-display text-[clamp(2rem,6vw,2.75rem)] leading-[1.02] font-medium tracking-[-0.04em]">
            Who should they start as?
          </h1>
          <p className="mt-2 text-[15px] text-ink-soft">
            Each one is good at something. You can change everything next.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AGENT_PROFILES.map((a) => (
              <li key={a.name}>
                <button
                  type="button"
                  onClick={() => setDraft(draftFromTemplate(a.name))}
                  className="flex h-full w-full items-start gap-4 rounded-[24px] bg-plate p-4 text-left ring-1 ring-line transition-all hover:-translate-y-0.5 hover:ring-ink/25"
                >
                  <span className="size-14 shrink-0 overflow-hidden rounded-full">
                    <AgentFace agent={a} className="size-full" />
                  </span>
                  <span>
                    <span className="block text-[16px] font-semibold">{a.role}</span>
                    <span className="mt-1 block text-[14px] leading-snug text-ink-soft">{a.pitch}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      ) : (
        <motion.div
          key="edit"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12"
        >
          <div>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className={cn(btn.icon, "-ml-2 mb-2")}
              aria-label="Pick someone else"
            >
              <ArrowLeft />
            </button>
            <div className="mb-8 flex items-center gap-4 lg:hidden">
              <AgentPreview draft={draft} size="sm" />
              <div>
                <p className="font-display text-[26px] leading-none font-medium tracking-[-0.03em]">
                  {draft.name || agentProfile(draft.template)!.name}
                </p>
                <p className="mt-1 text-[14px] text-ink-soft">{agentProfile(draft.template)!.role}</p>
              </div>
            </div>
            <AgentEditor draft={draft} onChange={setDraft} />
            {error && <p className="mt-6 rounded-2xl bg-coral/15 px-4 py-3 text-[15px]">{error}</p>}
            <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] mt-8 lg:static">
              <button
                type="button"
                onClick={create}
                disabled={busy}
                className={cn(btn.primary, "w-full sm:w-auto sm:min-w-56")}
              >
                {busy && <CircleNotch className="animate-spin" />} Create{" "}
                {draft.name || agentProfile(draft.template)!.name}
              </button>
            </div>
          </div>
          <aside className="hidden lg:block">
            <div className="sticky top-10 flex flex-col items-center rounded-[32px] bg-plate p-8 text-center ring-1 ring-line">
              <AgentPreview draft={draft} />
              <p className="mt-5 font-display text-[32px] leading-none font-medium tracking-[-0.04em]">
                {draft.name || agentProfile(draft.template)!.name}
              </p>
              <p className="mt-2 text-[14px] text-ink-soft">
                {agentProfile(draft.template)!.role} · {draft.voice}
              </p>
            </div>
          </aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
