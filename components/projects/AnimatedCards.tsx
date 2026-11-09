"use client";

import { AnimatePresence, LazyMotion, m, MotionConfig } from "motion/react";
import type { CardsProps } from "./ProjectGrid";
import { ProjectCard } from "./ProjectCard";

const loadFeatures = () => import("./motion-features").then((mod) => mod.default);

/**
 * The project list with Motion (SPEC §6 filter): cards slide to their new places (`layout`),
 * cards that leave fade and scale to 0.95. Loaded by ProjectGrid only once the visitor shows
 * an intent to filter, so Motion (~50 KB) stays out of the page's initial JavaScript.
 * Renders the same markup as the static list, so swapping it in changes nothing on screen.
 */
export default function AnimatedCards({ visible, active, headingLevel }: CardsProps) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <ul className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((p, i) => {
              const wide = i === 0 && !active;
              return (
                <m.li
                  key={p.slug}
                  layout="position"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className={wide ? "lg:col-span-2" : undefined}
                >
                  <ProjectCard project={p} wide={wide} headingLevel={headingLevel} />
                </m.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </MotionConfig>
    </LazyMotion>
  );
}
