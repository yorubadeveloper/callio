"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AgentFace } from "@/components/landing/agent-face";
import type { Agent } from "@/components/landing/agents";
import type { CallStatus, LevelSource } from "@/lib/call/types";

const RINGS = [1, 2, 3];

/**
 * The agent's portrait with rings that breathe with its voice. Levels are read
 * every frame and written to a CSS variable, so speech never re-renders React.
 */
export function AgentOrb({
  agent,
  levels,
  status,
  className,
}: {
  agent: Agent;
  levels: LevelSource;
  status: CallStatus;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let smooth = 0;
    let frame = requestAnimationFrame(function tick() {
      const target = levels.agent();
      // Fast attack, slow release, like a VU meter.
      smooth += (target - smooth) * (target > smooth ? 0.35 : 0.08);
      ref.current?.style.setProperty("--lvl", smooth.toFixed(3));
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [levels]);

  const ringing = status === "connecting";

  return (
    <div ref={ref} className={cn("relative aspect-square", className)} style={{ "--lvl": 0 } as React.CSSProperties}>
      {RINGS.map((r) =>
        ringing ? (
          <span
            key={r}
            className="absolute inset-0 rounded-full border-2"
            style={{
              borderColor: agent.face.skin,
              animation: `ring-out 1.8s cubic-bezier(0.2,0.6,0.3,1) ${r * 0.45}s infinite`,
            }}
          />
        ) : (
          <span
            key={r}
            className="absolute inset-0 rounded-full transition-opacity duration-500"
            style={{
              background: agent.face.skin,
              opacity: `calc(0.06 + var(--lvl) * ${0.3 / r})`,
              transform: `scale(calc(1 + ${0.1 * r} + var(--lvl) * ${0.22 * r}))`,
            }}
          />
        ),
      )}
      <span className="relative block size-full overflow-hidden rounded-full shadow-[0_20px_60px_-20px_rgb(0_0_0/0.6)] ring-4 ring-white/15">
        <AgentFace agent={agent} className="size-full" />
      </span>
    </div>
  );
}
