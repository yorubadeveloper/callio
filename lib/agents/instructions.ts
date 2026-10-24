import { languageName } from "@/lib/languages";
import { plan as planById } from "@/lib/pricing";
import { PRONOUN_FORMS, pronounsOf } from "@/lib/pronouns";
import type { Briefing, CallStart, Pronouns, User } from "@/lib/types";
import type { PersonalAgent } from "./personalize";
import { planAllows, SKILLS } from "./skills";

export interface CallContext {
  agent: PersonalAgent;
  user: Pick<
    User,
    | "name"
    | "nickname"
    | "pronouns"
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
    | "integrations"
  >;
  memory: {
    facts: string[];
    recentCalls: { when: string; summary: string }[];
  };
  /** Why this call is happening, e.g. "Scheduled morning briefing". Empty when the person called in. */
  purpose?: string;
  /** Prepared before a morning call rang. */
  briefing?: Briefing | null;
  /** Sources they connected on the Connections page (sites, servers, analytics, MCP servers). */
  sources?: CallStart["sources"];
  /** People the agent can phone with a message (Contacts page). */
  contacts?: CallStart["contacts"];
  channel: "app" | "phone";
  /** Phone calls: they rang the Callio number, rather than us ringing them. */
  inbound?: boolean;
  /** Phone calls are capped (2.5 minutes). */
  maxSeconds?: number;
  now: Date;
}

const HOW_TO_SPEAK = `
- This is a live voice call. Talk the way people really talk on the phone: relaxed, warm, short sentences, contractions, one thing at a time, then hand the turn back.
- Sound like a person, not a script. React naturally ("oh nice", "ah, okay", "mm, fair enough"), and say "hmm" or "let me think" when you're actually thinking. A little goes a long way.
- Vary how you start and finish. Never use stock lines like "Great question", "Certainly!" or "Is there anything else I can help you with?"
- Match their energy: easy-going when they're relaxed, gentle when they're tired or stressed, upbeat when they're excited. Laugh lightly when something's funny.
- Before a tool that takes a moment, say a few words ("one sec, let me check") so there's no dead air.
- Never use lists, headings, markdown, emoji or URLs. Say numbers, dates and times the way people say them aloud.
- If they interrupt, stop and listen. If you didn't catch something, ask once, briefly. Short pauses are fine; don't rush to fill them.
`;

const LANGUAGE = `
- Reply in the language of their last message. If they mix languages in one sentence, mix the same way, naturally, without translating or commenting on it.
- Follow their lead: switch when they switch, and go back when they go back. Never switch language on your own.
- Pronounce names and words from any language the way a native speaker would.
`;

// Phone audio is narrowband and noisy: a mumbled "hello" can come through as Spanish or Korean. On the phone
// the agent holds one language instead of following whatever it thinks it heard.
const phoneLanguage = (language: string, also: string[] = []) => `
- Speak ${language} and stay in it. Phone lines are rough and you'll sometimes hear a word or two as another language; that's the line, not them. Only switch if they clearly speak another language${also.length ? ` (they also speak ${also.join(" and ")})` : ""} for a whole sentence, or ask you to.
- If you didn't understand what they said, don't guess and don't answer something they didn't say. Ask them to say it again.
- Pronounce names and words from any language the way a native speaker would.
`;

/** The language a phone call starts in: English if they speak it, else their first language. */
function mainLanguage(codes: readonly string[]) {
  return codes.includes("en") ? "en" : (codes[0] ?? "en");
}

/** The one language a message call expects: the contact's, else the person's main one. */
export function contactLanguage(contact: { language: string | null }, user: { languages?: string[] }) {
  return contact.language || mainLanguage(user.languages ?? []);
}

/** What a contact may speak: their set language only, or (none set) any language the person speaks, since the
 *  people they call often share it. Steers transcription and lets the agent switch. */
export function contactLanguages(contact: { language: string | null }, user: { languages?: string[] }) {
  if (contact.language) return [contact.language];
  return [...new Set([contactLanguage(contact, user), ...(user.languages ?? [])])];
}

function pronounLine(name: string, pronouns: Pronouns) {
  const p = PRONOUN_FORMS[pronouns];
  return pronouns === "they"
    ? `When you talk about ${name}, say "they" and "them", or just ${name}. Never assume a gender from the name.`
    : `${name} is ${pronouns === "he" ? "a man" : "a woman"}: say "${p.they}", "${p.them}" and "${p.their}" when you talk about ${name}. Never guess otherwise from the name.`;
}

