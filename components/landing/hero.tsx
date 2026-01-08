import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      <DotPattern
        className={cn(
          "absolute inset-0 h-full w-full",
          "text-neutral-300/40 dark:text-neutral-700/40"
        )}
      />
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
          Your Daily Briefing,
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          One Phone Call Away
        </h1>
        <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">
          Call anytime to hear your calendar, weather, and personalized news.
          No app required.
        </p>
        <div className="mt-8 sm:mt-10 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" asChild className="rounded-full w-full sm:w-auto">
            <Link href="/signin">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
