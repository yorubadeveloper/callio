import { cn } from "@/lib/utils";
import { LOGO_BLOBS } from "./logo-paths";

interface LogoMarkProps {
  className?: string;
  /** Pulse the blobs in turn, like a voice level meter. */
  speaking?: boolean;
  title?: string;
}

export function LogoMark({ className, speaking = false, title }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("shrink-0", speaking && "logo-speaking", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {LOGO_BLOBS.map((blob) => (
        <path key={blob.name} d={blob.d} fill={blob.fill} />
      ))}
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="size-[1.35em]" />
      <span className="font-body font-bold tracking-[-0.02em]">Callio</span>
    </span>
  );
}
