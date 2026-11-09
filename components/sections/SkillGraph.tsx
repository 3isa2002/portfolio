"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";

export type GraphGroup = {
  id: string;
  label: string;
  accent: "cyan" | "violet" | "neutral";
  skills: { name: string; projects: string[] }[];
};
export type GraphProject = { slug: string; title: string; url: string };

type Edge = { skill: string; slug: string; d: string; accent: GraphGroup["accent"] };
type Active = { skill: string } | { slug: string } | null;

const STROKE = { cyan: "var(--cyan)", violet: "var(--violet)", neutral: "var(--text-dim)" };
const CHIP = {
  cyan: "hover:border-cyan/60 data-[on]:border-cyan data-[on]:text-cyan",
  violet: "hover:border-violet/60 data-[on]:border-violet data-[on]:text-violet-ink",
  neutral: "hover:border-white/30 data-[on]:border-white/50",
} as const;

/**
 * Interactive skill graph (SPEC §5.4, desktop): skills in three clusters on the left, projects on
 * the right, a line from each skill to every project whose `stack` lists it. Hovering or
 * focusing a skill lights its lines and projects; hovering a project lights its skills.
 * Lines are measured from the real chips (and re-measured on resize). Keyboard: Tab through
 * the skills; each one also carries an sr-only "Used in" list. Phones get the chip list instead.
 */
export function SkillGraph({
  groups,
  projects,
}: {
  groups: GraphGroup[];
  projects: GraphProject[];
}) {
  const root = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [active, setActive] = useState<Active>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const next: Edge[] = [];
      for (const g of groups) {
        for (const s of g.skills) {
          const chip = el.querySelector<HTMLElement>(`[data-skill="${CSS.escape(s.name)}"]`);
          if (!chip) continue;
          const a = chip.getBoundingClientRect();
          for (const slug of s.projects) {
            const node = el.querySelector<HTMLElement>(`[data-project="${CSS.escape(slug)}"]`);
            if (!node) continue;
            const b = node.getBoundingClientRect();
            const x1 = a.right - box.left;
            const y1 = a.top + a.height / 2 - box.top;
            const x2 = b.left - box.left;
            const y2 = b.top + b.height / 2 - box.top;
            const mx = x1 + (x2 - x1) * 0.55;
            next.push({
              skill: s.name,
              slug,
              accent: g.accent,
              d: `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`,
            });
          }
        }
      }
      setSize({ w: box.width, h: box.height });
      setEdges(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [groups]);

  const lit = (e: Edge) =>
    active !== null && ("skill" in active ? e.skill === active.skill : e.slug === active.slug);
  const skillOn = (name: string, projectSlugs: string[]) =>
    active !== null &&
    ("skill" in active ? active.skill === name : projectSlugs.includes(active.slug));
  const projectOn = (slug: string) =>
    active !== null &&
    ("slug" in active
      ? active.slug === slug
      : groups.some((g) =>
          g.skills.some((s) => s.name === active.skill && s.projects.includes(slug)),
        ));

  return (
    <div
      ref={root}
      className="skill-graph relative grid grid-cols-[1fr_17rem] gap-x-24"
      data-active={active ? "" : undefined}
    >
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0"
        width={size.w}
        height={size.h}
      >
        {edges.map((e) => (
          <path
            key={`${e.skill}-${e.slug}`}
            d={e.d}
            fill="none"
            stroke={STROKE[e.accent]}
            strokeWidth={lit(e) ? 1.6 : 1}
            strokeOpacity={lit(e) ? 0.9 : active ? 0.05 : 0.14}
            className="transition-[stroke-opacity] duration-200"
          />
        ))}
      </svg>

      <div className="relative flex flex-col gap-8">
        {groups.map((g) => (
          <div key={g.id}>
            <h3 className="label mb-3 text-dim">{g.label}</h3>
            <ul className="flex flex-wrap gap-2">
              {g.skills.map((s) => {
                const on = skillOn(s.name, s.projects);
                return (
                  <li key={s.name}>
                    <button
                      type="button"
                      data-skill={s.name}
                      data-on={on || undefined}
                      onPointerEnter={() => setActive({ skill: s.name })}
                      onPointerLeave={() => setActive(null)}
                      onFocus={() => setActive({ skill: s.name })}
                      onBlur={() => setActive(null)}
                      className={`chip relative min-h-9 bg-bg-elev transition-[border-color,color,opacity] ${CHIP[g.accent]} ${
                        active && !on ? "opacity-45" : ""
                      }`}
                    >
                      {s.name}
                      {s.projects.length > 0 && (
                        <span className="text-xs text-dim" aria-hidden>
                          ×{s.projects.length}
                        </span>
                      )}
                      {s.projects.length > 0 && (
                        <span className="sr-only">
                          {" "}
                          — {t.skills.usedIn}:{" "}
                          {s.projects
                            .map((slug) => projects.find((p) => p.slug === slug)?.title)
                            .join(", ")}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="relative flex flex-col justify-center gap-3">
        <p className="label text-dim">{t.skills.projectsLabel}</p>
        {projects.map((p) => {
          const on = projectOn(p.slug);
          return (
            <Link
              key={p.slug}
              href={p.url}
              data-project={p.slug}
              onPointerEnter={() => setActive({ slug: p.slug })}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive({ slug: p.slug })}
              onBlur={() => setActive(null)}
              className={`card flex min-h-12 items-center px-4 font-display text-sm font-semibold transition-[border-color,opacity] hover:border-white/25 ${
                on ? "border-white/40" : active ? "opacity-45" : ""
              }`}
            >
              {p.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
