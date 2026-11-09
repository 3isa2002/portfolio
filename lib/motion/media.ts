import { useSyncExternalStore } from "react";

/**
 * The single source of truth for motion preferences (SPEC §8: one `useReducedMotion`, used by
 * GSAP, Motion, Lenis and the 3D scene). React code uses `useReducedMotion`; GSAP's `matchMedia` uses the
 * same query strings, so both sides always agree and both react live when the setting changes.
 */
export const QUERIES = {
  reducedMotion: "(prefers-reduced-motion: reduce)",
  motionOk: "(prefers-reduced-motion: no-preference)",
  /** A mouse or trackpad: custom cursor, magnetic buttons, Lenis smooth scroll. */
  finePointer: "(hover: hover) and (pointer: fine)",
  /** Desktop layout breakpoint (Tailwind `lg`) where the About timeline is pinned. */
  desktop: "(min-width: 1024px)",
} as const;

function subscribeReduced(onChange: () => void) {
  const mql = window.matchMedia(QUERIES.reducedMotion);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * `true` when the visitor asked for reduced motion. During prerender and hydration it reports
 * `true`, so the static HTML is always the calm version and motion only starts on the client.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(QUERIES.reducedMotion).matches,
    () => true,
  );
}

export function prefersReducedMotion(): boolean {
  return typeof window === "undefined" || window.matchMedia(QUERIES.reducedMotion).matches;
}
