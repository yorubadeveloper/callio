"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { CaretDown, Check, MagnifyingGlass, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { btn, inputClass } from "./ui";

// Custom dropdowns for the app. On larger screens the list opens as a popover under the field; on phones it
// slides up as a sheet with big rows, like a native picker. Full keyboard support either way.

export interface MenuOption {
  value: string;
  label: string;
  description?: string;
  /** Right-aligned detail, such as a local time. */
  trailing?: string;
  /** Extra words that search should match. */
  keywords?: string;
}

const PHONE = "(max-width: 639px)";
const noop = () => () => {};

export function useIsPhone() {
  return useSyncExternalStore(
    (cb) => {
      const query = window.matchMedia(PHONE);
      query.addEventListener("change", cb);
      return () => query.removeEventListener("change", cb);
    },
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
}

/** False on the server and during hydration, true after. For values that depend on the visitor's clock or locale. */
export function useMounted() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/** Fixed-position style for a popover under (or above, when there's no room) an anchor element. */
export function anchorStyle(rect: DOMRect, minWidth = 288, maxHeight = 360): React.CSSProperties {
  const gap = 6;
  const width = Math.min(Math.max(rect.width, minWidth), window.innerWidth - 24);
  const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
  const below = window.innerHeight - rect.bottom - gap - 12;
  const above = rect.top - gap - 12;
  if (below < Math.min(maxHeight, 240) && above > below) {
    return {
      left,
      width,
      bottom: window.innerHeight - rect.top + gap,
      maxHeight: Math.min(maxHeight, above),
      transformOrigin: "bottom",
    };
  }
  return { left, width, top: rect.bottom + gap, maxHeight: Math.min(maxHeight, below), transformOrigin: "top" };
}

/**
 * Keeps a popover glued to its anchor while the page scrolls or resizes, and closes it on outside presses.
 * Call `measure()` when opening.
 */
export function usePopover(
  open: boolean,
  anchor: React.RefObject<HTMLElement | null>,
  panel: React.RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const latestClose = useRef(onClose);
  useEffect(() => {
    latestClose.current = onClose;
  });
  useEffect(() => {
    if (!open) return;
    const update = () => anchor.current && setRect(anchor.current.getBoundingClientRect());
    const outside = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!anchor.current?.contains(target) && !panel.current?.contains(target)) latestClose.current();
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open, anchor, panel]);
  const measure = () => anchor.current && setRect(anchor.current.getBoundingClientRect());
  return { rect, measure };
}

function OptionRow({
  option,
  index,
  id,
  active,
  selected,
  roomy,
  onPick,
  onHover,
}: {
  option: MenuOption;
  index: number;
  id: string;
  active: boolean;
  selected: boolean;
  roomy: boolean;
  onPick: () => void;
  onHover: () => void;
}) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={selected}
      data-index={index}
      onClick={onPick}
      onPointerMove={onHover}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-2xl px-3 text-left transition-colors",
        roomy ? "min-h-14 py-2.5" : "min-h-11 py-2",
        active && "bg-ink/[0.06]",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-[15px] text-ink", selected ? "font-semibold" : "font-medium")}>
          {option.label}
        </div>
        {option.description && <div className="truncate text-[13px] text-ink-soft">{option.description}</div>}
      </div>
      {option.trailing && <span className="shrink-0 text-[13px] text-ink-soft tabular-nums">{option.trailing}</span>}
      <Check
        weight="bold"
        aria-hidden
        className={cn("size-4 shrink-0 text-ink transition-opacity", selected ? "opacity-100" : "opacity-0")}
      />
    </div>
  );
}

