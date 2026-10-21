import { CREDIT_COSTS, PLANS } from "@/lib/pricing";

const free = PLANS.find((p) => p.id === "free")!;

/** Landing-page FAQ. Also published as FAQPage structured data for search. */
export const FAQ: { q: string; a: string }[] = [
  {
    q: "Am I talking to a real person?",
    a: "No. Every Callio agent is an AI, and it will always tell you so if you ask. You choose its name, voice and personality, but it never pretends to be human.",
  },
  {
    q: "How do the calls work?",
    a: "Tap Call in the app and talk, just like a phone call. Your agents can also ring you at times you choose with a notification. On iPhone, add Callio to your Home Screen first. On Plus and Pro, a call you miss in the app rings your real phone instead, and you can ring the Callio number from your phone to reach your agent. Real phone calls last up to two and a half minutes.",
  },
  {
    q: "Can my agent call my family for me?",
    a: "Yes, on Plus and Pro. Add someone on the Contacts page, then just say “call my mum and tell her I'm fine”. Your agent rings them, says it's an AI calling for you, passes your message on, and tells you what they said. It only knows the message, nothing else about you, and if they'd rather not get calls, they just say so and Callio stops.",
  },
  {
    q: "Do you record my calls?",
    a: "We don't store any audio. We keep a text transcript and a one-line summary so your agent remembers what you talked about. You can read and delete all of it, or your whole account, any time.",
  },
  {
    q: "What's a credit?",
    a: `One credit is one minute of talking in the app; a real phone call is ${CREDIT_COSTS.phoneMinute} credits a minute. Computer tasks start at ${CREDIT_COSTS.computerTaskFrom} credits. You get ${free.credits} free credits to start; plan credits refresh every month and top-ups never expire.`,
  },
  {
    q: "Can my agent actually do things for me?",
    a: "Yes. They remember things, set reminders, call you back, check the weather and look things up. On Plus, they can also use a web browser to book, fill in forms and compare prices. They ask before anything that commits you, and never type passwords or card details.",
  },
  {
    q: "Which countries and languages?",
    a: "Callio works anywhere with an internet connection, and prices are in US dollars. Agents speak English and dozens of other languages, including Yorùbá, Hausa, Spanish, French and German, and they switch when you do.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes, in two taps from Plan & credits. Your plan runs until the end of the period you've paid for, and you keep your agents and memory on the free plan.",
  },
];
