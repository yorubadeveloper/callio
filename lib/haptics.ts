// Small buzzes for moments that matter. Android vibrates (navigator.vibrate). iPhones have no vibration API for the
// web, but Safari 18+ ticks when a switch is toggled, so we toggle a hidden one. That tick only reliably fires inside
// a tap; outside one it's silently skipped.

export type Haptic = "tap" | "success" | "warning" | "end" | "nudge";

const PATTERNS: Record<Haptic, number | number[]> = {
  tap: 8,
  nudge: 12,
  success: [14, 70, 18],
  warning: [30, 60, 30],
  end: 40,
};

export function haptic(kind: Haptic = "tap") {
  if (typeof window === "undefined") return;
  if (typeof navigator.vibrate === "function") {
    // Chrome refuses (and warns) before the person has touched the page.
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    navigator.vibrate(PATTERNS[kind]);
    return;
  }
  iosTick();
  if (kind === "success" || kind === "warning") setTimeout(iosTick, 90);
}

function iosTick() {
  try {
    const label = document.createElement("label");
    label.ariaHidden = "true";
    label.style.display = "none";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    label.appendChild(input);
    document.head.appendChild(label);
    label.click();
    label.remove();
  } catch {}
}
