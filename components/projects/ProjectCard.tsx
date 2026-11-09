import Link from "next/link";
import { Picture } from "@/components/ui/Picture";
import type { ProjectCardData } from "@/lib/projects";
import { t } from "@/lib/i18n";
import { CategoryBadge } from "./CategoryBadge";

type ProjectCardProps = {
  project: ProjectCardData;
  /** The wide bento card (first featured, desktop). Only changes the image `sizes` hint. */
  wide?: boolean;
  /** Heading level for the title: 3 inside a home section, 2 on /projects (under the page h1). */
  headingLevel?: 2 | 3;
};

/**
 * Project card (SPEC §6). Phase 1: no effects.
 * Phase 5 adds tilt, sheen, border glow, the hover preview video and the shared-element transition.
 * The whole card is clickable through the title link's ::after overlay, so there is one tab stop per card.
 */
export function ProjectCard({ project, wide, headingLevel = 3 }: ProjectCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article
      className={`group card relative flex h-full flex-col overflow-hidden transition-colors duration-200 hover:border-white/15 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-cyan ${
        wide ? "lg:flex-row" : ""
      }`}
    >
      {/* Wide bento card on desktop: cover beside the text, filling the row height, so it
          lines up with its neighbour instead of stretching the whole row. */}
      <div
        className={`aspect-[16/10] overflow-hidden border-b border-line bg-bg-elev-2 ${
          wide ? "lg:aspect-auto lg:w-3/5 lg:shrink-0 lg:border-e lg:border-b-0" : ""
        }`}
      >
        <Picture
          src={project.coverSrc}
          alt=""
          width={1600}
          height={1000}
          sizes={
            wide
              ? "(min-width: 1024px) 480px, (min-width: 768px) 50vw, 100vw"
              : "(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
          }
          className="size-full object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          {project.category.map((c) => (
            <CategoryBadge key={c} category={c} />
          ))}
          <span className="ms-auto font-mono text-xs text-dim">{project.year}</span>
        </div>

        <Heading className="font-display text-h3 font-semibold">
          <Link
            href={project.url}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {project.title}
          </Link>
        </Heading>

        <p className="text-dim">{project.summary}</p>

        {project.stack.length > 0 && (
          <ul className="mt-auto flex flex-wrap gap-2 pt-2" aria-label={t.projects.stack}>
            {project.stack.slice(0, 4).map((s) => (
              <li key={s} className="chip text-xs text-dim">
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
