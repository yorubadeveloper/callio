import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Acceptable use and AI transparency",
  description:
    "What Callio agents will and won't do, how they disclose that they are AI, and how to report abuse.",
};

const SECTIONS = [
  { id: "ai-disclosure", title: "Our AI disclosure promise" },
  { id: "will", title: "What agents will do" },
  { id: "wont", title: "What agents won’t do" },
  { id: "your-rules", title: "Your responsibilities" },
  { id: "enforcement", title: "What happens if rules are broken" },
  { id: "report", title: "Reporting abuse" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function Heading({ id }: { id: SectionId }) {
  const section = SECTIONS.find((s) => s.id === id)!;
  return (
    <h2>
      <a href={`#${id}`}>{section.title}</a>
    </h2>
  );
}

function Contents() {
  return (
    <nav aria-label="On this page" className="mt-10 rounded-[28px] bg-plate p-6 ring-1 ring-line sm:p-7">
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-soft">On this page</p>
      <ol className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-[15px] sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="text-ink-soft hover:text-ink">
              {s.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

const { operator } = LEGAL;

export default function AcceptableUsePage() {
  return (
    <article>
      <p className="text-sm text-ink-soft">Last updated {LEGAL.lastUpdatedLabel}</p>
      <h1 className="mt-3 font-display text-[40px] font-medium leading-[1.05] tracking-[-0.035em] sm:text-[52px]">
        Acceptable use and AI transparency
      </h1>
      <p className="mt-5 text-[18px] text-ink-soft">
        Callio agents are helpful because people can trust them. These rules keep it that way, for you and for
        everyone your agents talk to. They are part of our <Link href="/terms" className="underline underline-offset-4">Terms of service</Link>.
      </p>

      <Contents />

      <div className="legal-prose">
        <section id="ai-disclosure">
          <Heading id="ai-disclosure" />
          <div className="callout">
            <p>
              <strong>Callio agents never pretend to be human.</strong>
            </p>
            <ul>
              <li>In the app, every agent is clearly labelled as an AI.</li>
              <li>
                When an agent calls or talks to someone other than you, such as a business, it says at the start
                that it is an AI assistant calling on behalf of a Callio user.
              </li>
              <li>If anyone asks whether they are talking to a person, the agent answers honestly.</li>
              <li>
                We don’t keep call audio. For phone calls it is held in memory until the call ends so we can make an
                accurate transcript, then deleted. We keep text transcripts so your agent can remember what happened.
              </li>
            </ul>
          </div>
          <p>
            This follows the transparency rules of the EU AI Act (Art. 50): people must know when they are
            interacting with an AI system.
          </p>
        </section>

        <section id="will">
          <Heading id="will" />
          <ul>
            <li>Talk with you, remember what you tell them and pick up where you left off.</li>
            <li>Call you at times you schedule, with reminders and briefings.</li>
            <li>Search the web and look up things like the weather.</li>
            <li>On paid plans, do computer tasks in a cloud browser: fill in forms, compare options, make bookings.</li>
            <li>Ask for your approval before sensitive steps, like submitting a form or confirming a booking.</li>
            <li>Tell you when they don’t know something or can’t do a task.</li>
          </ul>
        </section>

        <section id="wont">
          <Heading id="wont" />
          <ul>
            <li>Claim to be human, or impersonate a real person or organisation.</li>
            <li>Enter passwords, card numbers or other payment details.</li>
            <li>Call emergency services. In an emergency, call 112 (EU) or 911 (US) yourself.</li>
            <li>Give medical, legal or financial advice in place of a professional.</li>
            <li>Make robocalls, spam, bulk calls or telemarketing.</li>
            <li>Harass, threaten or deceive anyone, or help with anything illegal.</li>
            <li>Get around CAPTCHAs, paywalls, logins or other security measures, or scrape websites in bulk.</li>
            <li>Record audio of calls.</li>
          </ul>
          <p>Agents are AI and can still make mistakes. If an agent does something on this list, please report it.</p>
        </section>

        <section id="your-rules">
          <Heading id="your-rules" />
          <ul>
            <li>Only ask agents to do things you are allowed to do yourself.</li>
            <li>
              Only have agents contact people or businesses who would expect it, and get consent where the law
              requires it (for example for marketing calls, or under the US TCPA for automated calls).
            </li>
            <li>Don’t share other people’s private information with your agent unless you have a right to.</li>
            <li>Respect the terms of websites your agent visits during computer tasks.</li>
            <li>Check the details before you approve a sensitive step.</li>
          </ul>
        </section>

        <section id="enforcement">
          <Heading id="enforcement" />
          <p>
            Depending on how serious it is, we may stop a call or task, limit features, suspend or close your
            account. Where it’s reasonable, we warn you first. Where the law requires it, we report illegal
            activity to the authorities. See <Link href="/terms#termination">Ending the contract</Link> in our
            terms.
          </p>
        </section>

        <section id="report">
          <Heading id="report" />
          <p>
            Did a Callio agent contact you without reason, behave badly, or do you think someone is misusing
            Callio? Email <a href={`mailto:${operator.abuseEmail}`}>{operator.abuseEmail}</a>. Tell us when it
            happened, the number or website involved (if any) and what happened. You don’t need a Callio account to
            report abuse. We review every report.
          </p>
        </section>
      </div>
    </article>
  );
}
