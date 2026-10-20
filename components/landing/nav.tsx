import Link from "next/link";
import { auth } from "@/auth";
import { Wordmark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AfterIntro } from "./motion";

export async function LandingNav() {
  const session = await auth();
  const signedIn = Boolean(session?.user);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-page/80 backdrop-blur-md">
      <AfterIntro y={-14} delay={0.6}>
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6">
          <Link href="/" aria-label="Callio home" className="text-xl text-ink sm:text-[22px]">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-1 sm:gap-3">
            <ThemeToggle />
            {!signedIn && (
              <Link
                href="/signin"
                className="hidden rounded-full px-3 py-2 text-[15px] font-medium text-ink hover:opacity-70 sm:block"
              >
                Sign in
              </Link>
            )}
            <Link
              href={signedIn ? "/dashboard" : "/signin"}
              className="rounded-full bg-ink px-4 py-2.5 text-[14px] font-semibold text-page transition-transform hover:-translate-y-px sm:px-5 sm:text-[15px]"
            >
              {signedIn ? "Open dashboard" : "Start free"}
            </Link>
          </div>
        </nav>
      </AfterIntro>
    </header>
  );
}
