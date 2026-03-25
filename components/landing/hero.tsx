import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] w-full items-center justify-center overflow-hidden bg-background">
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 text-center">
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl text-foreground">
          Your Daily Briefing,
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          Just a Call Away.
        </h1>
        <p className="mx-auto mt-6 sm:mt-8 max-w-2xl text-lg text-muted-foreground sm:text-xl font-light leading-relaxed">
          Experience a calmer start to your day. Hear your calendar, weather, and curated news without looking at a screen.
        </p>
        <div className="mt-10 sm:mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" asChild className="rounded-full h-12 px-8 text-base">
            <Link href="/signin" className="flex items-center gap-2">
              Get Started
              <ArrowRight weight="bold" className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
