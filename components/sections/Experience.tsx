import { Briefcase, GraduationCap } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { experience } from "@/content/experience";
import { t } from "@/lib/i18n";

/** Section 5 — Experience and education cards (SPEC §5.5), revealed with a stagger. */
export function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-title" className="section">
      <div className="container-site">
        <SectionHeading
          index={5}
          label={t.sections.experience.label}
          title={t.sections.experience.title}
          id="experience-title"
        />

        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-reveal="stagger">
          {experience.map((e) => {
            const Icon = e.kind === "work" ? Briefcase : GraduationCap;
            return (
              <li key={e.role + e.place} className="card flex flex-col gap-4 p-6">
                <p className="label flex items-center gap-2 text-dim">
                  <Icon size={14} aria-hidden />
                  {e.kind === "work" ? t.experience.work : t.experience.education}
                  <span className="ms-auto normal-case tracking-normal">{e.dates}</span>
                </p>
                <div>
                  <h3 className="font-display text-xl font-semibold">{e.role}</h3>
                  <p className="text-dim">{e.place}</p>
                </div>
                <ul className="space-y-2 text-sm">
                  {e.bullets.map((b) => (
                    <li key={b} className="flex gap-2.5">
                      <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-cyan" />
                      {b}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
