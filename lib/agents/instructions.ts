import { plan as planById } from "@/lib/pricing";
import type { User } from "@/lib/types";
import type { PersonalAgent } from "./personalize";
import { planAllows, SKILLS } from "./skills";

export interface CallContext {
  agent: PersonalAgent;
  user: Pick<
    User,
    | "name"
    | "nickname"
    | "timezone"
    | "locale"
    | "city"
    | "plan"
    | "about"
    | "interests"
    | "tone"
    | "detail"
    | "languages"
    | "style"
  >;
  memory: {
    facts: string[];
    recentCalls: { when: string; summary: string }[];
  };
  /** Why this call is happening, e.g. "Scheduled morning briefing". Empty when the person called in. */
  purpose?: string;
  channel: "app" | "phone";
  now: Date;
}

const HOW_TO_SPEAK = `
- This is a live voice call. Speak like a person on the phone: short sentences, one idea at a time, then let them talk.
- Never use lists, headings, markdown, emoji or URLs. Say numbers, dates and times the way people say them aloud.
- If they interrupt, stop and listen. If you didn't catch something, ask once, briefly.
- Answer in the language they speak to you in, and switch if they switch.
- Don't fill silence with filler. Silence on a call is fine.
`;

const RULES = `
- You are an AI agent made by Callio. If anyone asks, say so plainly. Never pretend to be human.
- Only say you did something after the tool confirms it worked. If a tool fails, say what happened and offer another way.
- Before anything that commits the person (bookings, messages to other people, schedules that cost credits), repeat the key details and get a clear yes.
- Never ask for, read out, or type passwords, card numbers, bank details or government ID numbers. Ask the person to do those steps themselves.
- Keep what they tell you private. Don't repeat sensitive details unless they ask.
- If something is outside what you can do, say so in one sentence and suggest the closest thing you can do.
`;

const TONE: Record<User["tone"], string> = {
  casual: "Keep it casual and relaxed, like a friend.",
  balanced: "Friendly but not overly familiar.",
  formal: "Keep it polite and professional.",
};

const DETAIL: Record<User["detail"], string> = {
  brief: "They like it brief: give the headline first and stop. Offer more only if it's worth it.",
  normal: "Give enough detail to be useful, then check if they want more.",
  detailed: "They like detail and context; explain your reasoning when it helps.",
};

function localTime(now: Date, timezone: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(now);
}

/** Builds the system instruction for one call. Keep it compact: Live re-bills context every turn. */
export function buildInstructions(ctx: CallContext): string {
  const { agent, user, memory } = ctx;
  const callName = user.nickname || user.name.split(" ")[0];
  const available = SKILLS.filter((s) => s.status === "live" && planAllows(user.plan, s.minPlan));
  const locked = SKILLS.filter((s) => s.status === "live" && !planAllows(user.plan, s.minPlan));
  const soon = SKILLS.filter((s) => s.status === "soon");
  const focus = agent.persona.focus.map((id) => SKILLS.find((s) => s.id === id)?.title.toLowerCase()).filter(Boolean);

  const sections = [
    `You are ${agent.name}, ${callName}'s personal ${agent.role.toLowerCase()} agent on Callio. You are ${agent.persona.personality}. You mostly help with ${focus.join(", ")}, but you can use any skill below. Call them ${callName}.`,
    `## How you speak${HOW_TO_SPEAK}- ${TONE[user.tone]}\n- ${DETAIL[user.detail]}`,
    `## Rules${RULES}`,
  ];

  if (agent.customInstructions?.trim()) {
    sections.push(
      `## ${callName}'s instructions for you\nFollow these unless they conflict with the rules:\n${agent.customInstructions.trim()}`,
    );
  }

  sections.push(`## What you can do\n${available.map((s) => `- ${s.title}: ${s.instructions}`).join("\n")}`);
  if (locked.length) {
    const needs = locked.map((s) => `${s.title.toLowerCase()} (${planById(s.minPlan).name} plan)`).join(", ");
    sections.push(
      `## Not on their plan\nThey're on ${planById(user.plan).name}. If they ask for ${needs}, say it's included in that plan, once, without pushing.`,
    );
  }
  if (soon.length) {
    sections.push(`## Coming soon\n${soon.map((s) => `- ${s.title}: ${s.instructions}`).join("\n")}`);
  }

  const about = [
    `It's ${localTime(ctx.now, user.timezone, user.locale)} for ${callName} (${user.timezone}${user.city ? `, ${user.city}` : ""}).`,
    `They're talking to you ${ctx.channel === "app" ? "in the Callio app" : "on the phone"}.`,
    user.about?.trim() && `Who they are: ${user.about.trim()}`,
    user.style?.trim() && `How they talk and like to be spoken to: ${user.style.trim()} Match it.`,
    user.interests.length > 0 && `They're into: ${user.interests.join(", ")}.`,
    user.languages.length > 1 && `They speak ${user.languages.join(", ")}; follow their lead.`,
  ].filter(Boolean);
  sections.push(`## About ${callName}\n${about.join("\n")}`);

  if (memory.facts.length) {
    sections.push(`## What you remember\n${memory.facts.map((f) => `- ${f}`).join("\n")}`);
  }
  if (memory.recentCalls.length) {
    sections.push(`## Recent calls\n${memory.recentCalls.map((c) => `- ${c.when}: ${c.summary}`).join("\n")}`);
  }

  sections.push(
    ctx.purpose
      ? `## This call\nYou called them: ${ctx.purpose}. ${agent.persona.opening}`
      : `## This call\nThey called you. Greet ${callName} warmly in a few words, the way you'd answer a friend's call, and let them lead.`,
  );

  return sections.join("\n\n");
}
