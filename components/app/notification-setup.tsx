"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AndroidLogo,
  AppleLogo,
  BellRinging,
  CheckCircle,
  DesktopTower,
  DotsThreeVertical,
  Export,
  Phone,
  PlusSquare,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { detectPlatform, installPromptStore, promptInstall, type Platform } from "@/lib/install";
import { disablePush, enablePush, pushEnabled, pushSupported } from "@/lib/push";
import { btn, Segmented, Sheet } from "./ui";
import { Spinner } from "@/components/brand/logo-loader";

type PushState = "checking" | "on" | "off" | "denied" | "install" | "unsupported";

const noop = () => () => {};

function useEnvironment() {
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const canPrompt = useSyncExternalStore(installPromptStore.subscribe, installPromptStore.available, () => false);
  const env = mounted ? detectPlatform() : null;
  return { mounted, env, canPrompt };
}

/**
 * Everything needed for agents to ring you: install (where the phone requires it), turn notifications on,
 * and send yourself a test. Used on Upcoming and You.
 */
export function NotificationSetup({ compact = false }: { compact?: boolean }) {
  const { mounted, env } = useEnvironment();
  const [state, setState] = useState<PushState>("checking");
  const [busy, setBusy] = useState<"toggle" | "test" | "call" | null>(null);
  const [result, setResult] = useState<{ tone: "good" | "bad"; text: string } | null>(null);
  const [guide, setGuide] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    let alive = true;
    const check = async (): Promise<PushState> => {
      const { platform, standalone } = detectPlatform();
      // iPhone and iPad only allow web notifications for apps on the Home Screen.
      if (platform === "ios" && !standalone) return "install";
      if (!pushSupported()) return "unsupported";
      if (Notification.permission === "denied") return "denied";
      return (await pushEnabled()) ? "on" : "off";
    };
    void check().then((s) => alive && setState(s));
    return () => {
      alive = false;
    };
  }, [mounted]);

  const turnOn = async () => {
    setBusy("toggle");
    setResult(null);
    const outcome = await enablePush().catch(() => "unsupported" as const);
    setState(outcome === "granted" ? "on" : outcome === "denied" ? "denied" : "unsupported");
    if (outcome === "granted") setResult({ tone: "good", text: "Done. Send yourself a test to hear how it sounds." });
    setBusy(null);
  };

  const turnOff = async () => {
    setBusy("toggle");
    await disablePush().catch(() => undefined);
    setState("off");
    setResult(null);
    setBusy(null);
  };

  const test = async (kind: "notification" | "call") => {
    setBusy(kind === "call" ? "call" : "test");
    setResult(null);
    try {
      const r = await api<{ devices: number; sent: number }>("/push/test", { method: "POST", body: { kind } });
      setResult(
        r.sent > 0
          ? {
              tone: "good",
              text:
                kind === "call"
                  ? `Ringing ${r.sent === 1 ? "this device" : `${r.sent} devices`}. Lock your phone to see it like a real call.`
                  : `Sent to ${r.sent === 1 ? "this device" : `${r.sent} devices`}. It should pop up in a few seconds.`,
            }
          : {
              tone: "bad",
              text: "This device isn't registered for notifications any more. Turn them off and on again.",
            },
      );
    } catch (err) {
      setResult({
        tone: "bad",
        text:
          err instanceof ApiError && err.status === 503
            ? "Notifications aren't switched on on our side yet. We're on it."
            : err instanceof ApiError
              ? err.message
              : "Couldn't send a test. Check your connection.",
      });
    } finally {
      setBusy(null);
    }
  };

  if (!mounted || state === "checking") {
    return <div className="h-32 animate-pulse rounded-[28px] bg-ink/[0.05] motion-reduce:animate-none" />;
  }

  const on = state === "on";
  const platform = env?.platform ?? "desktop";

  return (
    <div className={cn("rounded-[28px] p-5", on ? "bg-plate ring-1 ring-line" : "bg-amber/25")}>
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-2xl text-[24px]",
            on ? "bg-teal/25" : "bg-amber text-[#0E0E10]",
          )}
        >
          {on ? <CheckCircle weight="fill" /> : <BellRinging weight="fill" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold">{on ? "Your agents can ring you" : "Let your agents ring you"}</p>
          <p className="mt-0.5 text-[14px] text-ink-soft">
            {state === "on"
              ? "Scheduled calls ring this device and reminders pop up, even when Callio is closed."
              : state === "install"
                ? "On iPhone, Callio needs to be on your Home Screen before it can ring you. It takes 20 seconds."
                : state === "denied"
                  ? platform === "ios"
                    ? "Notifications are off for Callio. Turn them on in Settings, Notifications, Callio."
                    : platform === "android"
                      ? "Notifications are blocked. Tap the icon left of the address (or Settings, Apps, Callio), allow notifications, then come back."
                      : "Notifications are blocked for this site. Click the icon left of the address, allow notifications, then reload."
                  : state === "unsupported"
                    ? "This browser can't show call notifications. Try Chrome, Edge or Safari, or install Callio as an app."
                    : "Turn on notifications so scheduled calls ring and reminders pop up, even when Callio is closed."}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {state === "off" && (
          <button type="button" onClick={turnOn} disabled={busy !== null} className={cn(btn.primary, "h-11")}>
            {busy === "toggle" && <Spinner />} Turn on notifications
          </button>
        )}
        {on && (
          <>
            <button
              type="button"
              onClick={() => test("notification")}
              disabled={busy !== null}
              className={cn(btn.primary, "h-11")}
            >
              {busy === "test" && <Spinner />} Send a test
            </button>
            <button
              type="button"
              onClick={() => test("call")}
              disabled={busy !== null}
              className={cn(btn.soft, "h-11")}
            >
              {busy === "call" ? <Spinner /> : <Phone weight="fill" />} Test a call
            </button>
          </>
        )}
        {(!env?.standalone || state === "install") && (
          <button
            type="button"
            onClick={() => setGuide(true)}
            className={cn(
              state === "install" ? btn.primary : btn.soft,
              "h-11",
              !on && state !== "install" && "bg-plate",
            )}
          >
            {state === "install" ? "Show me how" : "Install the app"}
          </button>
        )}
        {on && !compact && (
          <button
            type="button"
            onClick={turnOff}
            disabled={busy !== null}
            className="h-11 px-3 text-[14px] font-semibold text-ink-soft underline-offset-4 hover:text-ink hover:underline"
          >
            Turn off
          </button>
        )}
      </div>

      <AnimatePresence>
        {result && (
          <motion.p
            role="status"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              "mt-3 rounded-2xl px-4 py-3 text-[14px]",
              result.tone === "good" ? "bg-teal/15" : "bg-coral/15",
            )}
          >
            {result.text}
            {result.tone === "good" && busy === null && result.text.startsWith("Ringing") && (
              <span className="mt-1 block text-[12px] text-ink-soft">
                Answering starts a real call, 1 credit a minute.
              </span>
            )}
          </motion.p>
        )}
      </AnimatePresence>

      <Sheet open={guide} onClose={() => setGuide(false)} title="Install Callio">
        <InstallGuide detected={platform} />
      </Sheet>
    </div>
  );
}

