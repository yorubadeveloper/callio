// Shapes returned by the Callio backend. Mirrors voice-bot/docs/api-contract.md.
import type { HairStyle } from "@/components/landing/agents";
import type { PlanId } from "@/lib/pricing";

export type Tone = "casual" | "balanced" | "formal";
export type Detail = "brief" | "normal" | "detailed";
export type PersonalityId = "warm" | "direct" | "playful" | "calm";
export type Pronouns = "he" | "she" | "they";

export interface User {
  id: string;
  email: string;
  name: string;
  image: string | null;
  timezone: string;
  locale: string;
  city: string | null;
  plan: PlanId;
  plan_status: "active" | "past_due" | "cancelled" | "none";
  credits: { plan: number; topup: number; total: number };
  onboarded: boolean;
  /** One-time guides finished or dismissed: "tour", "guide". */
  seen?: string[];
  nickname: string | null;
  /** How agents refer to them when talking about them. Unset: worked out from `about`, else "they". */
  pronouns?: Pronouns | null;
  about: string | null;
  interests: string[];
  tone: Tone;
  detail: Detail;
  languages: string[];
  /** How the person talks and writes, and how they like to be spoken to. */
  style: string | null;
  integrations: {
    google_calendar: {
      connected: boolean;
      account_email: string | null;
      connected_at: string | null;
      /** Google revoked our access (e.g. password change); the person needs to connect again. */
      needs_reconnect?: boolean;
    };
  };
  created_at: string;
}

export interface ProfileSuggestion {
  nickname?: string | null;
  about?: string | null;
  interests?: string[];
  tone?: Tone | null;
  detail?: Detail | null;
  languages?: string[];
  style?: string | null;
  city?: string | null;
  timezone?: string | null;
}

export interface ImportedFact {
  text: string;
  category: "about" | "people" | "work" | "preferences" | "routines" | "goals" | "other";
}

export interface AgentLook {
  tile: string;
  skin: string;
  hair: HairStyle;
  hairColor: string;
  shirt: string;
  glasses: boolean;
}

export interface UserAgent {
  id: string;
  template: string;
  name: string;
  voice: string | null;
  look: AgentLook | null;
  personality: PersonalityId | null;
  instructions: string | null;
  created_at: string;
}

export interface Memory {
  id: string;
  text: string;
  agent_id: string | null;
  source: "call" | "import" | "manual";
  created_at: string;
}

export interface TranscriptLine {
  who: "you" | "agent";
  text: string;
}

export interface Call {
  id: string;
  agent_id: string;
  channel: "app" | "phone";
  status: "live" | "ended";
  started_at: string;
  ended_at: string | null;
  seconds: number;
  credits: number;
  summary: string | null;
  /** Phone calls to one of their contacts: who was called and how it went. */
  contact_id?: string | null;
  contact_name?: string | null;
  outcome?: string | null;
  transcript?: TranscriptLine[];
}

export interface Schedule {
  id: string;
  agent_id: string;
  type: "call" | "reminder";
  when: string;
  local_when: string;
  text: string;
  repeat: "none" | "daily" | "weekdays" | "weekly";
  status: "pending" | "done" | "cancelled";
  /** The morning call: a briefing is written just before it rings. */
  briefing?: boolean;
  /** A message call: the agent phones this contact and passes `text` on. */
  contact_id?: string | null;
  contact_name?: string | null;
}

export interface AppNotification {
  id: string;
  kind: "recap" | "reminder" | "task" | "call" | "alert";
  title: string;
  body: string;
  created_at: string;
  read: boolean;
}

export interface TaskStep {
  n: number;
  action: string;
  detail: string;
  at: string;
}

