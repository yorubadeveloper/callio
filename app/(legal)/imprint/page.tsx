import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Imprint",
  description: "Legal notice (Impressum) for Callio under §5 DDG and §18(2) MStV.",
};

const { operator } = LEGAL;

export default function ImprintPage() {
  return (
    <article>
      <p className="text-sm text-ink-soft">Last updated {LEGAL.lastUpdatedLabel}</p>
      <h1 className="mt-3 font-display text-[40px] font-medium leading-[1.05] tracking-[-0.035em] sm:text-[52px]">
        Imprint <span className="text-ink-soft">(Impressum)</span>
      </h1>
      <p className="mt-5 text-[18px] text-ink-soft">Information under §5 of the German Digital Services Act (DDG).</p>

      <div className="legal-prose">
        <section id="provider">
          <h2>
            <a href="#provider">Service provider (Diensteanbieter)</a>
          </h2>
          <p>
            {operator.legalName}
            <br />
            {operator.legalForm}
            <br />
            Trading as {LEGAL.product}
            <br />
            {operator.street}
            <br />
            {operator.postcodeCity}
            <br />
            {operator.country}
          </p>
          <p>Represented by (Vertreten durch): {operator.representedBy}</p>
        </section>

        <section id="contact">
          <h2>
            <a href="#contact">Contact (Kontakt)</a>
          </h2>
          <p>
            Email: <a href={`mailto:${operator.email}`}>{operator.email}</a>
            <br />
            Phone: {operator.phone}
          </p>
        </section>

        <section id="register">
          <h2>
            <a href="#register">Register entry (Registereintrag)</a>
          </h2>
          <p>{operator.register}</p>
        </section>

        <section id="vat">
          <h2>
            <a href="#vat">VAT ID (Umsatzsteuer-Identifikationsnummer)</a>
          </h2>
          <p>VAT identification number under §27a of the German VAT Act (UStG): {operator.vatId}</p>
        </section>

        <section id="responsible">
          <h2>
            <a href="#responsible">Responsible for content (Verantwortlich für den Inhalt nach §18 Abs. 2 MStV)</a>
          </h2>
          <p>{operator.contentResponsible}</p>
        </section>

        <section id="disputes">
          <h2>
            <a href="#disputes">Consumer dispute resolution (Verbraucherstreitbeilegung)</a>
          </h2>
          <p>
            We are not obliged and not willing to take part in dispute resolution proceedings before a consumer
            arbitration board (§36 VSBG). If something goes wrong, please email us and we will try to fix it.
          </p>
        </section>

        <section id="payments">
          <h2>
            <a href="#payments">Payments (Zahlungsabwicklung)</a>
          </h2>
          <p>
            Purchases on Callio are sold and processed by Stripe (via Link) as merchant of record. Stripe issues
            invoices and handles tax and refunds. See our <Link href="/terms#payments">Terms</Link> and{" "}
            <Link href="/refunds">Refund policy</Link>.
          </p>
        </section>

        <section id="links">
          <h2>
            <a href="#links">Liability for links (Haftung für Links)</a>
          </h2>
          <p>
            Our site contains links to external websites. We have no control over their content and are not
            responsible for it. The provider or operator of a linked page is always responsible for its content. If
            we become aware of a legal violation on a linked page, we will remove the link.
          </p>
        </section>
      </div>
    </article>
  );
}
