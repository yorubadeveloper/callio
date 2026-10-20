"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Brain, ChatsCircle, Coins, House, type Icon, Monitor, UserCircle, UsersThree } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/brand/logo";
import { plan } from "@/lib/pricing";
import type { User } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: Icon;
  /** Shown in the phone tab bar; the rest live in the desktop sidebar and on screens. */
  tab?: boolean;
}

const NAV: NavItem[] = [
  { href: "/app", label: "Home", icon: House, tab: true },
  { href: "/app/agents", label: "Agents", icon: UsersThree, tab: true },
  { href: "/app/calls", label: "Calls", icon: ChatsCircle, tab: true },
  { href: "/app/memory", label: "Memory", icon: Brain, tab: true },
  { href: "/app/tasks", label: "Tasks", icon: Monitor },
  { href: "/app/billing", label: "Plan & credits", icon: Coins },
  { href: "/app/you", label: "You", icon: UserCircle, tab: true },
];

const isActive = (pathname: string, href: string) =>
  href === "/app" ? pathname === "/app" : pathname.startsWith(href);

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-page font-body text-ink">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line px-4 pb-5 pt-6 lg:flex">
        <Link href="/app" className="px-3 text-xl" aria-label="Callio home">
          <Wordmark />
        </Link>
        <nav className="mt-8 flex flex-col gap-1" aria-label="Main">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-11 items-center gap-3 rounded-full px-3 text-[15px] font-medium transition-colors",
                  active ? "text-page" : "text-ink-soft hover:bg-ink/[0.05] hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="side-active"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                )}
                <item.icon weight={active ? "fill" : "regular"} className="relative text-[20px]" />
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <CreditsCard user={user} />
      </aside>

      {/* phone top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-page/85 px-4 pb-2 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur-md lg:hidden">
        <Link href="/app" className="text-lg" aria-label="Callio home">
          <Wordmark />
        </Link>
        <Link
          href="/app/billing"
          className="flex h-9 items-center gap-1.5 rounded-full bg-plate px-3 text-[14px] font-semibold ring-1 ring-line"
          aria-label={`${user.credits.total} credits left. Plan and credits`}
        >
          <Coins weight="fill" className="text-amber" />
          {user.credits.total}
        </Link>
      </header>

      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-5xl px-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] pt-4 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          {children}
        </main>
      </div>

      {/* phone tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-page/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <ul className="mx-auto flex max-w-md">
          {NAV.filter((n) => n.tab).map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    active ? "text-ink" : "text-ink-soft",
                  )}
                >
                  <motion.span
                    animate={{ scale: active ? 1.08 : 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <item.icon weight={active ? "fill" : "regular"} className="text-[24px]" />
                  </motion.span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function CreditsCard({ user }: { user: User }) {
  const p = plan(user.plan);
  const allowance = p.credits || 1;
  const pct = Math.min(100, Math.round((user.credits.plan / allowance) * 100));
  return (
    <Link
      href="/app/billing"
      className="mt-auto block rounded-[24px] bg-plate p-4 ring-1 ring-line transition-colors hover:ring-ink/20"
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink">{p.name} plan</span>
        <Coins weight="fill" className="text-amber" />
      </div>
      <p className="mt-2 font-display text-[28px] leading-none font-medium tracking-[-0.04em]">
        {user.credits.total}{" "}
        <span className="text-[14px] font-body font-normal tracking-normal text-ink-soft">credits</span>
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-[12px] text-ink-soft">
        {user.plan === "free" ? "Upgrade for monthly credits" : `About ${user.credits.total} minutes of calls`}
      </p>
    </Link>
  );
}
