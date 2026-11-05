import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach Callio, and who runs it.",
};

const { operator } = LEGAL;

export default function ContactPage() {
  return (
    <article>
      <p className="text-sm text-ink-soft">Last updated {LEGAL.lastUpdatedLabel}</p>
      <h1 className="mt-3 font-display text-[40px] font-medium leading-[1.05] tracking-[-0.035em] sm:text-[52px]">
        Contact
      </h1>
      <p className="mt-5 text-[18px] text-ink-soft">A real person reads every message.</p>

      <div className="legal-prose">
        <section id="contact">
          <h2>
            <a href="#contact">Get in touch</a>
          </h2>
          <ul>
            <li>
              Help, feedback and anything else: <a href={`mailto:${operator.email}`}>{operator.email}</a>
            </li>
            <li>
              Your data and privacy: <a href={`mailto:${operator.privacyEmail}`}>{operator.privacyEmail}</a>
            </li>
            <li>
              Reporting misuse: <a href={`mailto:${operator.abuseEmail}`}>{operator.abuseEmail}</a>
            </li>
            {operator.phone && <li>Phone: {operator.phone}</li>}
          </ul>
        </section>

        <section id="provider">
          <h2>
            <a href="#provider">Who runs Callio</a>
          </h2>
          <p>
            {operator.legalName}
            <br />
            {operator.legalForm}
            <br />
            Trading as {LEGAL.product}
            {operator.address && (
              <>
                <br />
                {operator.address}
              </>
            )}
          </p>
          {operator.representedBy && <p>Represented by: {operator.representedBy}</p>}
          {operator.register && <p>Register entry: {operator.register}</p>}
          {operator.vatId && <p>VAT ID: {operator.vatId}</p>}
          <p>Responsible for content: {operator.contentResponsible}</p>
          {/* §5 DDG / §18(2) MStV: this section is the site's legal notice (Impressum). Keep it on this page. */}
        </section>

        <section id="payments">
          <h2>
            <a href="#payments">Payments</a>
          </h2>
          <p>
            Purchases are sold and processed by Stripe as merchant of record. Stripe issues invoices and handles tax
            and refunds. See our <Link href="/terms#payments">Terms</Link> and{" "}
            <Link href="/refunds">Refund policy</Link>.
          </p>
        </section>

        <section id="disputes">
          <h2>
            <a href="#disputes">Disputes</a>
          </h2>
          <p>
            If something goes wrong, email us and we will try to fix it. We don’t take part in consumer arbitration
            proceedings.
          </p>
        </section>
      </div>
    </article>
  );
}
