// Single source of truth for plans and credit costs. The landing page, billing
// screen, checkout and the backend's metering all read from here.
//
// Unit economics: a credit may cost us at most $0.04 (backend CREDIT_COST_USD), and the cheapest credit we sell
// (Pro yearly) brings in about 7¢, so every plan keeps ≥40% margin even if a subscriber spends every credit.
// Phone minutes are priced per number from Twilio's rates (backend app/core/phone_rates.py); computer tasks
// from the model tokens they use.

export type PlanId = "free" | "personal" | "plus" | "pro";

/** What one unit of each activity costs, in credits. */
export const CREDIT_COSTS = {
  /** Per minute of an in-app (online) call. */
  onlineMinute: 1,
  /** Per minute of a real phone call: the least it costs (US, Canada, most landlines). Depends on the number. */
  phoneMinuteFrom: 2,
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
    monthly: 15,
    yearlyPerMonth: 12,
    credits: 120,
    agents: 2,
    features: ["120 credits a month", "2 agents", "Scheduled calls", "Text recaps after every call"],
  },
  {
    id: "plus",
    name: "Plus",
    tagline: "Agents that run errands for you",
    monthly: 29,
    yearlyPerMonth: 24,
    credits: 300,
    agents: 5,
    features: [
      "300 credits a month",
      "5 agents",
      "Computer tasks: booking, forms, research",
      "Real phone calls: missed-call backup, and calls to your people",
      "10 messages by phone a day",
    ],
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For busy people and families",
    monthly: 69,
    yearlyPerMonth: 57,
    credits: 800,
    agents: "unlimited",
    features: [
      "800 credits a month",
      "Unlimited agents",
      "Everything in Plus",
      "30 messages by phone a day, with reports",
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
  { id: "topup-50", credits: 50, price: 8 },
  { id: "topup-150", credits: 150, price: 21 },
  { id: "topup-400", credits: 400, price: 48 },
];

/** Credits a minute for a phone call to a few places (landline, mobile), from our US number. A rough guide:
 *  the exact rate depends on the number and is shown next to each contact. */
export const PHONE_RATES: { place: string; landline: number; mobile: number }[] = [
  { place: "US & Canada", landline: 2, mobile: 2 },
  { place: "United Kingdom", landline: 2, mobile: 3 },
  { place: "Germany", landline: 3, mobile: 11 },
  { place: "France", landline: 2, mobile: 6 },
  { place: "India", landline: 4, mobile: 3 },
  { place: "Nigeria", landline: 8, mobile: 8 },
  { place: "Kenya", landline: 11, mobile: 12 },
  { place: "South Africa", landline: 14, mobile: 11 },
  { place: "Ghana", landline: 14, mobile: 15 },
];

export const plan = (id: PlanId) => PLANS.find((p) => p.id === id)!;

/** Rough minutes of online calling a credit balance buys, for display. */
export const onlineMinutes = (credits: number) => Math.floor(credits / CREDIT_COSTS.onlineMinute);
