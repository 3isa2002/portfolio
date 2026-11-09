import type { Metadata } from "next";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { t } from "@/lib/i18n";
import { getProjects, toCardData } from "@/lib/projects";

export const metadata: Metadata = {
  title: t.meta.projectsTitle,
  description: t.meta.projectsDescription,
  alternates: { canonical: "/projects" },
};

/** Full filterable grid: same component as the home section, no limit (SPEC §5 routes). */
export default function ProjectsPage() {
  const projects = getProjects().map(toCardData);
  return (
    <section className="container-site pt-32 pb-24">
      <header className="mb-12 flex flex-col gap-3">
        <p className="label text-dim">
          <span className="text-cyan">{String(projects.length).padStart(2, "0")}</span> ·{" "}
          {t.sections.projects.label}
        </p>
        <h1 className="text-h2 font-semibold">{t.meta.projectsTitle}</h1>
        <p className="max-w-xl text-dim">{t.meta.projectsDescription}</p>
      </header>
      <ProjectGrid projects={projects} headingLevel={2} />
    </section>
  );
}
