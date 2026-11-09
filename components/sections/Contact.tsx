import { Download, Mail, MessageCircle } from "lucide-react";
import { CopyEmail } from "@/components/ui/CopyEmail";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { site } from "@/content/site";
import { t } from "@/lib/i18n";

/** The commands the Phase 6 interactive terminal will accept. Shown as static `help` output for now. */
const commands = Object.entries(t.contact.commands);

/**
 * Section 6 — Contact (SPEC §5.6). Phase 1: a static terminal panel + plain buttons.
 * Phase 6 makes the terminal interactive (typing, history, tab completion).
 */
export function Contact() {
  const external = { target: "_blank", rel: "noreferrer" } as const;
  return (
    <section id="contact" aria-labelledby="contact-title" className="section">
      <div className="container-site">
        <SectionHeading
          index={6}
          label={t.sections.contact.label}
          title={t.sections.contact.title}
          id="contact-title"
        />

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="card overflow-hidden lg:col-span-7">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <span aria-hidden className="size-2.5 rounded-full bg-white/15" />
              <span aria-hidden className="size-2.5 rounded-full bg-white/15" />
              <span aria-hidden className="size-2.5 rounded-full bg-white/15" />
              <span className="ms-2 font-mono text-xs text-dim">{t.contact.terminalTitle}</span>
            </div>
            <div className="p-5 font-mono text-sm leading-7 sm:p-6">
              <p>
                <span className="text-ok">$</span> help
              </p>
              <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-6 text-dim">
                {commands.map(([cmd, desc]) => (
                  <div key={cmd} className="contents">
                    <dt className="text-cyan">{cmd}</dt>
                    <dd>{desc}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2">
                <span className="text-ok">$</span> <span className="caret" aria-hidden />
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-5">
            <p className="text-lg text-dim">{t.contact.intro}</p>
            <div className="flex flex-wrap gap-3">
              <a href={`mailto:${site.email}`} className="btn btn-primary">
                <Mail size={16} aria-hidden />
                {t.contact.email}
              </a>
              <CopyEmail email={site.email} />
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={site.links.github} className="btn btn-ghost" {...external}>
                <GitHubIcon size={16} />
                {t.contact.github}
              </a>
              {site.links.linkedin && (
                <a href={site.links.linkedin} className="btn btn-ghost" {...external}>
                  <LinkedInIcon size={16} />
                  {t.contact.linkedin}
                </a>
              )}
              {site.links.whatsapp && (
                <a href={site.links.whatsapp} className="btn btn-ghost" {...external}>
                  <MessageCircle size={16} aria-hidden />
                  {t.contact.whatsapp}
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={site.cv.ai} download className="btn btn-ghost">
                <Download size={16} aria-hidden />
                {t.hero.cvAi}
              </a>
              <a href={site.cv.embedded} download className="btn btn-ghost">
                <Download size={16} aria-hidden />
                {t.hero.cvEmbedded}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
