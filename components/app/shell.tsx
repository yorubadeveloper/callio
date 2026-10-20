"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Brain,
  ChatsCircle,
  Coins,
  House,
  type Icon,
  Monitor,
  SidebarSimple,
  PlugsConnected,
  UserCircle,
  UsersThree,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { LogoMark, Wordmark } from "@/components/brand/logo";
import { plan } from "@/lib/pricing";
import type { User } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: Icon;
  /** Shown in the phone tab bar; the rest live in the desktop sidebar and on screens. */
  tab?: boolean;
}

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Talk",
    items: [
      { href: "/app", label: "Home", icon: House, tab: true },
      { href: "/app/agents", label: "Agents", icon: UsersThree, tab: true },
      { href: "/app/calls", label: "Calls", icon: ChatsCircle, tab: true },
    ],
  },
  {
    label: "Yours",
    items: [
      { href: "/app/memory", label: "Memory", icon: Brain, tab: true },
      { href: "/app/tasks", label: "Tasks", icon: Monitor },
      { href: "/app/connections", label: "Connections", icon: PlugsConnected },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/app/billing", label: "Plan & credits", icon: Coins },
      { href: "/app/you", label: "You", icon: UserCircle, tab: true },
    ],
  },
];
const NAV = GROUPS.flatMap((g) => g.items);

const isActive = (pathname: string, href: string) =>
  href === "/app" ? pathname === "/app" : pathname.startsWith(href);

// The desktop sidebar remembers whether it was collapsed, per browser.
const COLLAPSE_KEY = "callio-sidebar-collapsed";
const collapseStore = {
  subscribe(cb: () => void) {
    window.addEventListener("storage", cb);
    window.addEventListener(COLLAPSE_KEY, cb);
    return () => {
      window.removeEventListener("storage", cb);
      window.removeEventListener(COLLAPSE_KEY, cb);
    };
  },
  get() {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  },
  set(value: boolean) {
    try {
      localStorage.setItem(COLLAPSE_KEY, value ? "1" : "0");
    } catch {}
    window.dispatchEvent(new Event(COLLAPSE_KEY));
  },
};

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(collapseStore.subscribe, collapseStore.get, () => false);

  return (
    <div className="min-h-dvh bg-page font-body text-ink">
      {/* desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-plate/40 pb-4 pt-5 backdrop-blur-xl transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] lg:flex",
          collapsed ? "w-[76px] px-3" : "w-64 px-4",
        )}
      >
        <div className={cn("flex items-center", collapsed ? "flex-col gap-3" : "justify-between pl-2")}>
          <Link href="/app" aria-label="Callio home" className="text-xl">
            {collapsed ? <LogoMark className="size-8" /> : <Wordmark />}
          </Link>
          <button
            type="button"
            onClick={() => collapseStore.set(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="grid size-9 place-items-center rounded-full text-[18px] text-ink-soft transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            <SidebarSimple />
          </button>
        </div>

        <nav className="mt-8 flex flex-col gap-6" aria-label="Main">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p
                className={cn(
                  "mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-soft/70 transition-opacity",
                  collapsed && "sr-only",
                )}
              >
                {group.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <SideLink item={item} active={isActive(pathname, item.href)} collapsed={collapsed} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-auto space-y-2">
          <CreditsCard user={user} collapsed={collapsed} />
          <ProfileChip user={user} collapsed={collapsed} />
        </div>
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

      <div
        className={cn(
          "transition-[padding] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
          collapsed ? "lg:pl-[76px]" : "lg:pl-64",
        )}
      >
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

function SideLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex h-11 items-center gap-3 rounded-full text-[15px] font-medium transition-colors",
        collapsed ? "justify-center" : "px-3",
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
      <item.icon weight={active ? "fill" : "regular"} className="relative shrink-0 text-[20px]" />
      {!collapsed && <span className="relative truncate">{item.label}</span>}
      {collapsed && (
        <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-[13px] font-medium text-page opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
          {item.label}
        </span>
      )}
    </Link>
  );
}

function CreditsCard({ user, collapsed }: { user: User; collapsed: boolean }) {
  const p = plan(user.plan);
  const allowance = p.credits || 1;
  const pct = Math.min(100, Math.round((user.credits.plan / allowance) * 100));

  if (collapsed) {
    return (
      <Link
        href="/app/billing"
        aria-label={`${user.credits.total} credits. Plan and credits`}
        className="flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[12px] font-semibold transition-colors hover:bg-ink/[0.05]"
      >
        <Coins weight="fill" className="text-[20px] text-amber" />
        {user.credits.total}
      </Link>
    );
  }
  return (
    <Link
      href="/app/billing"
      className="block rounded-[22px] bg-plate p-4 ring-1 ring-line transition-shadow hover:shadow-[0_12px_30px_-20px_rgb(0_0_0/0.4)]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold">{p.name} plan</span>
        <Coins weight="fill" className="text-amber" />
      </div>
      <p className="mt-2 font-display text-[28px] leading-none font-medium tracking-[-0.04em]">
        {user.credits.total}
        <span className="ml-1.5 font-body text-[13px] font-normal tracking-normal text-ink-soft">credits</span>
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-[12px] text-ink-soft">
        {user.plan === "free" ? "Upgrade for monthly credits →" : `About ${user.credits.total} minutes of calls`}
      </p>
    </Link>
  );
}

function ProfileChip({ user, collapsed }: { user: User; collapsed: boolean }) {
  const name = user.nickname || user.name.split(" ")[0];
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <Link
      href="/app/you"
      aria-label={collapsed ? `${name}, your profile` : undefined}
      className={cn(
        "flex items-center gap-3 rounded-full transition-colors hover:bg-ink/[0.05]",
        collapsed ? "justify-center py-1.5" : "py-1.5 pl-1.5 pr-3",
      )}
    >
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- Google profile photo, already sized
        <img
          src={user.image}
          alt=""
          className="size-9 shrink-0 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-peri text-[13px] font-semibold text-[#121212]">
          {initials}
        </span>
      )}
      {!collapsed && (
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-semibold">{name}</span>
          <span className="block truncate text-[12px] text-ink-soft">{user.email}</span>
        </span>
      )}
    </Link>
  );
}
