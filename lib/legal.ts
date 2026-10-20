// Single source of truth for Callio's legal pages (privacy, terms, refunds,
// imprint, acceptable use). Every value in [SQUARE BRACKETS] is a placeholder
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

const US_SAFEGUARD =
  "EU-US Data Privacy Framework where the provider is certified, otherwise EU Standard Contractual Clauses";

export const LEGAL = {
  /** ISO date of the last change to any legal page. */
  lastUpdated: "2026-10-20",
  /** Human-readable version of lastUpdated. */
  lastUpdatedLabel: "20 October 2026",

  product: "Callio",
  domain: "callio.site",
  url: "https://callio.site",

  operator: {
    legalName: "[LEGAL NAME — your full name as sole trader, or the company name]",
    legalForm: "[LEGAL FORM — e.g. sole proprietor (Einzelunternehmer) or UG (haftungsbeschränkt)]",
    /** Only for a company. Delete the line on the imprint if you are a sole trader. */
    representedBy: "[REPRESENTED BY — managing director's name, companies only]",
    street: "[STREET AND NUMBER]",
    postcodeCity: "[POSTCODE CITY]",
    country: "Germany",
    email: "[EMAIL — e.g. hello@callio.site]",
    privacyEmail: "[PRIVACY EMAIL — e.g. privacy@callio.site]",
    abuseEmail: "[ABUSE EMAIL — e.g. abuse@callio.site]",
    /** §5 DDG requires a fast, direct way to reach you besides email. */
    phone: "[PHONE NUMBER — or another fast, direct contact route]",
    vatId: "[VAT ID (USt-IdNr.) or 'not applicable']",
    register: "[COMMERCIAL REGISTER AND NUMBER — e.g. Amtsgericht Berlin, HRB 000000 — or 'not registered']",
    /** Person responsible for editorial content under §18(2) MStV. */
    contentResponsible: "[NAME AND ADDRESS of the person responsible for content — usually you]",
  },

  /** The data protection authority of the founder's German Land. */
  supervisoryAuthority: {
    name: "[DATA PROTECTION AUTHORITY of your Land — e.g. Berliner Beauftragte für Datenschutz und Informationsfreiheit]",
    url: "[AUTHORITY WEBSITE URL]",
  },

  backendHosting: {
    provider: "[HOSTING PROVIDER of the Dokploy server, e.g. Hetzner Online GmbH, Germany]",
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
    logDays: "[LOG RETENTION — e.g. 30] days",
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
      data: "Call audio (streamed from your browser), conversation text, memory and context we send with a request",
      location: "USA and other Google locations",
      role: "Processor",
      safeguard: US_SAFEGUARD,
      status: "active",
    },
    {
      name: "Google (Sign-In)",
      purpose: "Lets you sign in with your Google account",
      data: "Your name, email address, profile picture and Google account ID",
      location: "USA and other Google locations",
      role: "Independent controller",
      safeguard: US_SAFEGUARD,
      status: "active",
    },
    {
      name: "Vercel Inc.",
      purpose: "Hosts the Callio website and web app",
      data: "IP address, browser details and request logs",
      location: "USA and global edge network",
      role: "Processor",
      safeguard: US_SAFEGUARD,
      status: "active",
    },
    {
      name: "[HOSTING PROVIDER of the Dokploy server, e.g. Hetzner Online GmbH, Germany]",
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
      location: "Ireland, USA",
      role: "Independent controller",
      safeguard: US_SAFEGUARD,
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
      name: "Open-Meteo",
      purpose: "Weather lookups when you ask an agent about the weather",
      data: "Only the place name. No account details are sent",
      location: "[OPEN-METEO LOCATION — confirm]",
      role: "Processor",
      safeguard: "No personal data is sent",
      status: "active",
    },
    {
      name: "Cloudflare, Inc.",
      purpose: "AI and cloud browser services for computer tasks",
      data: "Task instructions and the web pages the agent works on",
      location: "USA and global network",
      role: "Processor",
      safeguard: US_SAFEGUARD,
      status: "may be used",
    },
    {
      name: "Telnyx LLC",
      purpose: "Real phone calls to and from phone numbers",
      data: "Phone numbers, call audio in transit, call metadata",
      location: "USA and other Telnyx locations",
      role: "Processor",
      safeguard: US_SAFEGUARD,
      status: "when phone calling launches",
    },
  ] satisfies Subprocessor[],

  /** Links shown in the legal nav and footer. */
  pages: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/refunds", label: "Refunds" },
    { href: "/acceptable-use", label: "Acceptable use" },
    { href: "/imprint", label: "Imprint" },
  ],
} as const;

/** One-line postal address. */
export const operatorAddress = `${LEGAL.operator.street}, ${LEGAL.operator.postcodeCity}, ${LEGAL.operator.country}`;
