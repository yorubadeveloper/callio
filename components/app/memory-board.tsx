"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DownloadSimple, Plus } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { PersonalAgent } from "@/lib/agents/personalize";
import { api, ApiError } from "@/lib/api";
import type { Memory } from "@/lib/types";
import { MemoryList } from "./agent-profile";
import { MemoryImport } from "./memory-import";
import { btn, inputClass, PageTitle, Sheet } from "./ui";
import { Spinner } from "@/components/brand/logo-loader";

export function MemoryBoard({
  memories: initial,
  agents,
  openImport,
}: {
  memories: Memory[];
  agents: PersonalAgent[];
  openImport: boolean;
}) {
  const router = useRouter();
  const [memories, setMemories] = useState(initial);
  const [importing, setImporting] = useState(openImport);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<number | null>(null);

  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      const m = await api<Memory>("/memory", { method: "POST", body: { text: text.trim(), agent_id: null } });
      setMemories((all) => [m, ...all]);
      setText("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that.");
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id: string) => {
    setMemories((all) => all.filter((m) => m.id !== id));
    await api(`/memory/${id}`, { method: "DELETE" }).catch(() => undefined);
  };

  return (
    <>
      <PageTitle
        title="Memory"
        subtitle="What your agents know about you. Delete anything, any time."
        action={
          <button
            type="button"
            onClick={() => setImporting(true)}
            className={cn(btn.primary, "hidden h-11 px-5 sm:inline-flex")}
          >
            <DownloadSimple weight="bold" /> Import
          </button>
        }
      />
      <button type="button" onClick={() => setImporting(true)} className={cn(btn.soft, "mb-6 w-full sm:hidden")}>
        <DownloadSimple weight="bold" /> Import from ChatGPT, Claude or Gemini
      </button>
      {saved !== null && (
        <p role="status" className="mb-6 rounded-2xl bg-teal/15 px-4 py-3 text-[15px]">
          Saved {saved} {saved === 1 ? "thing" : "things"}. Your agents will use them from your next call.
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) void add();
        }}
        className="flex gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
          placeholder="Tell all your agents something, e.g. “I'm vegetarian”"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={!text.trim() || busy}
          aria-label="Add"
          className={cn(btn.primary, "w-12 shrink-0 px-0")}
        >
          {busy ? <Spinner /> : <Plus weight="bold" />}
        </button>
      </form>
      {error && <p className="mt-2 text-[14px] text-[#B0412C] dark:text-coral">{error}</p>}

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <MemoryList
          title="Every agent knows"
          items={memories.filter((m) => m.agent_id === null)}
          onRemove={remove}
          empty="Nothing shared yet. Add something above or import from another assistant."
        />
        <div className="space-y-8">
          {agents.map((a) => (
            <div key={a.id}>
              <MemoryList
                title={`Only ${a.name} knows`}
                items={memories.filter((m) => m.agent_id === a.id)}
                onRemove={remove}
                empty={`${a.name} saves things here as you talk.`}
              />
            </div>
          ))}
        </div>
      </div>

      <Sheet open={importing} onClose={() => setImporting(false)} title="Bring your memory over" wide>
        <MemoryImport
          onDone={(_, n) => {
            setImporting(false);
            setSaved(n);
            router.refresh();
            void api<Memory[]>("/memory").then(setMemories);
          }}
        />
      </Sheet>
    </>
  );
}
