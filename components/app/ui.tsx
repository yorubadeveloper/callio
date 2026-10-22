"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// Small building blocks shared by the app screens. Everything is sized for
// thumbs first (44px+ targets) and widens gracefully on desktop.

import { btn } from "./btn";

export { btn };

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-[28px] bg-plate p-5 ring-1 ring-line sm:p-6", className)}>{children}</section>;
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <h2 className="font-display text-[22px] leading-tight font-medium tracking-[-0.03em] text-ink">{children}</h2>
      {action}
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <header className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
      <div>
        <h1 className="font-display text-[clamp(2rem,6vw,2.75rem)] leading-[1.02] font-medium tracking-[-0.04em] text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-[15px] text-ink-soft sm:text-base">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: (id: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[14px] font-semibold text-ink">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-[13px] text-ink-soft">{hint}</p>}
      <div className="mt-2">{children(id)}</div>
    </div>
  );
}

export const inputClass =
  "w-full rounded-2xl bg-page px-4 py-3.5 text-[16px] text-ink ring-1 ring-line outline-none transition-shadow placeholder:text-ink-soft/70 focus:ring-2 focus:ring-ink";

export function Chip({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition-all duration-200 active:scale-[0.97]",
        selected ? "bg-ink text-page" : "bg-ink/[0.06] text-ink hover:bg-ink/10",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full bg-ink/[0.06] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "relative flex-1 rounded-full px-3 py-2.5 text-[14px] font-medium transition-colors",
            value === o.value ? "text-page" : "text-ink-soft hover:text-ink",
          )}
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${id}`}
              className="absolute inset-0 rounded-full bg-ink"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Bottom sheet on phones, centred dialog on larger screens. Closes on Escape and backdrop tap. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className={cn(
              "max-h-[90dvh] w-full overflow-y-auto rounded-t-[32px] bg-plate px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-3 text-ink outline-none sm:rounded-[32px] sm:px-7 sm:pb-7 sm:pt-6",
              wide ? "sm:max-w-2xl" : "sm:max-w-md",
            )}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line sm:hidden" />
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-display text-[24px] leading-tight font-medium tracking-[-0.03em]">{title}</h2>
              <button type="button" onClick={onClose} aria-label="Close" className={btn.icon}>
                <X />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** An on/off switch with its label. The whole row is the target. */
export function Switch({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 w-full items-center justify-between gap-4 text-left disabled:opacity-50"
    >
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-[13px] leading-snug text-ink-soft">{hint}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-teal" : "bg-ink/15",
        )}
      >
        <motion.span
          className="absolute top-1 left-1 size-5 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.25)]"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 34 }}
        />
      </span>
    </button>
  );
}