export function SelectMenu({
  id,
  value,
  options,
  onChange,
  label,
  placeholder = "Choose",
  searchable = false,
  searchPlaceholder = "Search",
  renderValue,
  className,
}: {
  id?: string;
  value: string;
  options: MenuOption[];
  onChange: (value: string) => void;
  /** Accessible name, and the sheet title on phones. */
  label: string;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  renderValue?: (option: MenuOption | undefined) => React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const phone = useIsPhone();
  const baseId = useId();
  const listId = `${baseId}-list`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;
  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return options;
    return options.filter((o) => {
      const hay = `${o.label} ${o.description ?? ""} ${o.keywords ?? ""}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [options, query]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };
  const { rect, measure } = usePopover(open && !phone, trigger, panel, () => close(false));

  const openMenu = () => {
    measure();
    setQuery("");
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.value === value),
      ),
    );
    setOpen(true);
  };

  const choose = (option: MenuOption | undefined) => {
    if (!option) return;
    onChange(option.value);
    close();
  };

  // Focus the search (desktop) or the list (phones, so the keyboard doesn't jump up), and show the current choice.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      (phone || !search.current ? list.current : search.current)?.focus({ preventScroll: true });
      list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "center" });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, phone]);

  useEffect(() => {
    if (open) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  useEffect(() => {
    if (!open || !phone) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open, phone]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = filtered.length - 1;
    if (e.key === "ArrowDown") setActive((a) => Math.min(last, a + 1));
    else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(last);
    else if (e.key === "PageDown") setActive((a) => Math.min(last, a + 8));
    else if (e.key === "PageUp") setActive((a) => Math.max(0, a - 8));
    else if (e.key === "Enter") choose(filtered[active]);
    else if (e.key === "Escape") close();
    else if (e.key === "Tab") return close(false);
    else return;
    e.preventDefault();
    e.stopPropagation();
  };

  const searchBox = searchable && (
    <label className="flex h-11 items-center gap-2 rounded-full bg-ink/[0.05] px-4 text-ink-soft focus-within:ring-2 focus-within:ring-ink">
      <MagnifyingGlass aria-hidden className="size-4 shrink-0" />
      <input
        ref={search}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        aria-controls={listId}
        aria-activedescendant={filtered.length ? optionId(active) : undefined}
        className="h-full w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-soft/70"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
    </label>
  );

  const rows = (
    <div
      ref={list}
      id={listId}
      role="listbox"
      aria-label={label}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      aria-activedescendant={filtered.length ? optionId(active) : undefined}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 outline-none"
    >
      {filtered.map((o, i) => (
        <OptionRow
          key={o.value}
          option={o}
          index={i}
          id={optionId(i)}
          active={i === active}
          selected={o.value === value}
          roomy={phone}
          onPick={() => choose(o)}
          onHover={() => setActive(i)}
        />
      ))}
      {!filtered.length && <p className="px-3 py-6 text-center text-[14px] text-ink-soft">Nothing matches that.</p>}
    </div>
  );

  return (
    <>
      <button
        ref={trigger}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={label}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            openMenu();
          }
        }}
        className={cn(inputClass, "flex items-center gap-2 text-left", open && "ring-2 ring-ink", className)}
      >
        <span className="min-w-0 flex-1 truncate">
          {renderValue
            ? renderValue(selected)
            : (selected?.label ?? <span className="text-ink-soft/70">{placeholder}</span>)}
        </span>
        <CaretDown
          weight="bold"
          aria-hidden
          className={cn("size-4 shrink-0 text-ink-soft transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && phone && (
              <motion.div
                key="sheet"
                className="fixed inset-0 z-[70] flex items-end bg-black/40 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => close()}
              >
                <motion.div
                  ref={panel}
                  role="dialog"
                  aria-modal="true"
                  aria-label={label}
                  onClick={(e) => e.stopPropagation()}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 380, damping: 36 }}
                  className="flex max-h-[78dvh] w-full flex-col rounded-t-[30px] bg-plate pb-[max(env(safe-area-inset-bottom),0.75rem)] text-ink shadow-[0_-20px_60px_-20px_rgb(0_0_0/0.35)]"
                >
                  <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line" />
                  <div className="flex items-center justify-between gap-4 px-5 pt-2 pb-3">
                    <h2 className="font-display text-[22px] leading-tight font-medium tracking-[-0.03em]">{label}</h2>
                    <button type="button" onClick={() => close()} aria-label="Close" className={btn.icon}>
                      <X />
                    </button>
                  </div>
                  {searchBox && <div className="px-4 pb-2">{searchBox}</div>}
                  {rows}
                </motion.div>
              </motion.div>
            )}
            {open && !phone && rect && (
              <motion.div
                key="popover"
                ref={panel}
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
                transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
                style={anchorStyle(rect)}
                className="fixed z-[70] flex flex-col overflow-hidden rounded-[22px] bg-plate text-ink shadow-[0_24px_60px_-18px_rgb(0_0_0/0.35)] ring-1 ring-line"
              >
                {searchBox && <div className="p-2 pb-1">{searchBox}</div>}
                {rows}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

// ---------- timezones ----------

function zoneLabel(zone: string) {
  const parts = zone.split("/");
  return {
    label: parts.at(-1)!.replaceAll("_", " "),
    description: parts.length > 1 ? parts.slice(0, -1).join(" · ").replaceAll("_", " ") : "Coordinated Universal Time",
  };
}

function zoneOffset(zone: string, now: Date) {
  try {
    const name = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset" })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value;
    return (name ?? "GMT").replace("GMT", "UTC");
  } catch {
    return "";
  }
}

export function localTime(zone: string, now = new Date()) {
  try {
    return now.toLocaleTimeString(undefined, { timeZone: zone, hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function timezoneOptions(current: string): MenuOption[] {
  let zones: string[];
  try {
    zones = Intl.supportedValuesOf("timeZone");
  } catch {
    zones = [];
  }
  if (!zones.includes("UTC")) zones = [...zones, "UTC"];
  if (current && !zones.includes(current)) zones = [current, ...zones];
  const now = new Date();
  return zones.map((zone) => {
    const offset = zoneOffset(zone, now);
    return {
      value: zone,
      ...zoneLabel(zone),
      trailing: `${localTime(zone, now)} · ${offset}`,
      keywords: `${zone} ${offset}`,
    };
  });
}

export function TimezoneSelect({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (zone: string) => void;
}) {
  // Times and offsets depend on the visitor's clock and locale, so they're only computed in the browser.
  const mounted = useMounted();
  const options = useMemo(
    () => (mounted ? timezoneOptions(value) : [{ value, ...zoneLabel(value) }]),
    [mounted, value],
  );
  return (
    <SelectMenu
      id={id}
      value={value}
      options={options}
      onChange={onChange}
      label="Time zone"
      searchable
      searchPlaceholder="Search a city or region"
      renderValue={(o) => (
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate">{o?.label ?? value}</span>
          {o?.trailing && (
            <span className="shrink-0 truncate text-[14px] text-ink-soft tabular-nums">{o.trailing}</span>
          )}
        </span>
      )}
    />
  );
}
