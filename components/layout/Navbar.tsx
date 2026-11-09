import Link from "next/link";
import { NavbarActions } from "@/components/palette/NavbarActions";
import { ChipLogo } from "@/components/ui/icons";
import { site } from "@/content/site";
import { t } from "@/lib/i18n";
import { getProjects } from "@/lib/projects";
import { MobileMenu } from "./MobileMenu";
import { NavbarShell } from "./NavbarShell";
import { navLinks } from "./nav-links";

/**
 * Persistent navbar (SPEC §5). Scroll behaviour (glass after 80px, hide on scroll down) lives in
 * the client `NavbarShell`; the links stay server-rendered. Tools on the right: the ⌘K command
 * palette button and the sound toggle (NavbarActions).
 */
export function Navbar() {
  const paletteData = {
    sections: [
      { id: "hero", label: t.sectionIndex.hero },
      { id: "about", label: t.sections.about.label },
      { id: "projects", label: t.sections.projects.label },
      { id: "skills", label: t.sections.skills.label },
      { id: "experience", label: t.sections.experience.label },
      { id: "contact", label: t.sections.contact.label },
    ],
    projects: getProjects().map((p) => ({
      title: p.title,
      url: p.url,
      summary: p.summary,
      category: p.category.join(" · "),
    })),
  };
  return (
    <NavbarShell>
      <nav
        aria-label={t.a11y.mainNav}
        className="container-site flex h-16 items-center justify-between gap-6"
      >
        {/* Accessible name = the visible name (WCAG 2.5.3); visually hidden on small screens only. */}
        <Link href="/" className="-ms-1 flex min-h-11 items-center gap-2.5 p-1">
          <ChipLogo size={32} />
          <span className="label sr-only text-text sm:not-sr-only">{site.name}</span>
        </Link>

        <div className="flex items-center gap-2">
          <ul className="hidden items-center gap-1 md:flex">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="nav-link">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <NavbarActions data={paletteData} />
          <MobileMenu />
        </div>
      </nav>
    </NavbarShell>
  );
}
