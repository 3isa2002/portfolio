import { SectionHeading } from "@/components/ui/SectionHeading";
import { site } from "@/content/site";
import { t } from "@/lib/i18n";
import { getProjectsUsing } from "@/lib/projects";

const accentClass = {
  cyan: { dot: "bg-cyan", text: "text-cyan" },
  violet: { dot: "bg-violet", text: "text-violet-ink" },
  neutral: { dot: "bg-dim", text: "text-dim" },
} as const;

/**
 * Section 4 — Skills (SPEC §5.4). Phase 1: grouped chips (this is also the final mobile layout).
 * Each chip shows how many projects list it in their `stack`; the interactive desktop skill
 * graph that lights edges to those projects builds on the same data later.
 */
export function Skills() {
  return (
    <section id="skills" aria-labelledby="skills-title" className="section">
      <div className="container-site">
        <SectionHeading
          index={4}
          label={t.sections.skills.label}
          title={t.sections.skills.title}
          id="skills-title"
        />

        <div className="grid gap-6 lg:grid-cols-3" data-reveal="stagger">
          {site.skills.map((group) => {
            const accent = accentClass[group.accent];
            return (
              <div key={group.id} className="card p-6">
                <h3 className={`label mb-5 flex items-center gap-2 ${accent.text}`}>
                  <span aria-hidden className={`size-2 rounded-full ${accent.dot}`} />
                  {t.skills.groups[group.id]}
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {group.items.map((skill) => {
                    const used = getProjectsUsing(skill);
                    return (
                      <li key={skill} className="chip">
                        {skill}
                        {used.length > 0 && (
                          <span className="text-xs text-dim">
                            <span aria-hidden>×{used.length}</span>
                            <span className="sr-only">
                              {" "}
                              — {t.skills.usedIn}: {used.map((p) => p.title).join(", ")}
                            </span>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
