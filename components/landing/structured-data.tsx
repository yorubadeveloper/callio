import { FAQ } from "@/lib/faq";
import { PLANS } from "@/lib/pricing";

const BASE = "https://callio.site";

// Schema.org data for search engines: who we are, what the app is and costs, and the FAQ.
const data = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE}/#organization`,
      name: "Callio",
      url: BASE,
      logo: `${BASE}/brand/icon-512.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${BASE}/#website`,
      name: "Callio",
      url: BASE,
      publisher: { "@id": `${BASE}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: "Callio",
      url: BASE,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web, iOS, Android",
      description:
        "Personal AI voice agents with names, voices and memory. They call you with what matters, answer when you call, and get things done for you.",
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "USD",
        lowPrice: 0,
        highPrice: Math.max(...PLANS.map((p) => p.monthly)),
        offerCount: PLANS.length,
      },
      publisher: { "@id": `${BASE}/#organization` },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      // Static, trusted content built from our own constants.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
