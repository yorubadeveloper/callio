import { cn } from "@/lib/utils";

const DELAYS = [0, 0.25, 0.1, 0.35, 0.18];

/** Five bouncing audio-level bars. */
export function LevelBars({ color, className }: { color: string; className?: string }) {
  return (
    <span className={cn("flex h-4 items-center gap-[3px]", className)} aria-hidden>
      {DELAYS.map((d, i) => (
        <span
          key={i}
          className="level-bar h-full w-[3px] rounded-full"
          style={{ background: color, animationDelay: `${d}s` }}
        />
      ))}
    </span>
  );
}
