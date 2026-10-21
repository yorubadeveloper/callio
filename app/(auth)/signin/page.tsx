import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LockSimple } from "@phosphor-icons/react/dist/ssr";
import { devLoginEnabled } from "@/auth";
import { DevSignInButton, GoogleSignInButton } from "@/components/auth/google-signin-button";
import { IncomingCalls } from "@/components/auth/incoming-calls";
import { Wordmark } from "@/components/brand/logo";
import { currentUser } from "@/lib/server/backend";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Callio with Google and meet your first agent.",
};

// Auth.js error codes, in words people understand.
const ERRORS: Record<string, string> = {
  AccessDenied: "That Google account couldn't be used. Try one with a verified email.",
  Configuration: "Sign-in is having a moment on our side. Try again in a minute.",
  OAuthCallbackError: "Google didn't finish signing you in. Try again.",
  Default: "Something went wrong signing in. Try again.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; plan?: string; billing?: string }>;
}) {
  const { next, error, plan, billing } = await searchParams;
  // A plan chosen on the pricing page carries through sign-in (and onboarding) to checkout.
  const destination = plan
    ? `/app/billing?${new URLSearchParams({ plan, interval: billing === "yearly" ? "year" : "month" })}`
    : next;
  // Only skip sign-in when the backend still knows this person; a stale cookie must not loop.
  if (await currentUser().catch(() => null)) redirect(destination?.startsWith("/") ? destination : "/app");

  return (
    <div className="grid grid-cols-1 min-h-dvh bg-page font-body text-ink lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section className="flex flex-col px-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-[max(env(safe-area-inset-top),1.25rem)] sm:px-10">
        <Link href="/" className="self-start text-xl" aria-label="Callio home">
          <Wordmark />
        </Link>

        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
          <div className="lg:hidden">
            <IncomingCalls compact />
          </div>
          <h1 className="mt-8 font-display text-[clamp(2.2rem,7vw,3.25rem)] leading-[1.02] font-medium tracking-[-0.04em] lg:mt-0">
            Your agents are ready when you are.
          </h1>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">
            Sign in to name your first agent, give it a voice, and have your first conversation. Free to start, no card
            needed.
          </p>

          {error && (
            <p role="alert" className="mt-6 rounded-2xl bg-coral/15 px-4 py-3 text-[15px] text-ink">
              {ERRORS[error] ?? ERRORS.Default}
            </p>
          )}

          <div className="mt-8">
            <GoogleSignInButton next={destination} />
            {devLoginEnabled && (
              <div className="mt-3">
                <DevSignInButton next={destination} />
              </div>
            )}
          </div>

          <p className="mt-5 flex items-start gap-2 text-[13px] leading-relaxed text-ink-soft">
            <LockSimple className="mt-0.5 shrink-0" />
            <span>
              We only get your name, email and photo from Google. By continuing you agree to our{" "}
              <Link href="/terms" className="text-ink underline underline-offset-4">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-ink underline underline-offset-4">
                Privacy Policy
              </Link>
              .
            </span>
          </p>

          <p className="mt-10 text-[15px] text-ink-soft">
            Not ready?{" "}
            <Link href="/demo/laura" className="font-semibold text-ink underline-offset-4 hover:underline">
              Hear a sample call first
            </Link>
          </p>
        </div>
      </section>

      <aside className="relative hidden overflow-hidden bg-plate lg:flex lg:flex-col lg:items-center lg:justify-center lg:px-12">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="aurora-a absolute -left-1/4 top-[-15%] size-[60vmax] rounded-full bg-teal opacity-25 blur-[110px]" />
          <div className="aurora-b absolute -right-1/4 bottom-[-20%] size-[55vmax] rounded-full bg-coral opacity-20 blur-[120px]" />
          <div className="aurora-a absolute right-[10%] top-[20%] size-[30vmax] rounded-full bg-amber opacity-20 blur-[100px]" />
        </div>
        <div className="relative w-full">
          <IncomingCalls />
          <p className="mx-auto mt-10 max-w-sm text-center text-[15px] text-ink-soft">
            Every agent has a name, a voice and its own memory of you. Make them yours.
          </p>
        </div>
      </aside>
    </div>
  );
}