// ---------- install guide ----------

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "ios", label: "iPhone" },
  { value: "android", label: "Android" },
  { value: "desktop", label: "Computer" },
];

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-semibold text-page">
        {n}
      </span>
      <div className="pt-0.5 text-[15px] leading-relaxed">{children}</div>
    </li>
  );
}

const Key = ({ children }: { children: React.ReactNode }) => (
  <span className="mx-0.5 inline-flex translate-y-[3px] items-center gap-1 rounded-lg bg-ink/[0.07] px-1.5 py-0.5 text-[13px] font-semibold">
    {children}
  </span>
);

/** Step-by-step install for the detected phone (switchable), with the browser's own install button when it has one. */
export function InstallGuide({ detected }: { detected: Platform }) {
  const [platform, setPlatform] = useState<Platform>(detected);
  const { env, canPrompt } = useEnvironment();
  const [installing, setInstalling] = useState(false);
  const here = env?.platform === platform;

  const install = async () => {
    setInstalling(true);
    await promptInstall();
    setInstalling(false);
  };

  if (env?.standalone) {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-teal/15 px-4 py-3 text-[15px]">
        <CheckCircle weight="fill" className="text-teal" /> Callio is installed. You&apos;re using the app right now.
      </p>
    );
  }

  return (
    <div>
      <Segmented<Platform> label="Device" value={platform} onChange={setPlatform} options={PLATFORMS} />
      <div className="mt-5 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-ink-soft">
        {platform === "ios" ? (
          <AppleLogo weight="fill" />
        ) : platform === "android" ? (
          <AndroidLogo weight="fill" />
        ) : (
          <DesktopTower weight="fill" />
        )}
        {here ? "Your device" : "Steps"}
      </div>

      {here && canPrompt && platform !== "ios" && (
        <button type="button" onClick={install} disabled={installing} className={cn(btn.primary, "mt-3 w-full")}>
          {installing && <Spinner />} Install Callio
        </button>
      )}

      <ol className="mt-4 space-y-4">
        {platform === "ios" && (
          <>
            {here && env && !env.safari && (
              <Step n={0}>
                Open <b>callio.site</b> in <b>Safari</b>. Other browsers on iPhone can&apos;t add apps that ring you.
              </Step>
            )}
            <Step n={1}>
              Tap{" "}
              <Key>
                <Export weight="bold" /> Share
              </Key>{" "}
              at the bottom of Safari (at the top on iPad).
            </Step>
            <Step n={2}>
              Scroll down and tap{" "}
              <Key>
                <PlusSquare weight="bold" /> Add to Home Screen
              </Key>
              , then <b>Add</b>.
            </Step>
            <Step n={3}>Open Callio from your Home Screen and sign in.</Step>
            <Step n={4}>
              Go to <b>Upcoming</b>, tap <b>Turn on notifications</b>, then <b>Allow</b>. Send yourself a test.
            </Step>
          </>
        )}
        {platform === "android" && (
          <>
            {!(here && canPrompt) && (
              <>
                <Step n={1}>
                  In Chrome, tap{" "}
                  <Key>
                    <DotsThreeVertical weight="bold" />
                  </Key>{" "}
                  at the top right.
                </Step>
                <Step n={2}>
                  Tap <b>Install app</b> (or <b>Add to Home screen</b>), then <b>Install</b>.
                </Step>
              </>
            )}
            <Step n={here && canPrompt ? 1 : 3}>Open Callio from your Home screen.</Step>
            <Step n={here && canPrompt ? 2 : 4}>
              Go to <b>Upcoming</b>, tap <b>Turn on notifications</b>, then <b>Allow</b>. Send yourself a test.
            </Step>
          </>
        )}
        {platform === "desktop" && (
          <>
            {!(here && canPrompt) && (
              <Step n={1}>
                In Chrome or Edge, click the install icon at the right end of the address bar, then <b>Install</b>.
                Safari on Mac: File, then <b>Add to Dock</b>.
              </Step>
            )}
            <Step n={here && canPrompt ? 1 : 2}>
              Installing is optional on a computer: you can also turn on notifications right here in the browser.
            </Step>
            <Step n={here && canPrompt ? 2 : 3}>
              Go to <b>Upcoming</b>, click <b>Turn on notifications</b>, then <b>Allow</b>. Send yourself a test.
            </Step>
          </>
        )}
      </ol>
      <p className="mt-5 text-[13px] text-ink-soft">
        You only do this once. Updates arrive by themselves, so you never need to reinstall.
      </p>
    </div>
  );
}

// ---------- home nudge ----------

const NUDGE_KEY = "callio-install-nudge-dismissed";

/** On phones in the browser (not installed yet): a small, dismissible "get the app" card. */
export function InstallNudge() {
  const { env } = useEnvironment();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem(NUDGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [open, setOpen] = useState(false);
  if (!env || env.standalone || env.platform === "desktop" || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(NUDGE_KEY, "1");
    } catch {}
  };

  return (
    <div className="flex items-center gap-3 rounded-[24px] bg-peri/25 p-4 lg:hidden">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-plate text-[22px]">
        {env.platform === "ios" ? <AppleLogo weight="fill" /> : <AndroidLogo weight="fill" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">Get the Callio app</p>
        <p className="text-[13px] text-ink-soft">So your agents can ring you. Takes 20 seconds.</p>
      </div>
      <button type="button" onClick={() => setOpen(true)} className={cn(btn.primary, "h-10 px-4 text-[14px]")}>
        Install
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Not now"
        className="-mr-1 text-[13px] font-semibold text-ink-soft"
      >
        Later
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Install Callio">
        <InstallGuide detected={env.platform} />
      </Sheet>
    </div>
  );
}
