// Single source of truth for plans and credit costs. The landing page, billing
// screen, checkout and the backend's metering all read from here.
//
// Unit economics (Oct 2026 research, see memory note "callio-unit-economics"):
// one credit is roughly $0.03–0.05 of Gemini + telephony cost in the worst case,
// so every plan keeps ≥45% margin even if a subscriber spends every credit.

export type PlanId = "free" | "personal" | "plus" | "pro";

/** What one unit of each activity costs, in credits. */
export const CREDIT_COSTS = {
  /** Per minute of an in-app (online) call. */
  onlineMinute: 1,
  /** Per minute of a real phone call, either direction. */
  phoneMinute: 2,
  /** Minimum for a computer task; longer tasks cost more. */
  computerTaskFrom: 5,
} as const;

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** Monthly price in whole units of USD and EUR (same number by design). */
  monthly: number;
  /** Price per month when billed yearly. */
  yearlyPerMonth: number;
  /** Credits granted each billing month (one-off for the free plan). */
  credits: number;
  agents: number | "unlimited";
  features: string[];
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Meet your first agent",
    monthly: 0,
    yearlyPerMonth: 0,
    credits: 20,
    agents: 1,
    features: ["20 credits to start", "1 agent", "Calls in the app", "Memory between calls"],
  },
  {
    id: "personal",
    name: "Personal",
    tagline: "A daily briefing and the odd chat",
    monthly: 12,
    yearlyPerMonth: 10,
    credits: 120,
    agents: 2,
    features: ["120 credits a month", "2 agents", "Scheduled calls", "Text recaps after every call"],
  },
  {
    id: "plus",
    name: "Plus",
    tagline: "Agents that run errands for you",
    monthly: 24,
    yearlyPerMonth: 20,
    credits: 300,
    agents: 5,
    features: [
      "300 credits a month",
      "5 agents",
      "Computer tasks: booking, forms, research",
      "Real phone calls: missed-call backup, and calls to your people",
    ],
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For busy people and families",
    monthly: 49,
    yearlyPerMonth: 41,
    credits: 700,
    agents: "unlimited",
    features: [
      "700 credits a month",
      "Unlimited agents",
      "Everything in Plus",
      "Family check-in calls with reports",
      "Calls up to 30 minutes long",
    ],
  },
];

export interface TopUp {
  id: string;
  credits: number;
  price: number;
}

export const TOP_UPS: TopUp[] = [
  { id: "topup-50", credits: 50, price: 6 },
  { id: "topup-150", credits: 150, price: 15 },
  { id: "topup-400", credits: 400, price: 35 },
];

export const plan = (id: PlanId) => PLANS.find((p) => p.id === id)!;

/** Rough minutes of online calling a credit balance buys, for display. */
export const onlineMinutes = (credits: number) => Math.floor(credits / CREDIT_COSTS.onlineMinute);
