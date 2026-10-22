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
      <PageTitle title="Connections" subtitle="What your agents can see and use. Read-only unless you switch it on." />
      <MorningCallCard morning={morning} agents={agents} connectors={connectors} user={user} />
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Sources connectors={connectors} timezone={user.timezone} locale={user.locale} />
        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">Apps</h2>
          <div className="mt-3">
            <GoogleCalendar user={user} result={result} />
          </div>
        </section>
      </div>
      <div className="mt-8">
        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">Coming soon</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SOON.map((app) => (
              <li
                key={app.name}
                title={app.what}
                className="inline-flex items-center gap-2 rounded-full bg-plate py-1.5 pl-1.5 pr-3.5 text-[14px] font-medium ring-1 ring-line"
              >
                <span className={cn("grid size-7 place-items-center rounded-full text-[15px]", app.tint)}>
                  <app.icon weight="fill" />
                </span>
                {app.name}
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
      <div className={cn("rounded-[24px] bg-plate p-4 ring-1 ring-line", message && "mt-3")}>
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-peri/30 text-[20px]">
            <CalendarBlank weight="fill" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold">Google Calendar</p>
            {calendar?.connected ? (
              <p className="flex items-center gap-1.5 truncate text-[13px] text-ink-soft">
                <CheckCircle weight="fill" className="shrink-0 text-teal" /> {calendar.account_email ?? "Connected"}
              </p>
            ) : calendar?.needs_reconnect ? (
              <p className="text-[13px] text-ink-soft">Google stopped our access. Connect again.</p>
            ) : (
              <p className="text-[13px] text-ink-soft">Your day in briefings; move meetings by voice.</p>
            )}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={calendar?.connected ? disconnect : connect}
            className={cn(calendar?.connected ? btn.soft : btn.primary, "h-10 shrink-0 px-4 text-[14px]")}
          >
            {busy && <Spinner />}
            {calendar?.connected ? "Disconnect" : calendar?.needs_reconnect ? "Reconnect" : "Connect"}
          </button>
        </div>
        {error && <p className="mt-3 text-[14px] text-[#B0412C] dark:text-coral">{error}</p>}
        <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">
          Only read when you ask about your schedule or before a briefing. Disconnecting removes our access at once.
        </p>
      </div>
    </div>
  );
}
