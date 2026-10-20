"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarBlank, CheckCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { btn } from "./ui";
import { Spinner } from "@/components/brand/logo-loader";

const RESULT: Record<string, { tone: "good" | "bad"; text: string }> = {
  connected: { tone: "good", text: "Google Calendar connected. Your agents can see and update your schedule now." },
  missing_scope: {
    tone: "bad",
    text: "Calendar access wasn't granted. Try again and leave the calendar box ticked on Google's screen.",
  },
  error: { tone: "bad", text: "Couldn't connect Google Calendar. Try again in a moment." },
  cancelled: { tone: "bad", text: "No problem. You can connect your calendar whenever you like." },
};

/** Optional data sources, connected separately from sign-in and removable any time. */
export function Connections({ user, result }: { user: User; result?: string }) {
  const router = useRouter();
  const calendar = user.integrations?.google_calendar;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const message = result ? RESULT[result] : undefined;

  const connect = async () => {
    setBusy(true);
    setError(null);
    try {
      const { url } = await api<{ url: string }>("/integrations/google-calendar/start", {
        method: "POST",
        body: { return_to: "/app/you" },
      });
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start connecting. Try again.");
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    setError(null);
    try {
      await api("/integrations/google-calendar", { method: "DELETE" });
      router.replace("/app/you");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't disconnect. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="connections">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">Connections</h2>
      {message && (
        <p
          role="status"
          className={cn(
            "mt-3 rounded-2xl px-4 py-3 text-[14px]",
            message.tone === "good" ? "bg-teal/15" : "bg-coral/15",
          )}
        >
          {message.text}
        </p>
      )}
      <div className="mt-3 rounded-[24px] bg-plate p-5 ring-1 ring-line">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-peri/30 text-[22px]">
            <CalendarBlank weight="fill" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold">Google Calendar</p>
            {calendar?.connected ? (
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-[14px] text-ink-soft">
                <CheckCircle weight="fill" className="shrink-0 text-teal" /> {calendar.account_email ?? "Connected"}
              </p>
            ) : calendar?.needs_reconnect ? (
              <p className="mt-0.5 text-[14px] text-ink-soft">
                Google stopped our access to {calendar.account_email ?? "your calendar"}. Connect again to keep your
                briefings going.
              </p>
            ) : (
              <p className="mt-0.5 text-[14px] text-ink-soft">
                So agents can brief you on your day and add or move meetings when you ask.
              </p>
            )}
          </div>
        </div>
        {error && <p className="mt-3 text-[14px] text-[#B0412C] dark:text-coral">{error}</p>}
        <button
          type="button"
          disabled={busy}
          onClick={calendar?.connected ? disconnect : connect}
          className={cn(calendar?.connected ? btn.soft : btn.primary, "mt-4 h-11 w-full")}
        >
          {busy && <Spinner />}
          {calendar?.connected
            ? "Disconnect"
            : calendar?.needs_reconnect
              ? "Reconnect Google Calendar"
              : "Connect Google Calendar"}
        </button>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">
          Agents only look at your calendar when you ask about your schedule or before a briefing you&apos;ve set up.
          Disconnecting deletes our access straight away.
        </p>
      </div>
    </section>
  );
}
