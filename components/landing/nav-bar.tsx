"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { List, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { EASE_OUT } from "./motion";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#agents", label: "Agents" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function NavBar({ signedIn }: { signedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  // The menu portals into <body>, which only exists after hydration.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const primary = signedIn ? { href: "/app", label: "Open app" } : { href: "/signin", label: "Start free" };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div
        className={cn(
          "transition-[background-color,box-shadow,backdrop-filter] duration-300",
          scrolled || open ? "bg-page/80 shadow-[0_1px_0_var(--line)] backdrop-blur-xl" : "bg-transparent",
        )}
      >
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 pt-[env(safe-area-inset-top)] sm:h-20 sm:px-8">
          <Link href="/" aria-label="Callio home" className="text-[20px] text-ink sm:text-[22px]">
            <Wordmark />
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="rounded-full px-4 py-2 text-[15px] font-medium text-ink-soft transition-colors hover:bg-ink/[0.05] hover:text-ink"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <span className="hidden md:block">
              <ThemeToggle />
            </span>
            {!signedIn && (
              <Link
                href="/signin"
                className="hidden rounded-full px-4 py-2 text-[15px] font-medium text-ink transition-opacity hover:opacity-70 md:block"
              >
                Sign in
              </Link>
            )}
            <Link
              href={primary.href}
              className="rounded-full bg-ink px-4 py-2 text-[14px] font-semibold text-page transition-transform duration-200 hover:-translate-y-px sm:px-5 sm:py-2.5 sm:text-[15px]"
            >
              {primary.label}
            </Link>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="-mr-2 grid size-11 place-items-center rounded-full text-[22px] text-ink md:hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={open ? "x" : "menu"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {open ? <X /> : <List />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </nav>
      </div>

      {/* phone menu, portalled so the nav's entrance transform can't trap it */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-x-0 bottom-0 top-[calc(4rem+env(safe-area-inset-top))] z-[45] flex flex-col bg-page px-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] md:hidden"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: EASE_OUT }}
              >
                <ul className="mt-6 flex flex-col">
                  {LINKS.map((l, i) => (
                    <motion.li
                      key={l.href}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 + i * 0.05, duration: 0.3, ease: EASE_OUT }}
                      className="border-b border-line"
                    >
                      <a
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="block py-4 font-display text-[32px] leading-tight font-medium tracking-[-0.035em] text-ink"
                      >
                        {l.label}
                      </a>
                    </motion.li>
                  ))}
                </ul>
                <div className="mt-auto space-y-3">
                  <div className="flex items-center justify-between rounded-full bg-plate px-5 py-2 ring-1 ring-line">
                    <span className="text-[15px] text-ink-soft">Appearance</span>
                    <ThemeToggle />
                  </div>
                  {!signedIn && (
                    <Link
                      href="/signin"
                      onClick={() => setOpen(false)}
                      className="flex h-14 items-center justify-center rounded-full bg-plate text-[16px] font-semibold text-ink ring-1 ring-line"
                    >
                      Sign in
                    </Link>
                  )}
                  <Link
                    href={primary.href}
                    onClick={() => setOpen(false)}
                    className="flex h-14 items-center justify-center rounded-full bg-ink text-[16px] font-semibold text-page"
                  >
                    {primary.label}
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
