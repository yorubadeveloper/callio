"use client";

import { motion } from "motion/react";
import { Eyeglasses, Shuffle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { AgentFace } from "@/components/landing/agent-face";
import type { HairStyle } from "@/components/landing/agents";
import { agentProfile } from "@/lib/agents/catalog";
import { PERSONALITIES, VOICES } from "@/lib/agents/personalize";
import type { AgentLook, PersonalityId } from "@/lib/types";
import { Field, inputClass } from "./ui";

export interface AgentDraft {
  template: string;
  name: string;
  voice: string;
  look: AgentLook;
  personality: PersonalityId | null;
  instructions: string;
}

export function draftFromTemplate(template: string): AgentDraft {
  const base = agentProfile(template)!;
  return {
    template: template.toLowerCase(),
    name: base.name,
    voice: base.persona.voice,
    look: { ...base.face, glasses: Boolean(base.face.glasses) },
    personality: null,
    instructions: "",
  };
}

const SKINS = [
  "#F17660",
  "#F4BA6A",
  "#64B2AF",
  "#8896E3",
  "#F6A7D2",
  "#9B6BE0",
  "#CFE64E",
  "#E8B58F",
  "#B87952",
  "#7A4A2E",
];
const TILES = ["#CFE7E5", "#FBE5C4", "#FBD3CA", "#D9DEF8", "#ECEAE4", "#F3E2F0", "#DFF0D8", "#2A2A30"];
const HAIR_COLORS = ["#121212", "#5B3A22", "#C98A4B", "#F4BA6A", "#F17660", "#8896E3", "#E8E6E1"];
const SHIRTS = ["#FFFFFF", "#121212", "#F17660", "#F4BA6A", "#64B2AF", "#8896E3"];
const HAIRS: HairStyle[] = ["bob", "bun", "curls", "flat", "puffs", "swoop", "none"];

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

export function AgentPreview({ draft, size = "lg" }: { draft: AgentDraft; size?: "sm" | "lg" }) {
  const base = agentProfile(draft.template)!;
  return (
    <motion.span
      key={JSON.stringify(draft.look)}
      initial={{ scale: 0.94, rotate: -3 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 16 }}
      className={cn(
        "block shrink-0 overflow-hidden rounded-full ring-4 ring-plate shadow-[0_20px_50px_-24px_rgb(0_0_0/0.5)]",
        size === "lg" ? "size-40 sm:size-48" : "size-16",
      )}
    >
      <AgentFace agent={{ ...base, name: draft.name || base.name, face: draft.look }} className="size-full" />
    </motion.span>
  );
}

/** Everything that makes an agent theirs: name, voice, personality, look, and their own instructions. */
export function AgentEditor({ draft, onChange }: { draft: AgentDraft; onChange: (d: AgentDraft) => void }) {
  const base = agentProfile(draft.template)!;
  const set = (patch: Partial<AgentDraft>) => onChange({ ...draft, ...patch });
  const setLook = (patch: Partial<AgentLook>) => set({ look: { ...draft.look, ...patch } });

  return (
    <div className="space-y-8">
      <Field label="Name" hint={`Call them anything. "${base.name}" is just where they started.`}>
        {(id) => (
          <input
            id={id}
            value={draft.name}
            maxLength={24}
            onChange={(e) => set({ name: e.target.value })}
            placeholder={base.name}
            className={inputClass}
            autoComplete="off"
          />
        )}
      </Field>

      <div>
        <p className="text-[14px] font-semibold text-ink">Personality</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <PersonalityOption
            selected={draft.personality === null}
            onClick={() => set({ personality: null })}
            label={`${base.name}'s own`}
            hint={base.persona.personality.split(",")[0]}
          />
          {(Object.keys(PERSONALITIES) as PersonalityId[]).map((p) => (
            <PersonalityOption
              key={p}
              selected={draft.personality === p}
              onClick={() => set({ personality: p })}
              label={PERSONALITIES[p].label}
              hint={PERSONALITIES[p].hint}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-[14px] font-semibold text-ink">Voice</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {VOICES.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={draft.voice === v.id}
              onClick={() => set({ voice: v.id })}
              className={cn(
                "flex min-h-11 flex-col items-start justify-center rounded-2xl px-3.5 py-2 text-left transition-all active:scale-[0.97]",
                draft.voice === v.id ? "bg-ink text-page" : "bg-ink/[0.06] text-ink hover:bg-ink/10",
              )}
            >
              <span className="text-[14px] font-semibold leading-tight">{v.id}</span>
              <span
                className={cn("text-[12px] leading-tight", draft.voice === v.id ? "text-page/70" : "text-ink-soft")}
              >
                {v.hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-semibold text-ink">Look</p>
          <button
            type="button"
            onClick={() =>
              setLook({
                skin: pick(SKINS),
                tile: pick(TILES),
                hair: pick(HAIRS),
                hairColor: pick(HAIR_COLORS),
                shirt: pick(SHIRTS),
                glasses: Math.random() < 0.3,
              })
            }
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium text-ink hover:bg-ink/[0.06]"
          >
            <Shuffle /> Shuffle
          </button>
        </div>
        <div className="mt-3 space-y-4">
          <Swatches label="Face" colors={SKINS} value={draft.look.skin} onPick={(skin) => setLook({ skin })} />
          <div>
            <p className="text-[13px] text-ink-soft">Hair</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {HAIRS.map((h) => (
                <button
                  key={h}
                  type="button"
                  aria-label={`Hair: ${h}`}
                  aria-pressed={draft.look.hair === h}
                  onClick={() => setLook({ hair: h })}
                  className={cn(
                    "size-12 overflow-hidden rounded-full ring-2 transition-transform active:scale-95",
                    draft.look.hair === h ? "ring-ink" : "ring-transparent hover:ring-line",
                  )}
                >
                  <AgentFace agent={{ ...base, face: { ...draft.look, hair: h } }} className="size-full" />
                </button>
              ))}
            </div>
          </div>
          <Swatches
            label="Hair colour"
            colors={HAIR_COLORS}
            value={draft.look.hairColor}
            onPick={(hairColor) => setLook({ hairColor })}
          />
          <Swatches label="Background" colors={TILES} value={draft.look.tile} onPick={(tile) => setLook({ tile })} />
          <Swatches label="Top" colors={SHIRTS} value={draft.look.shirt} onPick={(shirt) => setLook({ shirt })} />
          <button
            type="button"
            aria-pressed={draft.look.glasses}
            onClick={() => setLook({ glasses: !draft.look.glasses })}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition-colors",
              draft.look.glasses ? "bg-ink text-page" : "bg-ink/[0.06] text-ink hover:bg-ink/10",
            )}
          >
            <Eyeglasses weight="bold" /> Glasses
          </button>
        </div>
      </div>

      <Field
        label="Anything they should know?"
        hint="Your own rules for this agent. For example: “Call me boss”, “Mix in some Yoruba”, “Never mention the weather”."
      >
        {(id) => (
          <textarea
            id={id}
            value={draft.instructions}
            maxLength={1000}
            rows={3}
            onChange={(e) => set({ instructions: e.target.value })}
            className={cn(inputClass, "resize-none")}
          />
        )}
      </Field>
    </div>
  );
}

function PersonalityOption({
  selected,
  onClick,
  label,
  hint,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "rounded-2xl px-4 py-3 text-left transition-all active:scale-[0.98]",
        selected ? "bg-ink text-page" : "bg-ink/[0.06] text-ink hover:bg-ink/10",
      )}
    >
      <span className="block text-[15px] font-semibold">{label}</span>
      <span className={cn("block text-[13px] leading-snug", selected ? "text-page/70" : "text-ink-soft")}>{hint}</span>
    </button>
  );
}

function Swatches({
  label,
  colors,
  value,
  onPick,
}: {
  label: string;
  colors: string[];
  value: string;
  onPick: (c: string) => void;
}) {
  return (
    <div>
      <p className="text-[13px] text-ink-soft">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={value.toLowerCase() === c.toLowerCase()}
            aria-label={c}
            onClick={() => onPick(c)}
            className={cn(
              "size-10 rounded-full border border-black/10 ring-2 ring-offset-2 ring-offset-page transition-transform active:scale-90",
              value.toLowerCase() === c.toLowerCase() ? "ring-ink" : "ring-transparent",
            )}
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );
}
