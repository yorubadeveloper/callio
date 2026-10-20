import type { Metadata } from "next";
import { CallStage } from "@/components/landing/call-stage";
import { Closing } from "@/components/landing/closing";
import { DialHero } from "@/components/landing/dial-hero";
import { Manifesto } from "@/components/landing/manifesto";
import { Memory } from "@/components/landing/memory";
import { LandingShell } from "@/components/landing/motion";
import { LandingNav } from "@/components/landing/nav";
import { Faq } from "@/components/landing/faq";
import { Pricing } from "@/components/landing/pricing";
import { SiteFooter } from "@/components/landing/site-footer";
import { StructuredData } from "@/components/landing/structured-data";
import { Templates } from "@/components/landing/templates";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-page font-body text-ink">
      <StructuredData />
      <LandingShell>
        <LandingNav />
        <main>
          <DialHero />
          <Manifesto />
          <CallStage />
          <Memory />
          <Templates />
          <Pricing />
          <Faq />
          <Closing />
        </main>
        <SiteFooter />
      </LandingShell>
    </div>
  );
}
