"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CATEGORIES, type Category, categoryFromParam, categoryParam } from "@/lib/categories";
import { t } from "@/lib/i18n";
import type { ProjectCardData } from "@/lib/projects";
import { ProjectCard } from "./ProjectCard";

type GridProps = { projects: ProjectCardData[]; headingLevel?: 2 | 3 };

/**
 * Filterable project grid (SPEC §6): pills All / AI / Embedded / IoT, state in `?c=`.
 * Used on the home page (featured) and on /projects (all).
 * Phase 5 animates the reflow with Motion `layout`.
 *
 * The static HTML renders the unfiltered grid (Suspense fallback), so every card is
 * in the exported page for crawlers and no-JS visitors; the filter applies after hydration.
 */
export function ProjectGrid({ projects, headingLevel }: GridProps) {
  return (
    <Suspense fallback={<GridView projects={projects} headingLevel={headingLevel} active={null} />}>
      <FilterableGrid projects={projects} headingLevel={headingLevel} />
    </Suspense>
  );
}

function FilterableGrid({ projects, headingLevel }: GridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active = categoryFromParam(params.get("c"));

  function select(c: Category | null) {
    const next = new URLSearchParams(params.toString());
    if (c) next.set("c", categoryParam(c));
    else next.delete("c");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <GridView projects={projects} headingLevel={headingLevel} active={active} onSelect={select} />
  );
}

function GridView({
  projects,
  headingLevel,
  active,
  onSelect,
}: GridProps & { active: Category | null; onSelect?: (c: Category | null) => void }) {
  const visible = active ? projects.filter((p) => p.category.includes(active)) : projects;
  const options: (Category | null)[] = [null, ...CATEGORIES];

  return (
    <div>
      <div role="group" aria-label={t.a11y.filterProjects} className="mb-8 flex flex-wrap gap-2">
        {options.map((c) => {
          const pressed = c === active;
          return (
            <button
              key={c ?? "all"}
              type="button"
              aria-pressed={pressed}
              onClick={() => onSelect?.(c)}
              className={`btn min-h-11 px-4 text-xs uppercase ${
                pressed
                  ? "border border-transparent bg-text text-bg"
                  : "border border-line text-dim hover:border-white/20 hover:text-text"
              }`}
            >
              {c ?? t.projects.all}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="font-mono text-sm text-dim">{t.projects.empty}</p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((p, i) => {
            // Bento: the first card spans 2 columns on desktop when showing everything.
            const wide = i === 0 && !active;
            return (
              <li key={p.slug} className={wide ? "lg:col-span-2" : undefined}>
                <ProjectCard project={p} wide={wide} headingLevel={headingLevel} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
