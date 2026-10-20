export type HairStyle = "bob" | "bun" | "curls" | "flat" | "puffs" | "swoop" | "none";

export interface Agent {
  name: string;
  role: string;
  /** First-person pitch, shown on template cards. */
  pitch: string;
  /** When the agent usually calls, shown as a schedule chip. */
  schedule: string;
  face: {
    tile: string;
    skin: string;
    hair: HairStyle;
    hairColor: string;
    shirt: string;
    glasses?: boolean;
  };
}

// Brand palette, taken from the logo.
export const CORAL = "#F17660";
export const AMBER = "#F4BA6A";
export const TEAL = "#64B2AF";
export const PERI = "#8896E3";
export const INK = "#121212";
const CORAL_TINT = "#FBD3CA";
const AMBER_TINT = "#FBE5C4";
const TEAL_TINT = "#CFE7E5";
const PERI_TINT = "#D9DEF8";

// Order matters: index 0 sits in the "1" hole of the hero dial.
export const AGENTS: Agent[] = [
  {
    name: "Laura",
    role: "Morning brief",
    pitch: "I call before your first coffee with your day, the weather, and the news you follow.",
    schedule: "Weekdays · 7:30",
    face: { tile: TEAL_TINT, skin: CORAL, hair: "bob", hairColor: INK, shirt: "#FFFFFF" },
  },
  {
    name: "Theo",
    role: "Errand runner",
    pitch: "Tell me who to call. I book, reschedule and chase, then text you what happened.",
    schedule: "When you ask",
    face: { tile: AMBER_TINT, skin: PERI, hair: "flat", hairColor: INK, shirt: CORAL },
  },
  {
    name: "Ada",
    role: "Family check-in",
    pitch: "I ring your mum every evening for a chat, then tell you how she's doing.",
    schedule: "Daily · 18:00",
    face: { tile: CORAL_TINT, skin: TEAL, hair: "puffs", hairColor: INK, shirt: "#FFFFFF" },
  },
  {
    name: "Juno",
    role: "Meeting prep",
    pitch: "Ten minutes before each meeting, I call with who's in it and what you promised them.",
    schedule: "Before meetings",
    face: { tile: PERI_TINT, skin: AMBER, hair: "swoop", hairColor: CORAL, shirt: INK, glasses: true },
  },
  {
    name: "Kemi",
    role: "Accountability coach",
    pitch: "You set the goal. I call at the time you said, and ask how it went.",
    schedule: "Mon, Wed, Fri · 18:00",
    face: { tile: AMBER_TINT, skin: CORAL, hair: "curls", hairColor: INK, shirt: TEAL },
  },
  {
    name: "Mateo",
    role: "Language partner",
    pitch: "Fifteen minutes of real conversation in the language you're learning. No flashcards.",
    schedule: "Daily · 12:30",
    face: { tile: TEAL_TINT, skin: PERI, hair: "none", hairColor: INK, shirt: AMBER, glasses: true },
  },
  {
    name: "Noor",
    role: "Inbox reader",
    pitch: "I read you what landed overnight and draft the replies while you drive.",
    schedule: "Weekdays · 8:15",
    face: { tile: PERI_TINT, skin: CORAL, hair: "bun", hairColor: INK, shirt: AMBER },
  },
  {
    name: "Ravi",
    role: "Bill tracker",
    pitch: "I call two days before anything is due, so nothing lands on the late list.",
    schedule: "Before due dates",
    face: { tile: CORAL_TINT, skin: AMBER, hair: "flat", hairColor: PERI, shirt: INK },
  },
  {
    name: "Bea",
    role: "Wind-down",
    pitch: "A short evening call to close the day: what went well, and what's first tomorrow.",
    schedule: "Daily · 21:30",
    face: { tile: TEAL_TINT, skin: AMBER, hair: "curls", hairColor: CORAL, shirt: PERI },
  },
  {
    name: "Sol",
    role: "Travel desk",
    pitch: "Gate changes, delays, and the taxi you forgot to book, sorted before you land.",
    schedule: "On trips",
    face: { tile: AMBER_TINT, skin: TEAL, hair: "bob", hairColor: PERI, shirt: CORAL },
  },
];

export const agent = (name: string) => AGENTS.find((a) => a.name === name)!;
