import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export function CTA() {
  return (
    <section className="py-32 w-full flex items-center justify-center">
      <div className="text-center px-6 max-w-2xl">
        <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl mb-6">
          Start Your Day Better.
        </h2>
        <p className="text-lg text-muted-foreground font-light mb-10 max-w-xl mx-auto">
          Join now to streamline your mornings with personalized audio briefings.
        </p>
        <Button size="lg" asChild className="rounded-full h-14 px-10 text-lg shadow-none">
          <Link href="/signin" className="flex items-center gap-2">
            Get Started
            <ArrowRight weight="bold" className="h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
