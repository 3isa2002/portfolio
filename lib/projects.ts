import { projects as allProjects } from "#site/content";
import type { Category } from "./categories";

/** A full project, including the compiled MDX body. Server-side only (the body is large). */
export type Project = (typeof allProjects)[number];

/** The slim shape cards need. Safe to pass to client components. */
export type ProjectCardData = Pick<
  Project,
  "slug" | "url" | "title" | "summary" | "category" | "year" | "stack" | "coverSrc" | "previewSrc"
>;

/** Home and grid order: `order` ascending, then newest first. */
const sorted: Project[] = [...allProjects].sort((a, b) => a.order - b.order || b.year - a.year);

export function getProjects(): Project[] {
  return sorted;
}

/** Up to `limit` featured projects for the home section (SPEC §5.3). */
export function getFeaturedProjects(limit = 6): Project[] {
  return sorted.filter((p) => p.featured).slice(0, limit);
}

export function getProject(slug: string): Project | undefined {
  return sorted.find((p) => p.slug === slug);
}

/** The project after `slug` in display order, wrapping to the first. */
export function getNextProject(slug: string): Project | undefined {
  const i = sorted.findIndex((p) => p.slug === slug);
  if (i === -1 || sorted.length < 2) return undefined;
  return sorted[(i + 1) % sorted.length];
}

/** Projects whose `stack` lists this skill (case-insensitive). Feeds the Skills section. */
export function getProjectsUsing(skill: string): Project[] {
  const needle = skill.toLowerCase();
  return sorted.filter((p) => p.stack.some((s) => s.toLowerCase() === needle));
}

export function toCardData(p: Project): ProjectCardData {
  return {
    slug: p.slug,
    url: p.url,
    title: p.title,
    summary: p.summary,
    category: p.category,
    year: p.year,
    stack: p.stack,
    coverSrc: p.coverSrc,
    previewSrc: p.previewSrc,
  };
}

export function hasCategory(p: Pick<Project, "category">, c: Category): boolean {
  return p.category.includes(c);
}
