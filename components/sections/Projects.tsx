import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { t } from "@/lib/i18n";
import { getFeaturedProjects, getProjects, toCardData } from "@/lib/projects";

/**
 * Section 3 — featured projects (up to 6) + link to the full grid (SPEC §5.3). Picking a category
 * shows every project in it right here (Mohamed, 2026-11-10); "All" goes back to the featured six.
 */
export function Projects() {
  const projects = getProjects().map(toCardData);
  const featured = getFeaturedProjects(6).map((p) => p.slug);
  return (
    <section id="projects" aria-labelledby="projects-title" className="section">
      <div className="container-site">
        <SectionHeading
          index={3}
          label={t.sections.projects.label}
          title={t.sections.projects.title}
          id="projects-title"
        />
        <ProjectGrid projects={projects} featured={featured} />
        <p className="mt-10" data-reveal="up">
          <Link href="/projects" className="btn btn-ghost" data-magnetic>
            {t.projects.seeAll}
            <ArrowRight size={16} aria-hidden className="rtl:rotate-180" />
          </Link>
        </p>
      </div>
    </section>
  );
}
