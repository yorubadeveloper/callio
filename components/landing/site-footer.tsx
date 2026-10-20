import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { LogoMark, Wordmark } from "@/components/brand/logo";
import { LEGAL } from "@/lib/legal";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#how", label: "How it works" },
      { href: "/#agents", label: "Agents" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: `mailto:${LEGAL.operator.email}`, label: "Contact" },
      { href: "/imprint", label: "Imprint" },
      { href: "/acceptable-use", label: "Acceptable use" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/refunds", label: "Refunds" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-10 pt-16 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:pt-20">
        <div className="max-w-xs">
          <Link href="/" aria-label="Callio home" className="text-[22px] text-ink">
            <Wordmark />
          </Link>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
            Personal AI agents with names, voices and memory. They call when it matters and pick up when you ring.
          </p>
          <Link
            href="/demo/laura"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-plate px-4 py-2.5 text-[14px] font-semibold text-ink ring-1 ring-line transition-colors hover:ring-ink/30"
          >
            Try a sample call <ArrowUpRight weight="bold" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:contents">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-[15px] text-ink transition-opacity hover:opacity-60">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-3 border-t border-line px-5 py-6 text-[13px] text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>© {new Date().getFullYear()} Callio. All agents are AI, and they&apos;ll always tell you so.</p>
        <p className="flex items-center gap-1.5">
          <LogoMark className="size-3.5" /> callio.site
        </p>
      </div>

      {/* oversized wordmark, cropped by the page edge */}
      <p
        aria-hidden
        className="pointer-events-none -mb-[0.22em] select-none text-center font-display text-[27vw] leading-[0.85] font-medium tracking-[-0.07em] text-ink/[0.07] md:text-[22vw]"
      >
        callio
      </p>
    </footer>
  );
}