export interface Task {
  id: string;
  agent_id: string;
  goal: string;
  constraints: string | null;
  status: "queued" | "running" | "needs_confirmation" | "done" | "failed" | "cancelled";
  steps: TaskStep[];
  /** Waiting on them: an OK to go ahead ("confirm") or an answer to a question ("question"). */
  confirmation: { question: string; kind?: "confirm" | "question" } | null;
  result: string | null;
  /** The finished answer, laid out: the short answer, the options found, and what to keep in mind. */
  report: TaskReport | null;
  credits: number;
  url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskReport {
  summary: string;
  items: { title: string; detail: string; price: string; link: string }[];
  notes: string[];
}

export interface Highlights {
  calls_this_week: number;
  minutes_this_week: number;
  memories: number;
  next_schedule: Schedule | null;
  streak_days: number;
}

export interface Billing {
  plan: PlanId;
  plan_status: User["plan_status"];
  interval: "month" | "year" | null;
  renews_at: string | null;
  /** Set when the plan is cancelled and ends at this date. */
  cancel_at: string | null;
  credits: User["credits"];
  ledger: { delta: number; bucket: "plan" | "topup"; reason: string; created_at: string }[];
}

export interface CallStart {
  call_id: string;
  max_seconds: number;
  user: User;
  agent: UserAgent;
  memory: { facts: string[]; recent_calls: { when: string; summary: string }[] };
  briefing?: Briefing | null;
  sources?: { name: string; kind: ConnectorKind; status: Connector["status"] }[];
  /** People the agent can phone with a message. */
  contacts?: { name: string; opted_out: boolean }[];
  /** Signs the browser's upload of this call's recording (POST /v1/recordings/{call_id}). */
  recording_token?: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  language: string | null;
  notes: string | null;
  opted_out: boolean;
  opted_out_at: string | null;
  /** What a minute of calling this number costs, from what the phone network charges to reach it. */
  credits_per_minute: number;
  created_at: string;
}

/** Their own phone: verified number, missed-call fallback, and whether phone calls are available at all. */
export interface PhoneSettings {
  number: string | null;
  verified_at: string | null;
  fallback: boolean;
  /** A number waiting for its code. */
  pending: string | null;
  available: boolean;
  plan_allows: boolean;
  /** The number Callio calls from. */
  caller_id: string | null;
  /** Credits a minute when Callio rings their own number. */
  credits_per_minute: number | null;
}

/** What the backend sends /api/internal/live-config to set up a phone call. */
export type PhoneCallSetup =
  | { kind: "user"; channel: "phone"; inbound: boolean; purpose: string | null; start: CallStart }
  | {
      kind: "contact";
      /** "spitch": Spitch speaks and hears, a text model writes the words (Yoruba, Igbo, Hausa). */
      route?: "gemini" | "spitch";
      user: Pick<User, "name" | "nickname" | "pronouns" | "about" | "languages" | "timezone" | "locale">;
      agent: UserAgent;
      contact: Pick<Contact, "name" | "language" | "notes">;
      message: string;
      max_seconds: number;
      attempt: number;
    };

export type ConnectorKind = "analytix" | "dokploy" | "website" | "mcp";

export interface SiteCheck {
  url: string;
  up: boolean;
  code?: number;
  ms?: number;
  slow?: boolean;
  error?: string;
}

export interface Connector {
  id: string;
  kind: ConnectorKind;
  name: string;
  url: string | null;
  urls: string[] | null;
  has_secret: boolean;
  in_briefing: boolean;
  alerts: "off" | "notify" | "call";
  status: "ok" | "error" | "unknown";
  summary: string | null;
  last_checked_at: string | null;
  last_error: string | null;
  created_at: string;
  tools?: { name: string; description: string; read_only: boolean; allowed: boolean }[];
  sites?: SiteCheck[];
}

export interface BriefingItem {
  topic: "sites" | "servers" | "day" | "news" | "weather" | "other";
  level: "act" | "watch" | "info";
  say: string;
  detail: string;
}

export interface Briefing {
  id: string;
  created_at: string;
  opening: string;
  all_clear: boolean;
  items: BriefingItem[];
  unreachable: string[];
  sources: Record<string, string>;
}

export interface MorningCall {
  enabled: boolean;
  agent_id: string | null;
  time: string;
  repeat: "daily" | "weekdays";
  next_at: string | null;
  schedule_id: string | null;
  prefs: { calendar: boolean; weather: boolean; news: boolean };
  topics: string[];
}
