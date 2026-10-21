"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarBlank,
  CheckCircle,
  EnvelopeSimple,
  MicrosoftOutlookLogo,
  NotionLogo,
  SpotifyLogo,
  WhatsappLogo,
  CheckSquare,
  type Icon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import type { PersonalAgent } from "@/lib/agents/personalize";
import type { Connector, MorningCall, User } from "@/lib/types";
import { MorningCallCard } from "./morning-call";
import { Sources } from "./sources";
import { btn, PageTitle } from "./ui";
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

const SOON: { name: string; what: string; icon: Icon; tint: string }[] = [
  {
    name: "Gmail",
    what: "Hear what's important in your inbox, and send quick replies.",
    icon: EnvelopeSimple,
    tint: "bg-coral/25",
  },
  {
    name: "Outlook Calendar",
    what: "Your work calendar, for briefings and moving meetings.",
    icon: MicrosoftOutlookLogo,
    tint: "bg-peri/30",
  },
  {
    name: "WhatsApp",
    what: "Call your agent from WhatsApp, anywhere in the world.",
    icon: WhatsappLogo,
    tint: "bg-teal/25",
  },
  { name: "Notion", what: "Read and add to your notes and to-do lists.", icon: NotionLogo, tint: "bg-ink/[0.08]" },
  { name: "Todoist", what: "Add tasks by voice and hear what's due.", icon: CheckSquare, tint: "bg-coral/20" },
  { name: "Spotify", what: "Play something to match your mood after a call.", icon: SpotifyLogo, tint: "bg-teal/20" },
];

/** Apps and data sources agents can use. Each connects separately from sign-in and can be removed any time. */
export function ConnectionsView({
  user,
  result,
  connectors,
  morning,
  agents,
}: {
  user: User;
  result?: string;
  connectors: Connector[];
  morning: MorningCall;
  agents: PersonalAgent[];
}) {
  return (
    <>
      <PageTitle
        title="Connections"
        subtitle="What your agents can see and use. Everything is read-only unless you switch it on, and you can remove it any time."
      />
      <MorningCallCard morning={morning} agents={agents} connectors={connectors} user={user} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Sources connectors={connectors} timezone={user.timezone} locale={user.locale} />
        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">Apps</h2>
          <div className="mt-3">
            <GoogleCalendar user={user} result={result} />
          </div>
        </section>
      </div>
      <div className="mt-10">
        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">Coming soon</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {SOON.map((app) => (
              <li key={app.name} className="flex items-start gap-3 rounded-[22px] bg-plate p-4 ring-1 ring-line">
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-2xl text-[20px]", app.tint)}>
                  <app.icon weight="fill" />
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold">{app.name}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{app.what}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[13px] text-ink-soft">
            Anything with an MCP server can be added as a custom connector. Want something else?{" "}
            <a
              href="mailto:hello@callio.site?subject=Connection%20request"
              className="font-semibold text-ink underline-offset-4 hover:underline"
            >
              Tell us
            </a>
            .
          </p>
        </section>
      </div>
    </>
  );
}

function GoogleCalendar({ user, result }: { user: User; result?: string }) {
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
        body: { return_to: "/app/connections" },
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
      router.replace("/app/connections");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't disconnect. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="google-calendar">
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
      <div className={cn("rounded-[24px] bg-plate p-5 ring-1 ring-line", message && "mt-3")}>
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
    </div>
  );
}
