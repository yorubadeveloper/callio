import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { UserNav } from "./user-nav";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";

export async function Header() {
  const session = await auth();

  return (
    <header className="fixed top-2 sm:top-4 left-1/2 z-50 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2">
      <div className="rounded-full border border-border bg-background/80 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-base sm:text-lg">Callio</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            {session?.user ? (
              <UserNav />
            ) : (
              <Button asChild size="sm" className="rounded-full text-xs sm:text-sm">
                <Link href="/signin">Sign In</Link>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
