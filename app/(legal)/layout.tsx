import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { LEGAL } from "@/lib/legal";

// Shared typography for every legal page. Pages write plain semantic HTML
// (h2/h3/p/ul/table) inside <div className="legal-prose"> and get styled here.
// This CSS is unlayered, so it beats Tailwind utilities inside .legal-prose:
// keep Tailwind-styled UI (title, table of contents) outside that wrapper and
// use the .callout class for boxed paragraphs.
const PROSE_CSS = `
.legal-prose { font-size: 16.5px; line-height: 1.7; }
.legal-prose > section { scroll-margin-top: 6rem; }
.legal-prose h2 {
  margin-top: 3.5rem; font-family: var(--font-instrument), ui-sans-serif, system-ui, sans-serif; font-weight: 500;
  font-size: 1.625rem; line-height: 1.2; letter-spacing: -0.035em; color: var(--ink);
}
.legal-prose h2 > a:not(.plain) { color: inherit; text-decoration: none; }
.legal-prose h2 > a:hover::after { content: " #"; color: #F17660; }
.legal-prose h3 {
  margin-top: 2rem; font-family: var(--font-instrument), ui-sans-serif, system-ui, sans-serif; font-weight: 500;
  font-size: 1.1875rem; line-height: 1.3; letter-spacing: -0.02em; color: var(--ink);
}
.legal-prose p, .legal-prose ul, .legal-prose ol, .legal-prose table, .legal-prose blockquote { margin-top: 1rem; }
.legal-prose ul { list-style: disc; padding-left: 1.25rem; }
.legal-prose ol { list-style: decimal; padding-left: 1.25rem; }
.legal-prose li { margin-top: 0.4rem; padding-left: 0.15rem; }
.legal-prose li::marker { color: var(--ink-soft); }
.legal-prose strong { font-weight: 600; color: var(--ink); }
.legal-prose a:not(.plain) {
  text-decoration: underline; text-decoration-color: var(--line);
  text-decoration-thickness: 1.5px; text-underline-offset: 4px;
}
.legal-prose a:not(.plain):hover { text-decoration-color: currentColor; }
.legal-prose .table-wrap { margin-top: 1rem; overflow-x: auto; border-radius: 20px; box-shadow: 0 0 0 1px var(--line); background: var(--plate); }
.legal-prose table { width: 100%; min-width: 640px; border-collapse: collapse; font-size: 14.5px; line-height: 1.5; margin-top: 0; }
.legal-prose th { text-align: left; font-weight: 600; color: var(--ink); padding: 0.75rem 1rem; border-bottom: 1px solid var(--line); vertical-align: bottom; }
.legal-prose td { padding: 0.75rem 1rem; border-top: 1px solid var(--line); vertical-align: top; color: var(--ink-soft); }
.legal-prose tr:first-child td { border-top: 0; }
.legal-prose td:first-child { color: var(--ink); font-weight: 500; }
.legal-prose .callout { margin-top: 1.5rem; padding: 1.5rem; border-radius: 28px; background: var(--plate); box-shadow: 0 0 0 1px var(--line); }
.legal-prose .callout > :first-child { margin-top: 0; }
.legal-prose .callout h3 { margin-top: 0; }
.legal-prose .status { display: block; margin-top: 0.25rem; font-size: 12.5px; font-weight: 400; color: var(--ink-soft); }
.legal-prose blockquote { border-left: 3px solid var(--line); padding-left: 1rem; color: var(--ink-soft); }
`;

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-page font-body text-ink">
      <style href="callio-legal-prose" precedence="default">
        {PROSE_CSS}
      </style>

      <header className="sticky top-0 z-40 border-b border-line bg-page/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-0">
          <Link href="/" aria-label="Callio home" className="w-fit text-xl text-ink">
            <Wordmark />
          </Link>
          <nav aria-label="Legal pages" className="-mx-4 min-w-0 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <ul className="flex gap-1 whitespace-nowrap text-[14px] text-ink-soft">
              {LEGAL.pages.map((page) => (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className="block rounded-full px-3 py-1.5 transition-colors hover:bg-plate hover:text-ink"
                  >
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-[720px] flex-1 px-4 pb-24 pt-10 sm:px-6 sm:pt-16">
        {children}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link href="/" aria-label="Callio home" className="w-fit">
            <Wordmark className="text-lg text-ink" />
          </Link>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL.pages.map((page) => (
              <Link key={page.href} href={page.href} className="hover:text-ink">
                {page.label}
              </Link>
            ))}
          </nav>
          <p>© 2026 Callio · {LEGAL.domain}</p>
        </div>
      </footer>
    </div>
  );
}
