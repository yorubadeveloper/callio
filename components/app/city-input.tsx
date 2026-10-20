"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { MapPin } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { anchorStyle, localTime, usePopover } from "./select-menu";
import { inputClass } from "./ui";

export interface Place {
  id: number;
  name: string;
  region: string | null;
  country: string | null;
  timezone: string;
}

/** City field with suggestions. Picking one also hands back its time zone. */
export function CityInput({
  id,
  value,
  onChange,
  onPick,
  placeholder = "City",
}: {
  id?: string;
  value: string;
  onChange: (city: string) => void;
  onPick: (place: Place) => void;
  placeholder?: string;
}) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const request = useRef<AbortController | null>(null);
  const listId = `${useId()}-places`;
  const { rect, measure } = usePopover(open && places.length > 0, input, panel, () => setOpen(false));

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      request.current?.abort();
    },
    [],
  );

  const lookup = (text: string) => {
    if (timer.current) clearTimeout(timer.current);
    request.current?.abort();
    if (text.trim().length < 2) {
      setPlaces([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const controller = new AbortController();
      request.current = controller;
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(text.trim())}`, { signal: controller.signal });
        const found = res.ok ? ((await res.json()) as Place[]) : [];
        measure();
        setPlaces(found);
        setActive(0);
        setOpen(document.activeElement === input.current);
      } catch {
        // aborted or offline: keep whatever the person typed
      }
    }, 220);
  };

  const pick = (place: Place | undefined) => {
    if (!place) return;
    onPick(place);
    setOpen(false);
    setPlaces([]);
  };

  const showing = open && places.length > 0;

  return (
    <>
      <input
        ref={input}
        id={id}
        value={value}
        maxLength={80}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showing}
        aria-controls={showing ? listId : undefined}
        aria-activedescendant={showing ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          lookup(e.target.value);
        }}
        onFocus={() => places.length && (measure(), setOpen(true))}
        onKeyDown={(e) => {
          if (!showing) return;
          if (e.key === "ArrowDown") setActive((a) => Math.min(places.length - 1, a + 1));
          else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
          else if (e.key === "Enter") pick(places[active]);
          else if (e.key === "Escape") setOpen(false);
          else return;
          e.preventDefault();
        }}
        className={inputClass}
      />
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showing && rect && (
              <motion.div
                ref={panel}
                id={listId}
                role="listbox"
                aria-label="Places"
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
                transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
                style={anchorStyle(rect, 300, 320)}
                // Keep focus in the input while tapping a suggestion.
                onPointerDown={(e) => e.preventDefault()}
                className="fixed z-[70] overflow-y-auto overscroll-contain rounded-[22px] bg-plate p-1.5 text-ink shadow-[0_24px_60px_-18px_rgb(0_0_0/0.35)] ring-1 ring-line"
              >
                {places.map((p, i) => (
                  <div
                    key={p.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onClick={() => pick(p)}
                    onPointerMove={() => setActive(i)}
                    className={cn(
                      "flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 transition-colors",
                      i === active && "bg-ink/[0.06]",
                    )}
                  >
                    <MapPin aria-hidden weight="fill" className="size-4 shrink-0 text-coral" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-medium">{p.name}</div>
                      <div className="truncate text-[13px] text-ink-soft">
                        {[p.region, p.country].filter(Boolean).join(", ")}
                      </div>
                    </div>
                    <span className="shrink-0 text-[13px] text-ink-soft tabular-nums">{localTime(p.timezone)}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
