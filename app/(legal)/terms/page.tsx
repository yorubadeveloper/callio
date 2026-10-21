import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL, operatorAddress } from "@/lib/legal";
import { CREDIT_COSTS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The terms for using Callio's AI voice agents: accounts, credits and subscriptions, payments through Stripe, acceptable use, liability and your rights.",
};

const SECTIONS = [
  { id: "agreement", title: "About these terms" },
  { id: "service", title: "The service" },
  { id: "accounts", title: "Your account" },
  { id: "ai", title: "Talking to AI: important limits" },
  { id: "acceptable-use", title: "Acceptable use" },
  { id: "computer-tasks", title: "Computer tasks" },
  { id: "credits", title: "Credits and subscriptions" },
  { id: "payments", title: "Payments through Stripe" },
  { id: "withdrawal", title: "Right of withdrawal and refunds" },
  { id: "content", title: "Your content and our IP" },
  { id: "availability", title: "Availability and changes to the service" },
  { id: "liability", title: "Liability" },
  { id: "termination", title: "Ending the contract" },
  { id: "law", title: "Governing law and disputes" },
  { id: "changes", title: "Changes to these terms" },
  { id: "contact", title: "Contact" },
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

const { operator, age, app, noticeDays } = LEGAL;

export default function TermsPage() {
  return (
    <article>
      <p className="text-sm text-ink-soft">Last updated {LEGAL.lastUpdatedLabel}</p>
      <h1 className="mt-3 font-display text-[40px] font-medium leading-[1.05] tracking-[-0.035em] sm:text-[52px]">
        Terms of service
      </h1>
      <p className="mt-5 text-[18px] text-ink-soft">
        These terms are the agreement between you and us when you use Callio. We’ve tried to keep them short and
        clear. Please read them, especially the parts about AI limits, acceptable use and credits.
      </p>

      <Contents />

      <div className="legal-prose">
        <section id="agreement">
          <Heading id="agreement" />
          <p>
            Callio ({LEGAL.domain}) is run by {operator.legalName}, {operatorAddress} (“we”, “us”). By creating an
            account or using Callio, you agree to these terms, our{" "}
            <Link href="/acceptable-use">Acceptable use policy</Link> and our{" "}
            <Link href="/refunds">Refund and cancellation policy</Link>. Our{" "}
            <Link href="/privacy">Privacy policy</Link> explains how we handle your data.
          </p>
          <p>
            If you are a consumer, nothing in these terms takes away rights you have under the mandatory consumer
            laws of the country where you live.
          </p>
        </section>

        <section id="service">
          <Heading id="service" />
          <p>
            Callio gives you AI voice agents, named characters such as Laura and Theo, that you can talk to in voice
            calls in your browser. Depending on your plan, agents can:
          </p>
          <ul>
            <li>remember facts about you between calls, and import memory you paste from other AI assistants;</li>
            <li>keep text transcripts and short summaries of your calls;</li>
            <li>schedule calls and reminders, delivered as browser notifications;</li>
            <li>search the web and look up things like the weather;</li>
            <li>do computer tasks: control a cloud browser to fill in forms, book or compare things for you.</li>
          </ul>
          <p>
            We plan to add real phone calls and agents that call businesses for you. Extra terms may apply when those
            features launch, and we will show them to you before you use them.
          </p>
        </section>

        <section id="accounts">
          <Heading id="accounts" />
          <ul>
            <li>You sign in with your Google account. Keep that account secure, because it is the key to Callio.</li>
            <li>
              You must be at least <strong>{age.minimum}</strong> years old to use Callio. If you are under{" "}
              {age.purchasesWithoutConsent}, you may only buy a plan or top-up with permission from a parent or
              guardian.
            </li>
            <li>One account per person. Don’t share your account or let others use it in your name.</li>
            <li>You are responsible for what happens in your account, including instructions you give your agents.</li>
          </ul>
        </section>

        <section id="ai">
          <Heading id="ai" />
          <div className="callout">
            <p>
              <strong>Callio agents are AI, not people.</strong> They can misunderstand you, get facts wrong, forget
              things or sound more confident than they should. Check anything important before you rely on it.
            </p>
          </div>
          <ul>
            <li>
              <strong>Not for emergencies.</strong> Callio cannot call emergency services and is not an emergency
              service. If you or someone else is in danger, call your local emergency number (112 in the EU, 911 in
              the US) directly.
            </li>
            <li>
              <strong>Not professional advice.</strong> Agents don’t give medical, legal, financial, tax or
              psychological advice. Anything they say on those topics is general information only. Talk to a
              qualified professional.
            </li>
            <li>
              <strong>Not a crisis service.</strong> If you are struggling, please contact a local crisis line or a
              person you trust.
            </li>
            <li>
              <strong>You decide.</strong> You are responsible for the decisions you make and the actions you take
              based on what an agent says or does.
            </li>
          </ul>
        </section>

        <section id="acceptable-use">
          <Heading id="acceptable-use" />
          <p>You agree not to use Callio, or ask an agent, to:</p>
          <ul>
            <li>harass, threaten, bully, stalk or deceive anyone;</li>
            <li>do anything illegal, including illegal calls or recordings;</li>
            <li>impersonate a real person or organisation, or make an agent pretend to be human;</li>
            <li>make robocalls, spam, bulk or unsolicited calls or telemarketing;</li>
            <li>call or contact people who haven’t agreed to it where their consent is required by law;</li>
            <li>scrape websites in bulk or abuse websites through computer tasks;</li>
            <li>get around paywalls, CAPTCHAs, rate limits, access controls or other security measures;</li>
            <li>create sexual content involving minors, or content that promotes violence or hatred;</li>
            <li>attack, overload, reverse engineer or resell Callio, or try to get around credit limits.</li>
          </ul>
          <p>
            The full rules, and how we disclose that agents are AI, are in our{" "}
            <Link href="/acceptable-use">Acceptable use policy</Link>. If you break them, we may stop a task,
            suspend features or close your account (see <a href="#termination">Ending the contract</a>).
          </p>
        </section>

        <section id="computer-tasks">
          <Heading id="computer-tasks" />
          <p>On paid plans, an agent can control a cloud browser to carry out tasks you describe.</p>
          <ul>
            <li>
              <strong>You are responsible for your instructions.</strong> Only ask for tasks you are allowed to do
              yourself, on websites whose terms allow it.
            </li>
            <li>
              <strong>No passwords or payment details.</strong> The agent will not enter passwords, card numbers or
              other payment details. If a task needs them, it stops and hands over to you.
            </li>
            <li>
              <strong>You approve sensitive steps.</strong> Before the agent submits a form, makes a booking or does
              anything with real-world consequences, it asks you to approve. Check the details before you do.
            </li>
            <li>
              <strong>Third-party websites.</strong> We don’t control the websites the agent visits. Their terms and
              prices apply, and any booking or contract you make there is between you and them.
            </li>
            <li>
              <strong>Results can be wrong.</strong> A task can fail, stop halfway or produce a wrong result. Check
              the outcome.
            </li>
          </ul>
        </section>

        <section id="credits">
          <Heading id="credits" />
          <h3>How credits work</h3>
          <ul>
            <li>
              Callio runs on credits. One credit equals {CREDIT_COSTS.onlineMinute} minute of an in-app call. A
              computer task costs from {CREDIT_COSTS.computerTaskFrom} credits, and longer tasks cost more. Current
              costs are shown in the app and on our pricing page before you use them.
            </li>
            <li>
              The <strong>Free</strong> plan gives you a one-time starter amount of credits. Paid plans (Personal,
              Plus and Pro) give you a set number of credits each month, monthly or billed yearly.
            </li>
            <li>
              <strong>Plan credits</strong> reset at the start of each monthly credit period. Unused plan credits
              don’t roll over and expire at the end of the period.
            </li>
            <li>
              <strong>Top-up credits</strong> you buy separately never expire while your account exists.
            </li>
            <li>
              Credits have no cash value. They can’t be exchanged for money, transferred or sold, except for refunds
              under our <Link href="/refunds">Refund policy</Link> or the law.
            </li>
          </ul>
          <h3>Renewal and cancellation</h3>
          <ul>
            <li>
              Subscriptions renew automatically at the end of each billing period (monthly or yearly) until you
              cancel.
            </li>
            <li>
              You can cancel at any time at <strong>{app.cancelPlan}</strong>. Cancellation takes effect at the end
              of the current billing period. You keep your plan and plan credits until then. Top-up credits stay in
              your account.
            </li>
          </ul>
          <h3>Price changes</h3>
          <p>
            Prices are shown before you buy. If we want to change the price of your subscription, we will tell you
            by email at least {noticeDays} days before the change. The new price only applies to you if you agree.
            If you don’t agree, your subscription continues at the old price until the end of the current period,
            and we may then end it. Price changes never apply to a period you have already paid for.
          </p>
        </section>

        <section id="payments">
          <Heading id="payments" />
          <p>
            Purchases are handled by <strong>Stripe</strong> through Stripe Managed Payments. Stripe (via Link) acts
            as the <strong>merchant of record</strong>: it sells the plan or top-up to you, takes the payment,
            calculates and collects VAT or sales tax, issues your invoices and processes refunds.
          </p>
          <ul>
            <li>Stripe’s own terms apply to the purchase. You will see them at checkout.</li>
            <li>We never see or store your card details.</li>
            <li>Prices may include or add VAT or sales tax depending on where you live. Checkout shows the total.</li>
            <li>If a renewal payment fails and can’t be collected, your paid plan may end.</li>
          </ul>
        </section>

        <section id="withdrawal">
          <Heading id="withdrawal" />
          <p>
            If you are a consumer in the EU, you have a legal right to withdraw from a purchase within 14 days. Our{" "}
            <Link href="/refunds">Refund and cancellation policy</Link> explains this right, when it ends, how to use
            it (including the in-app withdrawal button and a model form) and our more generous refund rules.
          </p>
        </section>

        <section id="content">
          <Heading id="content" />
          <ul>
            <li>
              <strong>Your content stays yours.</strong> What you say, the memory you import, your instructions and
              the transcripts of your calls belong to you (or whoever owns them).
            </li>
            <li>
              <strong>The licence you give us is small.</strong> You let us store, copy, process and send your
              content only as needed to run Callio for you: to hold calls, keep memory and transcripts, run
              schedules and tasks, and keep the service secure. This licence ends when you delete the content or your
              account, except for backups that expire on their normal schedule and anything we must keep by law.
            </li>
            <li>We don’t use your content to train AI models.</li>
            <li>
              <strong>Our IP.</strong> Callio, its software, design, logo and agent characters belong to us. You may
              use them only as part of the service.
            </li>
            <li>
              Make sure you have the right to share what you give us, such as imported memory or information about
              other people.
            </li>
          </ul>
        </section>

        <section id="availability">
          <Heading id="availability" />
          <p>
            We work hard to keep Callio running, but we can’t promise it will always be available or error-free. It
            depends on providers such as Google’s AI services. We may pause the service for maintenance, security or
            reasons outside our control.
          </p>
          <p>
            We may improve, change or remove features. If a change significantly reduces a paid feature you rely on,
            we will tell you in advance, and you can cancel. If you paid in advance for a period you then can’t use,
            we will refund the unused part.
          </p>
        </section>

        <section id="liability">
          <Heading id="liability" />
          <ul>
            <li>
              We are liable without limitation for damage caused intentionally or by gross negligence, for injury to
              life, body or health, under the German Product Liability Act (Produkthaftungsgesetz), and where we have
              given a guarantee.
            </li>
            <li>
              If we breach an <strong>essential obligation</strong> through slight negligence, our liability is
              limited to the damage that is typical and foreseeable for this kind of contract. Essential obligations
              are those that make the contract possible in the first place and that you may normally rely on.
            </li>
            <li>Otherwise, we are not liable for slight negligence.</li>
            <li>These limits also apply to our employees, representatives and contractors.</li>
          </ul>
          <p>
            Because agents are AI and can make mistakes (see <a href="#ai">Talking to AI</a>), please check important
            information and approve computer task steps carefully.
          </p>
        </section>

        <section id="termination">
          <Heading id="termination" />
          <ul>
            <li>
              <strong>You</strong> can stop using Callio and delete your account at any time at{" "}
              <strong>{app.deleteAccount}</strong>. Deleting your account cancels your subscription at the end of the
              current period. Unused credits are lost, unless you are entitled to a refund.
            </li>
            <li>
              <strong>We</strong> can end the contract for the Free plan at any time, and for paid plans with{" "}
              {noticeDays} days’ notice at the end of a billing period. We will refund anything you paid in advance
              for time after the end date.
            </li>
            <li>
              We can suspend or close an account immediately for serious reasons, such as illegal use, harassment,
              fraud, a serious or repeated breach of our acceptable use rules, or risks to others. Where reasonable,
              we will warn you first and let you fix the problem.
            </li>
            <li>Before we close an account, we give you a chance to export your data, unless the law prevents it.</li>
          </ul>
        </section>

        <section id="law">
          <Heading id="law" />
          <ul>
            <li>
              These terms are governed by the law of the Federal Republic of Germany, excluding the UN Convention on
              Contracts for the International Sale of Goods (CISG).
            </li>
            <li>
              If you are a consumer, you also keep the protection of the mandatory laws of the country where you
              usually live, and you can bring claims in the courts there.
            </li>
            <li>
              If you are a business, the courts at our place of business have jurisdiction, as far as the law allows.
            </li>
            <li>
              <strong>Consumer dispute resolution.</strong> We are not obliged and not willing to take part in dispute
              resolution proceedings before a consumer arbitration board (§36 VSBG). Please contact us directly; we
              want to fix problems.
            </li>
            <li>
              The European Commission’s online dispute resolution (ODR) platform was discontinued on 20 July 2025, so
              we no longer refer to it.
            </li>
          </ul>
        </section>

        <section id="changes">
          <Heading id="changes" />
          <p>
            We may update these terms, for example when we add features like phone calls or when the law changes. We
            will tell you about important changes by email or in the app at least {noticeDays} days before they take
            effect. If a change affects your existing rights or obligations to your disadvantage, it only applies to
            you if you agree. If you don’t agree, you can cancel, and we may end your subscription at the end of the
            current period. Small changes that don’t disadvantage you, such as clarifications, apply from the date
            shown at the top.
          </p>
          <p>If any part of these terms is invalid, the rest stays valid.</p>
        </section>

        <section id="contact">
          <Heading id="contact" />
          <p>
            Questions about these terms? Email <a href={`mailto:${operator.email}`}>{operator.email}</a> or write to{" "}
            {operator.legalName}, {operatorAddress}. More details are in our <Link href="/imprint">imprint</Link>.
          </p>
        </section>
      </div>
    </article>
  );
}