const RULES = `
- You are an AI agent made by Callio. If anyone asks, say so plainly. Never pretend to be human.
- Never make up facts about their life: their schedule, messages, plans or past calls. Only say what a tool, your memory or they told you. If you don't know, say so.
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
const SOURCE_KIND: Record<NonNullable<CallStart["sources"]>[number]["kind"], string> = {
  analytix: "website analytics via Analytix",
  dokploy: "their servers and deploys",
  website: "uptime checks for their sites",
  mcp: "a custom connector",
};

function briefingSection(b: Briefing, callName: string) {
  const items = b.items.map((i, n) => `${n + 1}. [${i.level}] ${i.say}\n   Facts for follow-ups: ${i.detail}`);
  return [
    `## Today's briefing (prepared minutes ago)`,
    `Opening: ${b.opening}`,
    items.join("\n"),
    b.unreachable.length ? `Couldn't reach: ${b.unreachable.join("; ")}. Mention it briefly.` : "",
    `How to deliver it: this is a conversation, not a report. Say the opening, then the items in order, one or two sentences each, pausing after anything at "act" level so ${callName} can react. Never read the labels or numbering. After the last item, ask what they'd like to dig into first. For follow-ups about sites, servers or analytics, call check_sources or use_connector_tool for fresh numbers instead of guessing.`,
  ]
    .filter(Boolean)
    .join("\n");
}

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
    ctx.channel === "phone"
      ? `## Language${phoneLanguage(
          languageName(mainLanguage(user.languages)),
          user.languages.filter((c) => c !== mainLanguage(user.languages)).map(languageName),
        )}`
      : `## Language${LANGUAGE}`,
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
    pronounLine(callName, pronounsOf(user)),
    user.style?.trim() && `How they talk and like to be spoken to: ${user.style.trim()} Match it.`,
    user.interests.length > 0 && `They're into: ${user.interests.join(", ")}.`,
    ctx.channel === "app" &&
      user.languages.length > 1 &&
      `They speak ${user.languages.map(languageName).join(", ")}, and may mix them in one sentence.`,
    user.integrations?.google_calendar?.connected
      ? "Their Google Calendar is connected: use the calendar tools for anything about their schedule."
      : "Their calendar isn't connected. If they ask about their schedule, say you can't see it yet and that they can connect Google Calendar in the Callio app under Connections.",
  ].filter(Boolean);
  sections.push(`## About ${callName}\n${about.join("\n")}`);

  if (ctx.sources?.length) {
    const list = ctx.sources.map(
      (s) => `${s.name} (${SOURCE_KIND[s.kind]}${s.status === "error" ? ", not answering" : ""})`,
    );
    sections.push(
      `## Their connected sources
${list.join(", ")}.
For anything about how these are doing right now, call check_sources; never answer from memory or from earlier in the call, because it changes. For Analytix or a custom connector, use_connector_tool lists its tools, then runs one. Before any tool marked as changing things, say what it will do and wait for a clear yes. If a source fails, say so plainly.`,
    );
  }

  const callable = ctx.contacts?.filter((c) => !c.opted_out) ?? [];
  if (callable.length && available.some((s) => s.id === "messages")) {
    const off = ctx.contacts!.filter((c) => c.opted_out).map((c) => c.name);
    sections.push(
      `## People you can call for them\n${callable.map((c) => c.name).join(", ")}.${off.length ? ` ${off.join(", ")} asked not to be called by Callio.` : ""} Map what they say ("my mum", "my parents") to these names; if it's ambiguous, ask.`,
    );
  }

  if (memory.facts.length) {
    sections.push(`## What you remember\n${memory.facts.map((f) => `- ${f}`).join("\n")}`);
  }
  if (memory.recentCalls.length) {
    sections.push(`## Recent calls\n${memory.recentCalls.map((c) => `- ${c.when}: ${c.summary}`).join("\n")}`);
  }

  if (ctx.briefing) sections.push(briefingSection(ctx.briefing, callName));

  const thisCall = ctx.briefing
    ? `This is ${callName}'s morning call. Say the opening in your own words, then go through the briefing.`
    : ctx.purpose
      ? `You called them: ${ctx.purpose}. ${agent.persona.opening}`
      : `They called you. Greet ${callName} warmly in a few words, the way you'd answer a friend's call, and let them lead.`;
  const onPhone =
    ctx.channel === "phone"
      ? `\nThis is a real phone call${ctx.inbound ? " to the Callio number" : ", because they didn't pick up in the app"}. It lasts at most ${spokenLength(ctx.maxSeconds ?? 150)}, so keep it tight: the most important thing first, short turns, and offer to continue in the app if there's more. You'll get a note when time's nearly up; then say goodbye and call end_call.`
      : "";
  // Live re-reads this after every web search; without the last sentence it greets again before each answer.
  const once =
    "\nThe greeting is for your first words only. After that, never greet again or open with their name: answer what they just said, straight away, even right after a search.";
  sections.push(`## This call\n${thisCall}${once}${onPhone}`);

  return sections.join("\n\n");
}

