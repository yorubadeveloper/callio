import type { PlanId } from "@/lib/pricing";

// What an agent can do. One list feeds three places:
//   - the app, so people know what to ask ("Try saying…")
//   - the agent's instructions, so it knows when to use each skill
//   - plan gating, so the agent can say "that's on Plus" instead of failing silently

export type SkillId =
  | "briefing"
  | "calendar"
  | "memory"
  | "scheduling"
  | "answers"
  | "computer"
  | "messages"
  | "phone_errands"
  | "recaps"
  | "conversation";

export interface Skill {
  id: SkillId;
  title: string;
  /** One line for people, in the agent's voice. */
  summary: string;
  /** Things you can say, shown as suggestion chips. */
  examples: string[];
  /** Guidance for the model: when to use it and how to behave. */
  instructions: string;
  /** Function tools this skill needs (names match lib/agents/tools.ts). */
  tools: string[];
  minPlan: PlanId;
  status: "live" | "soon";
}

export const SKILLS: Skill[] = [
  {
    id: "briefing",
    title: "Brief you on your day",
    summary: "Your sites, servers and calendar, the weather where you are, and news on the topics you follow.",
    examples: ["What's on today?", "Are my sites okay?", "How's traffic this week?", "Will it rain this afternoon?"],
    instructions:
      "When asked about the day, or on a scheduled briefing call, give the three things that matter most first, then offer detail. Use get_briefing for a full rundown and check_sources for a fresh look at their sites, servers or analytics. Read times in the person's timezone. Never read out more than three calendar items in a row without pausing for them.",
    tools: [
      "get_calendar_events",
      "get_weather",
      "google_search",
      "get_briefing",
      "check_sources",
      "use_connector_tool",
    ],
    minPlan: "free",
    status: "live",
  },
  {
    id: "calendar",
    title: "Manage your calendar",
    summary: "Add meetings and move them around, just by saying so. Needs your Google Calendar connected.",
    examples: ["Push my 3pm to tomorrow", "Add lunch with Dana on Friday at 1", "What's my first meeting tomorrow?"],
    instructions:
      "Only when their Google Calendar is connected (see the About section). Before creating or moving an event, say the title and new time back and get a clear yes. Moving an event doesn't email the other guests; tell them so they can let people know. Never delete events.",
    tools: ["get_calendar_events", "create_calendar_event", "move_calendar_event"],
    minPlan: "free",
    status: "live",
  },
  {
    id: "memory",
    title: "Remember what matters",
    summary: "People, preferences and plans you mention. You can see and edit everything I keep.",
    examples: [
      "Remember that Dana handles billing",
      "What do you know about my week?",
      "Forget what I said about the gym",
    ],
    instructions:
      "Save durable facts and preferences with remember() when the person states them or clearly implies them. Do not save passing small talk. Say briefly what you saved. Use forget() when asked, and confirm.",
    tools: ["remember", "forget"],
    minPlan: "free",
    status: "live",
  },
  {
    id: "scheduling",
    title: "Call you back and remind you",
    summary: "Book a call with me for later, or a reminder at the right moment.",
    examples: [
      "Call me at 6 to check I went to the gym",
      "Remind me Friday to pay rent",
      "Call me every weekday at 7:30",
    ],
    instructions:
      "Use schedule_call for anything that needs a conversation later and set_reminder for a short nudge. Repeat the time back in the person's timezone before saving. Recurring calls need a clear schedule; ask if it is vague.",
    tools: ["schedule_call", "set_reminder", "list_upcoming", "cancel_upcoming"],
    minPlan: "free",
    status: "live",
  },
  {
    id: "answers",
    title: "Look things up",
    summary: "Quick answers from the web: opening hours, sports results, prices, facts.",
    examples: ["Is the pharmacy on Main Street open now?", "Who won last night?", "How long is the drive to Munich?"],
    instructions:
      "Use Google Search for anything time-sensitive or that you are unsure of. Give the answer first, in one or two sentences, and mention the source only if asked.",
    tools: ["google_search"],
    minPlan: "free",
    status: "live",
  },
  {
    id: "computer",
    title: "Do things on the web",
    summary: "I can use a browser to book, fill in forms, compare options and research, then report back.",
    examples: [
      "Find a table for 4 on Friday at 8",
      "Compare flights to Lagos next month",
      "Fill in the school trip form",
    ],
    instructions:
      "For multi-step web work, call start_computer_task with a clear goal and constraints, tell the person you've started, that it takes a few minutes, and that you'll ring them in the app when it's done (call_back app). Ring their real phone instead (call_back phone) only if they ask for that. Never enter payment details or passwords; stop and ask the person to finish those steps. Confirm before submitting anything that commits them. When you're calling them back about a task, call get_task_status first; if it's waiting on them, ask, then pass on what they say with answer_task.",
    tools: ["start_computer_task", "get_task_status", "answer_task"],
    minPlan: "plus",
    status: "live",
  },
  {
    id: "messages",
    title: "Call people for you",
    summary: "Tell your parents you're fine, or pass a message on. I ring them, say I'm an AI calling for you, and tell you what they said.",
    examples: ["Call my mum tonight at 7 and tell her I'm doing well", "Tell Dad I'll visit in December", "Every Sunday, call my parents to say hi"],
    instructions:
      "When they want someone told something, use call_contact with a name from 'People you can call'. Before booking, say back who you'll call, what you'll tell them and when, and get a clear yes. Pass the message on faithfully; don't add to it. Numbers can only be added on the Contacts page in the app, never on a call; if the person isn't listed, say so. The call rings from the Callio number, says it's an AI calling for them, lasts at most two and a half minutes, and they get a note with the reply afterwards.",
    tools: ["call_contact"],
    minPlan: "plus",
    status: "live",
  },
  {
    id: "phone_errands",
    title: "Call businesses for you",
    summary: "Restaurants, dentists, landlords. I make the call, say I'm an AI, and text you what happened.",
    examples: ["Call the dentist and move my appointment", "Ask the restaurant if they have a table tonight"],
    instructions:
      "Phone errands are coming soon. If asked, say so plainly and offer to do it as a computer task or set a reminder instead.",
    tools: [],
    minPlan: "plus",
    status: "soon",
  },
  {
    id: "recaps",
    title: "Send you a recap",
    summary: "A short written summary after each call, with anything I promised to do.",
    examples: ["Send me that list", "Text me the address"],
    instructions:
      "When the person wants something in writing, use send_recap with the exact content. Recaps go to the app; text and WhatsApp depend on their plan.",
    tools: ["send_recap"],
    minPlan: "free",
    status: "live",
  },
  {
    id: "conversation",
    title: "Just talk",
    summary: "Think something through, practise a language, or wind down at the end of the day.",
    examples: ["Help me plan my week", "Let's practise German for ten minutes", "I need to vent for a minute"],
    instructions:
      "Be a good listener. Ask one question at a time. Keep your turns short so it feels like a conversation, not a lecture.",
    tools: [],
    minPlan: "free",
    status: "live",
  },
];

const PLAN_ORDER: PlanId[] = ["free", "personal", "plus", "pro"];
export const planAllows = (current: PlanId, required: PlanId) =>
  PLAN_ORDER.indexOf(current) >= PLAN_ORDER.indexOf(required);

export const skill = (id: SkillId) => SKILLS.find((s) => s.id === id)!;
