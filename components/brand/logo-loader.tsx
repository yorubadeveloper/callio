import { cn } from "@/lib/utils";
import { LOGO_BLOBS } from "./logo-paths";

/**
 * The Callio mark as a loading indicator: the four blobs breathe in turn while
 * the C slowly turns, like the dial spinning. Sized by font-size by default, so
 * it drops into buttons in place of a spinner.
 */
export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={label} className={cn("logo-loading size-[1.1em] shrink-0", className)}>
      {LOGO_BLOBS.map((b) => (
        <path key={b.name} d={b.d} fill={b.fill} />
      ))}
    </svg>
  );
}

/** Full-area loader for pages and panels. Fades in after a beat so fast loads never flash it. */
export function LogoLoader({
  label = "Loading",
  className,
  tone = "page",
}: {
  label?: string;
  className?: string;
  tone?: "page" | "dark";
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "loader-fade-in flex flex-col items-center justify-center gap-4",
        tone === "dark" ? "text-white/50" : "text-ink-soft",
        className,
      )}
    >
      <Spinner className="size-14" label={label} />
      <span className="text-[13px] font-medium tracking-wide">{label}…</span>
    </div>
  );
}