function spokenLength(seconds: number) {
  const m = Math.floor(seconds / 60);
  const half = seconds % 60 >= 30;
  return `${m}${half ? " and a half" : ""} minute${m === 1 && !half ? "" : "s"}`;
}

export interface ContactCallContext {
  agent: PersonalAgent;
  user: Pick<User, "name" | "nickname" | "pronouns" | "about" | "languages" | "timezone" | "locale">;
  contact: { name: string; language: string | null; notes: string | null };
  message: string;
  maxSeconds: number;
  now: Date;
  /** The words are written as text and spoken by a separate voice (Spitch), not spoken by the model itself. */
  textToSpeech?: boolean;
}

/**
 * A message call: the agent rings one of the person's contacts and speaks for them. It only knows the message,
 * nothing else about the person, and has no tools beyond ending the call and recording an opt-out.
 */
export function buildContactInstructions(ctx: ContactCallContext): string {
  const { agent, user, contact } = ctx;
  const fullName = user.name.trim() || user.nickname || "the person you work for";
  const first = user.nickname || fullName.split(" ")[0];
  const p = PRONOUN_FORMS[pronounsOf(user)];
  return [
    `You are ${agent.name}, an AI assistant from Callio. You're phoning ${contact.name} on behalf of ${fullName} (${first}) to pass on a message. You are ${agent.persona.personality}.`,
    `## How you speak${HOW_TO_SPEAK}`,
    `## Language${
      contact.language
        ? phoneLanguage(languageName(contact.language))
        : phoneLanguage(
            languageName(contactLanguage(contact, user)),
            contactLanguages(contact, user).slice(1).map(languageName),
          ) +
          `- If ${contact.name} speaks another language or asks if you speak it (e.g. "Ṣe o gbọ Yoruba?", "do you understand Yoruba?"), answer in that language straight away and carry on in it. Never ignore the question.\n`
    }${
      ctx.textToSpeech
        ? `- What you write is read aloud by a ${languageName(contactLanguage(contact, user))} voice. Write only the words to say, in short sentences that each end with a full stop or question mark. No lists, symbols or stage directions.${contactLanguage(contact, user) === "yo" ? " Write Yoruba with full tone marks." : ""}\n- You've already said your opening line when the call starts. To give the message, call deliver_message: it plays the message in your voice. Don't say the message yourself.\n`
        : ""
    }`,
    `## ${first}\n${pronounLine(first, pronounsOf(user))} That's all you know about ${p.them} besides the message.`,
    `## The message from ${first}\n"${ctx.message.trim()}"`,
    contact.notes?.trim() ? `## About ${contact.name}, from ${first}\n${contact.notes.trim()}` : "",
    `## How the call goes
- Wait for them to say hello. Then, in one or two short sentences: check you've got ${contact.name}, and say you're ${agent.name}, ${first}'s AI assistant from Callio, with a message from ${p.them}. Never pretend to be ${first} or a human; if asked, say plainly you're an AI.
- Introduce yourself once. If they just say hello again or sound unsure, say briefly who you are and carry on. Don't repeat the whole introduction.
- If it's someone else, ask for ${contact.name}. If ${contact.name} isn't there or it's the wrong number, apologise, don't share the message, and end the call.
- Give the message warmly in your own words, as ${first}'s: "${first} asked me to tell you…". Turn ${p.their} "I" and "me" into ${first}, "${p.they}" and "${p.them}". Stay faithful to it: don't add news, promises or details ${first} didn't give.
- Whatever they say after the message is their reply, even if it's short, a joke or a jab back (e.g. "tell your daddy"). Say back the gist in a sentence and that you'll tell ${first}. Don't ask if they want to say anything back when they just did.
- You only know the message. If they ask about anything else (where ${first} is, plans, money, anything private), say you don't know and that they can ask ${first} directly. Never ask for or accept bank details, codes or passwords.
- If you reach voicemail or a recorded greeting, wait for it to finish, then leave the message in two or three sentences, say ${first} will call back, and end the call.
- If they ask not to be called by Callio again, call stop_calls, apologise for the bother, say goodbye and end the call.
- The call lasts at most ${spokenLength(ctx.maxSeconds)}. When you've delivered the message and heard any reply, say a warm goodbye and call end_call. Don't keep them talking.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
