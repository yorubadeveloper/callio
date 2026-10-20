// Shapes returned by the Callio backend. Mirrors voice-bot/docs/api-contract.md.
import type { HairStyle } from "@/components/landing/agents";
import type { PlanId } from "@/lib/pricing";

export type Tone = "casual" | "balanced" | "formal";
export type Detail = "brief" | "normal" | "detailed";
export type PersonalityId = "warm" | "direct" | "playful" | "calm";

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
  nickname: string | null;
  about: string | null;
  interests: string[];
  tone: Tone;
  detail: Detail;
  languages: string[];
  /** How the person talks and writes, and how they like to be spoken to. */
  style: string | null;
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
  confirmation: { question: string } | null;
  result: string | null;
  credits: number;
  url: string | null;
  created_at: string;
  updated_at: string;
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
}
