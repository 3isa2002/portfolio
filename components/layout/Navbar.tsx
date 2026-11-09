import Link from "next/link";
import { ChipLogo } from "@/components/ui/icons";
import { site } from "@/content/site";
import { t } from "@/lib/i18n";
import { MobileMenu } from "./MobileMenu";
import { navLinks } from "./nav-links";

/**
 * Persistent navbar (SPEC §5). Phase 1: static glass bar.
 * Phase 2 adds hide-on-scroll-down; Phase 6 adds the ⌘K hint and the sound toggle.
 */
export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/75 backdrop-blur-md">
      <nav
        aria-label={t.a11y.mainNav}
        className="container-site flex h-16 items-center justify-between gap-6"
      >
        {/* Accessible name = the visible name (WCAG 2.5.3); visually hidden on small screens only. */}
        <Link href="/" className="-ms-1 flex min-h-11 items-center gap-2.5 p-1">
          <ChipLogo size={32} />
          <span className="label sr-only text-text sm:not-sr-only">{site.name}</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="nav-link">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <MobileMenu />
      </nav>
    </header>
  );
}
