import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="border-t border-border py-24 w-full">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to Start?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Set up your account in minutes. Start getting your daily briefings today.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link href="/signin">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
