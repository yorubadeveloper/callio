"use client";

import { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/brand/logo-loader";

/**
 * Put inside a <Link>: shows right away that the tap registered while the next page loads.
 * The short delay keeps fast (prefetched) navigations from flashing it.
 */
export function LinkPending({ className, veil = true }: { className?: string; veil?: boolean }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 grid place-items-center rounded-[inherit] opacity-0 transition-opacity duration-200",
        veil && "bg-plate/55 backdrop-blur-[1px]",
        pending && "opacity-100 delay-100",
        className,
      )}
    >
      {pending && <Spinner className="size-6" />}
    </span>
  );
}
