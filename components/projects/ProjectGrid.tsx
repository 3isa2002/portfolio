"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ComponentType, Suspense, useRef, useState } from "react";
import { CATEGORIES, type Category, categoryFromParam, categoryParam } from "@/lib/categories";
import { t } from "@/lib/i18n";
import type { ProjectCardData } from "@/lib/projects";
import { ProjectCard } from "./ProjectCard";

type GridProps = { projects: ProjectCardData[]; headingLevel?: 2 | 3 };
export type CardsProps = {
  visible: ProjectCardData[];
  active: Category | null;
  headingLevel?: 2 | 3;
};

/**
 * Filterable project grid (SPEC §6): pills All / AI / Embedded / IoT, state in `?c=`.
 * Used on the home page (featured) and on /projects (all).
 *
 * Filtering animates the reflow with Motion (AnimatedCards). Motion is ~50 KB, so it is loaded
 * on the first sign the visitor wants to filter (pointer over the pills, or keyboard focus on
 * one); until then the same list renders without it. If a pill is clicked before Motion has
 * arrived, the change waits for it, so even the first filter animates.
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
  const [Animated, setAnimated] = useState<ComponentType<CardsProps> | null>(null);
  const loading = useRef<Promise<void> | null>(null);

  function loadMotion(): Promise<void> {
    loading.current ??= import("./AnimatedCards").then(
      (mod) =>
        new Promise<void>((resolve) => {
          setAnimated(() => mod.default);
          // Two frames: the animated list has mounted and measured before anything moves.
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
    return loading.current;
  }

  async function select(c: Category | null) {
    await loadMotion().catch(() => {});
    const next = new URLSearchParams(params.toString());
    if (c) next.set("c", categoryParam(c));
    else next.delete("c");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <GridView
      projects={projects}
      headingLevel={headingLevel}
      active={active}
      onSelect={select}
      onIntent={() => void loadMotion().catch(() => {})}
      Cards={Animated}
    />
  );
}

function GridView({
  projects,
  headingLevel,
  active,
  onSelect,
  onIntent,
  Cards,
}: GridProps & {
  active: Category | null;
  onSelect?: (c: Category | null) => void;
  onIntent?: () => void;
  Cards?: ComponentType<CardsProps> | null;
}) {
  const visible = active ? projects.filter((p) => p.category.includes(active)) : projects;
  const options: (Category | null)[] = [null, ...CATEGORIES];

  return (
    <div>
      <div
        role="group"
        aria-label={t.a11y.filterProjects}
        className="mb-8 flex flex-wrap gap-2"
        data-reveal="up"
        onPointerEnter={onIntent}
        onFocus={onIntent}
      >
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
      ) : Cards ? (
        <Cards visible={visible} active={active} headingLevel={headingLevel} />
      ) : (
        <ul className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-reveal="stagger">
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
