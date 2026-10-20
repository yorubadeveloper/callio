"use client";

import { useSyncExternalStore } from "react";
import { Pause, SpeakerHigh } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { VOICES, voiceSample } from "@/lib/agents/voices";

// One shared player, so tapping another voice stops the last one. Samples are recorded with the same Live
// model the calls use (scripts/generate-voice-samples.ts), so they sound like the real thing.

let audio: HTMLAudioElement | null = null;
let playing: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function player() {
  if (!audio) {
    audio = new Audio();
    audio.preload = "auto";
    const stop = () => {
      playing = null;
      emit();
    };
    audio.addEventListener("ended", stop);
    audio.addEventListener("pause", stop);
    audio.addEventListener("error", stop);
  }
  return audio;
}

export function playVoice(id: string) {
  const a = player();
  if (playing === id) {
    a.pause();
    return;
  }
  a.src = voiceSample(id);
  a.currentTime = 0;
  playing = id;
  emit();
  a.play().catch(() => {
    playing = null;
    emit();
  });
}

export function stopVoice() {
  audio?.pause();
}

export function usePlayingVoice() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => playing,
    () => null,
  );
}

/** Three bars that bounce while a sample plays. */
export function Bars({ active, className }: { active: boolean; className?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex h-3.5 items-end gap-[2px]", className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-full bg-current",
            active ? "animate-[voice-bar_0.9s_ease-in-out_infinite]" : "h-1",
          )}
          style={active ? { animationDelay: `${i * 0.15}s` } : undefined}
        />
      ))}
    </span>
  );
}

/** Pick a voice; every tap plays its sample so you hear it before you choose. */
export function VoicePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const now = usePlayingVoice();
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {VOICES.map((v) => {
        const selected = value === v.id;
        const isPlaying = now === v.id;
        return (
          <button
            key={v.id}
            type="button"
            aria-pressed={selected}
            aria-label={`${v.id}, ${v.hint}, ${v.pitch} voice. Plays a sample.`}
            onClick={() => {
              onChange(v.id);
              playVoice(v.id);
            }}
            className={cn(
              "group flex min-h-14 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-all active:scale-[0.97]",
              selected ? "bg-ink text-page" : "bg-ink/[0.06] text-ink hover:bg-ink/10",
            )}
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full transition-colors",
                selected ? "bg-page/15" : v.pitch === "deeper" ? "bg-peri/30" : "bg-coral/25",
              )}
            >
              {isPlaying ? <Bars active /> : <SpeakerHigh weight="fill" className="size-4" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-semibold leading-tight">{v.id}</span>
              <span className={cn("block text-[12px] leading-tight", selected ? "text-page/70" : "text-ink-soft")}>
                {v.hint} · {v.pitch}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** "Hear Laura": plays an agent's voice sample. */
export function HearVoice({ voice, name, className }: { voice: string; name: string; className?: string }) {
  const isPlaying = usePlayingVoice() === voice;
  return (
    <button
      type="button"
      onClick={() => playVoice(voice)}
      aria-label={isPlaying ? `Stop ${name}'s voice` : `Hear ${name}'s voice`}
      className={cn(
        "relative inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink/[0.06] px-4 text-[14px] font-semibold text-ink transition-colors hover:bg-ink/10",
        className,
      )}
    >
      {isPlaying ? <Pause weight="fill" /> : <SpeakerHigh weight="fill" />}
      {isPlaying ? "Playing" : "Hear voice"}
    </button>
  );
}
