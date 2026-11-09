import { Mail } from "lucide-react";
import { site } from "@/content/site";
import { PaletteHint } from "@/components/palette/PaletteHint";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/icons";
import { t } from "@/lib/i18n";

/** Evaluated once at build time, so it is the deploy date of the static export. */
const buildDate = new Date().toISOString().slice(0, 10);

export function Footer() {
  const socials = [
    { href: site.links.github, label: t.contact.github, icon: <GitHubIcon size={18} /> },
    { href: site.links.linkedin, label: t.contact.linkedin, icon: <LinkedInIcon size={18} /> },
    { href: `mailto:${site.email}`, label: t.contact.email, icon: <Mail size={18} aria-hidden /> },
  ].filter((s) => s.href);

  return (
    <footer className="border-t border-line">
      <div className="container-site flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-xs text-dim">
          {t.footer.builtBy} {site.name} · {site.location.split(",")[0]} · {t.footer.lastDeploy}{" "}
          <time dateTime={buildDate}>{buildDate}</time> · <PaletteHint />
        </p>
        <ul aria-label={t.a11y.social} className="-ms-3 flex items-center gap-1 sm:ms-0 sm:-me-3">
          {socials.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                aria-label={s.label}
                className="grid size-11 place-items-center rounded-card text-dim transition-colors hover:text-text"
                {...(s.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                {s.icon}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
