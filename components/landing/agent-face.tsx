import { cn } from "@/lib/utils";
import type { Agent, HairStyle } from "./agents";

const INK = "#121212";

function Hair({ style, color }: { style: HairStyle; color: string }) {
  switch (style) {
    case "bob":
      return (
        <path
          fill={color}
          d="M27 52C24 30 36 18 50 18S76 30 73 52L73 60C69 60 68 55 68 49C68 39 61 31 50 31S32 39 32 49C32 55 31 60 27 60Z"
        />
      );
    case "bun":
      return (
        <g fill={color}>
          <circle cx="50" cy="15" r="8" />
          <path d="M29 43C29 28 38 21 50 21S71 28 71 43C66 35 58 31 50 31S34 35 29 43Z" />
        </g>
      );
    case "curls":
      return (
        <g fill={color}>
          {[
            [31, 34], [35, 25], [43, 20], [52, 18], [61, 21], [67, 28], [70, 37],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="8" />
          ))}
        </g>
      );
    case "flat":
      return <path fill={color} d="M28 38V25C28 21 30 19 34 19H66C70 19 72 21 72 25V38C66 32 34 32 28 38Z" />;
    case "puffs":
      return (
        <g fill={color}>
          <circle cx="29" cy="24" r="11" />
          <circle cx="71" cy="24" r="11" />
          <path d="M29 42C29 28 38 22 50 22S71 28 71 42C65 34 58 31 50 31S35 34 29 42Z" />
        </g>
      );
    case "swoop":
      return <path fill={color} d="M28 45C25 27 39 18 54 20C66 22 75 30 72 45C64 34 50 30 40 38C36 41 31 44 28 45Z" />;
    case "none":
      return null;
  }
}

interface AgentFaceProps {
  agent: Agent;
  className?: string;
}

/** A headset-wearing agent portrait. Square; round it with the container. */
export function AgentFace({ agent, className }: AgentFaceProps) {
  const { tile, skin, hair, hairColor, shirt, glasses } = agent.face;
  return (
    <svg viewBox="0 0 100 100" className={cn("block", className)} role="img" aria-label={agent.name}>
      <rect width="100" height="100" fill={tile} />
      <path fill={shirt} d="M12 100C14 81 31 72 50 72S86 81 88 100Z" />
      <rect x="43" y="62" width="14" height="13" rx="4" fill={skin} />
      <ellipse cx="50" cy="47" rx="21" ry="24" fill={skin} />
      <Hair style={hair} color={hairColor} />
      <g className="agent-eyes">
        <circle cx="42" cy="47" r="5.5" fill="#FFFFFF" />
        <circle cx="58" cy="47" r="5.5" fill="#FFFFFF" />
        <circle cx="43.2" cy="47.6" r="2.6" fill={INK} />
        <circle cx="59.2" cy="47.6" r="2.6" fill={INK} />
      </g>
      {glasses && (
        <g fill="none" stroke={INK} strokeWidth="2">
          <circle cx="42" cy="47" r="7.6" />
          <circle cx="58" cy="47" r="7.6" />
          <path d="M49.6 46.5h0.8" strokeLinecap="round" />
        </g>
      )}
      <path d="M44.5 58Q50 62.5 55.5 58" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      {/* headset */}
      <path d="M26.5 46C26.5 20 73.5 20 73.5 46" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
      <rect x="21.5" y="40" width="9" height="15" rx="4.5" fill={INK} />
      <path d="M26 55C26.5 63 33 66.5 41 65" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="42.5" cy="64.8" r="2.8" fill={INK} />
    </svg>
  );
}
