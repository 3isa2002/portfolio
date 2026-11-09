"use client";

import Link from "next/link";
import { type CSSProperties, type PointerEvent, useEffect, useRef, ViewTransition } from "react";
import { Picture } from "@/components/ui/Picture";
import { accentFor } from "@/lib/categories";
import { t } from "@/lib/i18n";
import { QUERIES, useReducedMotion } from "@/lib/motion/media";
import type { ProjectCardData } from "@/lib/projects";
import { CategoryBadge } from "./CategoryBadge";

type ProjectCardProps = {
  project: ProjectCardData;
  /** The wide bento card (first featured, desktop). */
  wide?: boolean;
  /** Heading level for the title: 3 inside a home section, 2 on /projects (under the page h1). */
  headingLevel?: 2 | 3;
};

const MAX_TILT = 8; // degrees (SPEC §6)

/**
 * Project card (SPEC §6).
 * - Mouse: 3D tilt toward the cursor (max 8°), a light sheen that follows it, a border glow in
 *   the category colour, and the cover crossfades into the `preview` loop if there is one.
 * - Touch: no tilt; the preview plays while the card is at least 60% in view.
 * - Reduced motion: no tilt, no autoplaying preview; glow and sheen stay (no movement).
 * The cover carries a view-transition name, so it morphs into the case-study hero on click and
 * back again on the browser's back button.
 * The whole card is clickable through the title link's ::after overlay (one tab stop per card).
 */
export function ProjectCard({ project, wide, headingLevel = 3 }: ProjectCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const card = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const glow =
    accentFor(project.category[0] ?? "AI") === "violet" ? "var(--violet)" : "var(--cyan)";
  const hasPreview = Boolean(project.previewSrc) && !reduced;

  // Touch: play the preview while the card is 60% visible.
  useEffect(() => {
    const el = card.current;
    const v = video.current;
    if (!el || !v || !hasPreview || window.matchMedia(QUERIES.finePointer).matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void play(v, el);
        else stop(v, el);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasPreview]);

  function onMove(e: PointerEvent<HTMLElement>) {
    if (e.pointerType !== "mouse" || reduced) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${((x - 0.5) * 2 * MAX_TILT).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${((0.5 - y) * 2 * MAX_TILT).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
  }
  function onEnter(e: PointerEvent<HTMLElement>) {
    if (e.pointerType === "mouse" && video.current && hasPreview)
      void play(video.current, e.currentTarget);
  }
  function onLeave(e: PointerEvent<HTMLElement>) {
    const el = e.currentTarget;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    if (e.pointerType === "mouse" && video.current) stop(video.current, el);
  }

  return (
    <article
      ref={card}
      data-cursor="view"
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      style={{ "--glow": glow } as CSSProperties}
      className={`project-card group card relative flex h-full flex-col overflow-hidden has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-cyan ${
        wide ? "lg:flex-row" : ""
      }`}
    >
      {/* Wide bento card on desktop: cover beside the text, filling the row height. */}
      <div
        className={`relative aspect-[16/10] overflow-hidden border-b border-line bg-bg-elev-2 ${
          wide ? "lg:aspect-auto lg:w-3/5 lg:shrink-0 lg:border-e lg:border-b-0" : ""
        }`}
      >
        <ViewTransition name={`cover-${project.slug}`} share="morph" default="none">
          <div className="size-full" data-vt-cover={project.slug}>
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
        </ViewTransition>
        {hasPreview && project.previewSrc && (
          <video
            ref={video}
            src={project.previewSrc}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden
            tabIndex={-1}
            className="card-preview absolute inset-0 size-full object-cover"
          />
        )}
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
            transitionTypes={["nav-forward"]}
            className="outline-none after:absolute after:inset-0 after:z-10 after:content-['']"
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

async function play(v: HTMLVideoElement, card: HTMLElement) {
  try {
    await v.play();
    card.dataset.previewing = "";
  } catch {
    // Autoplay refused or the file is missing: the cover simply stays.
  }
}

function stop(v: HTMLVideoElement, card: HTMLElement) {
  v.pause();
  delete card.dataset.previewing;
}
