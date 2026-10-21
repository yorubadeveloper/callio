import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL, operatorAddress } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Refunds and cancellation",
  description:
    "How to cancel your Callio plan, when you can get a refund for unused credits, and your 14-day EU right of withdrawal with a model withdrawal form.",
};

const SECTIONS = [
  { id: "cancel", title: "Cancelling your plan" },
  { id: "refunds", title: "Our refund policy" },
  { id: "request", title: "How to ask for a refund" },
  { id: "withdrawal", title: "Your EU right of withdrawal" },
  { id: "chargebacks", title: "Chargebacks" },
  { id: "form", title: "Model withdrawal form" },
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
    <nav aria-label="On this page" className="mt-8 rounded-[28px] bg-plate p-6 ring-1 ring-line sm:p-7">
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

const { operator, app, refundWindowDays: days } = LEGAL;

const SUMMARY = [
  "Cancel any time. Your plan runs until the end of the period you paid for.",
  `Changed your mind? Within ${days} days of your first subscription payment, we refund the credits you haven’t used.`,
  `Top-up packs are refundable within ${days} days of purchase if you haven’t used them.`,
  "Credits you’ve already used can’t be refunded.",
  "Stripe, our merchant of record, processes every refund back to your original payment method.",
];

export default function RefundsPage() {
  return (
    <article>
      <p className="text-sm text-ink-soft">Last updated {LEGAL.lastUpdatedLabel}</p>
      <h1 className="mt-3 font-display text-[40px] font-medium leading-[1.05] tracking-[-0.035em] sm:text-[52px]">
        Refunds and cancellation
      </h1>

      <section aria-label="Summary" className="mt-8 rounded-[28px] bg-plate p-6 ring-1 ring-line sm:p-8">
        <p className="font-display text-[22px] font-medium tracking-[-0.03em]">In short</p>
        <ul className="mt-4 space-y-3 text-[16.5px] leading-relaxed">
          {SUMMARY.map((line, i) => (
            <li key={line} className="flex gap-3">
              <span
                aria-hidden
                className={`mt-[0.55em] size-2.5 shrink-0 rounded-full ${["bg-coral", "bg-amber", "bg-teal", "bg-peri", "bg-coral"][i]}`}
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <Contents />

      <div className="legal-prose">
        <section id="cancel">
          <Heading id="cancel" />
          <ul>
            <li>
              Cancel at <strong>{app.cancelPlan}</strong>. You don’t need to give a reason, and you can do it at any
              time.
            </li>
            <li>
              Cancellation takes effect at the end of your current billing period (monthly or yearly). Until then
              you keep your plan and its credits. After that, your account moves to the Free plan.
            </li>
            <li>Top-up credits stay in your account after you cancel. They never expire.</li>
            <li>You get a confirmation by email when you cancel.</li>
          </ul>
        </section>

        <section id="refunds">
          <Heading id="refunds" />
          <p>
            On top of your legal rights, we offer a simple refund policy. It applies to everyone, wherever you live.
          </p>
          <h3>Subscriptions</h3>
          <ul>
            <li>
              Within <strong>{days} days of your first payment</strong> for a plan, you can ask for a refund of the
              plan credits you haven’t used. If you haven’t used any, you get the full payment back. If you’ve used
              some, we refund the share of the payment that matches the unused credits.
            </li>
            <li>When we refund a subscription, we also end it, and your account moves to the Free plan.</li>
            <li>
              After those {days} days, and for renewal payments, we don’t give refunds for the current period. Cancel
              any time to stop the next renewal.
            </li>
          </ul>
          <h3>Top-up packs</h3>
          <ul>
            <li>
              Within <strong>{days} days of buying</strong> a top-up pack, you can get a full refund if you haven’t
              used any of its credits.
            </li>
          </ul>
          <h3>What we can’t refund</h3>
          <ul>
            <li>Credits you’ve already used, for calls, computer tasks or anything else.</li>
            <li>Free plan credits, which cost nothing.</li>
            <li>Plan credits that expired at the end of a past credit period.</li>
          </ul>
          <p>
            None of this limits your statutory rights, for example if the service didn’t work as promised.
          </p>
        </section>

        <section id="request">
          <Heading id="request" />
          <ol>
            <li>
              Email <a href={`mailto:${operator.email}`}>{operator.email}</a> from the address you sign in with, or use
              the withdrawal button at <strong>{app.withdrawButton}</strong> if you’re within the withdrawal period.
            </li>
            <li>Tell us what you bought and roughly when. You don’t need to give a reason.</li>
            <li>
              We check your credit usage and confirm the amount. Stripe, as merchant of record, then refunds you to
              your original payment method.
            </li>
          </ol>
          <p>
            We aim to reply within a few working days. Refunds are made at the latest within 14 days of us receiving
            your request. Your bank may take a few more days to show the money.
          </p>
        </section>

        <section id="withdrawal">
          <Heading id="withdrawal" />
          <p>
            If you are a consumer in the EU (or the law of your country gives you a similar right), the following
            applies. Stripe is the merchant of record for your purchase, and we handle withdrawals together with
            Stripe: you can send your withdrawal to us, and we make sure it is processed.
          </p>

          <div className="callout">
            <h3>Withdrawal instructions</h3>
            <p>
              <strong>Right of withdrawal.</strong> You have the right to withdraw from this contract within 14 days
              without giving any reason. The withdrawal period is 14 days from the day the contract is concluded.
            </p>
            <p>
              To exercise your right of withdrawal, you must inform us ({operator.legalName}, {operatorAddress},
              email: {operator.email}) of your decision to withdraw from this contract by a clear statement (for
              example, a letter sent by post or an email). You can also use the withdrawal button in the app at{" "}
              {app.withdrawButton}, and we will confirm receipt without delay on a durable medium, such as email. You
              may use the <a href="#form">model withdrawal form</a> below, but you don’t have to.
            </p>
            <p>
              To meet the withdrawal deadline, it is enough that you send your notice before the withdrawal period
              has expired.
            </p>
            <p>
              <strong>Effects of withdrawal.</strong> If you withdraw from this contract, we will reimburse all
              payments we have received from you without undue delay and no later than 14 days from the day we
              receive your withdrawal notice. We use the same means of payment you used for the original purchase,
              unless you have expressly agreed otherwise. You will not be charged any fees for this refund.
            </p>
            <p>
              If you asked us to start the service during the withdrawal period, you must pay us an amount in
              proportion to what we have already provided up to the moment you tell us you are withdrawing, compared
              with the full scope of the contract.
            </p>
          </div>

          <h3>When the right of withdrawal ends early</h3>
          <p>
            Callio is a digital service, and credits can be used straight away. So at checkout we ask you to
            agree that we start providing the service immediately, before the withdrawal period ends, and to confirm
            that you understand the following:
          </p>
          <ul>
            <li>
              For the <strong>digital service</strong> (your plan and the calls and tasks it provides), your right of
              withdrawal ends once we have provided the service in full (§356(4) BGB). If you withdraw earlier, you
              pay for what you have already used, as explained above.
            </li>
            <li>
              Where a purchase counts as <strong>digital content</strong> delivered in full straight away, your right
              of withdrawal ends once we start providing it with your express consent and your acknowledgement that
              you lose the right (§356(5) BGB).
            </li>
          </ul>
          <p>
            In practice, our <a href="#refunds">refund policy</a> above is usually the more generous option: you get
            back every unused credit within {days} days, without having to explain why.
          </p>
        </section>

        <section id="chargebacks">
          <Heading id="chargebacks" />
          <p>
            Please talk to us before you dispute a payment with your bank or card provider. Most problems are faster
            to fix by email. If you file a chargeback, Stripe handles the dispute as merchant of record. While a
            dispute is open, we may pause paid features on your account. If the dispute is decided in your favour, we
            won’t charge you again for the same purchase.
          </p>
        </section>

        <section id="form">
          <Heading id="form" />
          <p>If you want to withdraw from the contract, you can fill in and send this form. You don’t have to use it.</p>
          <div className="callout font-mono text-[14px] leading-[1.8]">
            <p>
              To: {operator.legalName}, {operatorAddress}, email: {operator.email}
            </p>
            <p>
              I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract for the provision of the
              following service (*) / the supply of the following digital content (*):
            </p>
            <p>______________________________</p>
            <p>Ordered on (*) / received on (*): ____________</p>
            <p>Name of consumer(s): ____________</p>
            <p>Address of consumer(s): ____________</p>
            <p>Email address used for your Callio account: ____________</p>
            <p>Signature of consumer(s) (only if this form is sent on paper): ____________</p>
            <p>Date: ____________</p>
            <p>(*) Delete as appropriate.</p>
          </div>
          <p>
            For our full terms, see the <Link href="/terms">Terms of service</Link>.
          </p>
        </section>
      </div>
    </article>
  );
}
