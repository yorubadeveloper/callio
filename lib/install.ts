// Installing Callio as an app: which phone/browser this is, whether it's already installed, and the
// browser's own install prompt (Chrome/Edge/Samsung on Android and desktop; Safari has none).

export type Platform = "ios" | "android" | "desktop";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function detectPlatform(): { platform: Platform; safari: boolean; standalone: boolean } {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  return {
    platform: ios ? "ios" : android ? "android" : "desktop",
    safari: ios && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua),
    standalone:
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  };
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let captured = false;

/** Call once, early: keeps the browser's install prompt so our own button can show it later. */
export function captureInstallPrompt() {
  if (captured || typeof window === "undefined") return;
  captured = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit();
  });
}

export const installPromptStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  available: () => deferred !== null,
};

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferred) return "unavailable";
  const event = deferred;
  deferred = null;
  emit();
  await event.prompt();
  return (await event.userChoice).outcome;
}
