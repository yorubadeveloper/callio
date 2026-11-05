// Single source of truth for Callio's legal pages (privacy, terms, refunds,
// contact, acceptable use). Every value in [SQUARE BRACKETS] is a placeholder
// the founder must replace before launch. Search the repo for "[" in this file.

export type SubprocessorStatus = "active" | "may be used" | "when phone calling launches";

export interface Subprocessor {
  name: string;
  /** What we use them for. */
  purpose: string;
  /** Which of your data they receive. */
  data: string;
  /** Where the data is processed. */
  location: string;
  /** Their role under the GDPR. */
  role: "Processor" | "Independent controller";
  /** Safeguard for transfers outside the EU/EEA. */
  safeguard: string;
  status: SubprocessorStatus;
}

const TRANSFER_SAFEGUARD =
  "Data Privacy Framework where the provider is certified, otherwise EU Standard Contractual Clauses";

export const LEGAL = {
  /** ISO date of the last change to any legal page. */
  lastUpdated: "2026-10-22",
  /** Human-readable version of lastUpdated. */
  lastUpdatedLabel: "22 October 2026",

  product: "Callio",
  domain: "callio.site",
  url: "https://callio.site",

  operator: {
    legalName: "Oyelekan Oluwabukunmi",
    legalForm: "Sole proprietor (Einzelunternehmer)",
    /** Companies only (the managing director). Null hides the line on the contact page. */
    representedBy: null as string | null,
    /** Postal address. Null keeps it off the site; email is the contact route. */
    address: null as string | null,
    email: "hello@callio.site",
    privacyEmail: "privacy@callio.site",
    abuseEmail: "abuse@callio.site",
    /** §5 DDG requires a fast, direct way to reach you besides email. */
    phone: null as string | null,
    /** USt-IdNr. once you have one. Null hides the section (small business without a VAT ID). */
    vatId: null as string | null,
    /** Commercial register entry once registered as a company. Null hides the section. */
    register: null as string | null,
    /** Person responsible for editorial content under §18(2) MStV. */
    contentResponsible: "The operator named above",
  },

  backendHosting: {
    provider: "[HOSTING PROVIDER of the API server, e.g. Hetzner Online GmbH, Germany]",
    location: "[SERVER LOCATION — e.g. Germany (EU)]",
  },

  /** Where users find things in the app. Keep these in sync with the real UI. */
  app: {
    deleteAccount: "You → Delete account",
    exportData: "You → Download my data",
    cancelPlan: "Plan & credits → Cancel plan",
    /** Required for EU online contracts since 19 June 2026 (§356a BGB). */
    withdrawButton: "Plan & credits → Withdraw from contract",
  },

  webSearchProvider: "Google Search grounding through the Gemini API",

  retention: {
    /** Deleted accounts: memory, transcripts and schedules are gone within this many days. */
    deletionDays: 30,
    /** Server and error logs. */
    logDays: "30 days",
  },

  age: {
    minimum: 16,
    /** Under this age, buying a plan or top-up needs a parent's or guardian's permission. */
    purchasesWithoutConsent: 18,
  },

  refundWindowDays: 14,
  /** Notice we give before price or material terms changes. */
  noticeDays: 30,

  subprocessors: [
    {
      name: "Google (Gemini API)",
      purpose: "Runs the AI: live voice conversation, transcripts, summaries, memory and computer tasks",
      data: "Call audio (streamed from your browser, or from a phone call through our server), conversation text, memory and context we send with a request",
      location: "Google locations worldwide",
      role: "Processor",
      safeguard: TRANSFER_SAFEGUARD,
      status: "active",
    },
    {
      name: "Google (Sign-In)",
      purpose: "Lets you sign in with your Google account",
      data: "Your name, email address, profile picture and Google account ID",
      location: "Google locations worldwide",
      role: "Independent controller",
      safeguard: TRANSFER_SAFEGUARD,
      status: "active",
    },
    {
      name: "Vercel Inc.",
      purpose: "Hosts the Callio website and web app",
      data: "IP address, browser details and request logs",
      location: "Global edge network",
      role: "Processor",
      safeguard: TRANSFER_SAFEGUARD,
      status: "active",
    },
    {
      name: "[HOSTING PROVIDER of the API server, e.g. Hetzner Online GmbH, Germany]",
      purpose: "Runs our backend and PostgreSQL database",
      data: "Everything stored in your account",
      location: "[SERVER LOCATION — e.g. Germany (EU)]",
      role: "Processor",
      safeguard: "[e.g. Not needed — data stays in the EU]",
      status: "active",
    },
    {
      name: "Stripe (via Link), merchant of record",
      purpose: "Sells you plans and top-ups, takes payment, handles tax, invoices and refunds",
      data: "Name, email, billing address, payment details, purchase history",
      location: "EU and worldwide",
      role: "Independent controller",
      safeguard: TRANSFER_SAFEGUARD,
      status: "active",
    },
    {
      name: "Your browser's push service (e.g. Google, Mozilla, Apple, Microsoft)",
      purpose: "Delivers scheduled call and reminder notifications",
      data: "A push address for your device and the encrypted notification",
      location: "Depends on your browser",
      role: "Independent controller",
      safeguard: "Chosen by your browser vendor",
      status: "active",
    },
    {
      name: "Google Ireland Limited (Google Analytics 4)",
      purpose: "Counting visits and seeing how people use the website, only if you allow it",
      data: "Pages viewed, device and browser type, approximate location, and a random ID stored in a cookie",
      location: "EU and worldwide",
      role: "Processor",
      safeguard: TRANSFER_SAFEGUARD,
      status: "active",
    },
    {
      name: "Open-Meteo",
      purpose: "Weather lookups when you ask an agent about the weather",
      data: "Only the place name. No account details are sent",
      location: "Europe",
      role: "Processor",
      safeguard: "No personal data is sent",
      status: "active",
    },
    {
      name: "Cloudflare, Inc.",
      purpose: "AI and cloud browser services for computer tasks",
      data: "Task instructions and the web pages the agent works on",
      location: "Global network",
      role: "Processor",
      safeguard: TRANSFER_SAFEGUARD,
      status: "may be used",
    },
    {
      name: "Twilio Inc.",
      purpose: "Real phone calls to and from phone numbers",
      data: "Phone numbers, call audio in transit, call metadata",
      location: "Twilio locations worldwide",
      role: "Processor",
      safeguard: TRANSFER_SAFEGUARD,
      status: "active",
    },
    {
      name: "Spitch (spitch.app)",
      purpose:
        "Speech for phone calls in Yoruba, Igbo and Hausa: turns the agent's words into speech and the other person's speech into text",
      data: "The agent's words and the other person's speech on those calls",
      location: "[SPITCH LOCATION — confirm with Spitch]",
      role: "Processor",
      safeguard: "[SAFEGUARD — e.g. EU Standard Contractual Clauses; confirm with Spitch]",
      status: "active",
    },
  ] satisfies Subprocessor[],

  /** Links shown in the legal nav and footer. */
  pages: [
    { href: "/terms", label: "Terms" },
    { href: "/privacy", label: "Privacy" },
    { href: "/refunds", label: "Refunds" },
    { href: "/contact", label: "Contact" },
    { href: "/acceptable-use", label: "Acceptable use" },
  ],
} as const;

/** Who we are in one line: the name, plus the postal address when there is one. */
export const operatorLine = [LEGAL.operator.legalName, LEGAL.operator.address].filter(Boolean).join(", ");
