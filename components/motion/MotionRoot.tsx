"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { t } from "@/lib/i18n";
import type { MotionEngine } from "@/lib/motion/engine";

/**
 * Site-wide motion layer, mounted once in the root layout.
 * - Scroll progress line (SPEC §5): plain scroll listener, works with or without motion.
 * - Custom cursor elements: hidden until the engine turns them on (mouse + motion allowed).
 * - The GSAP/Lenis engine: imported on the visitor's first interaction (or after a few seconds),
 *   so its ~56 KB and start-up work stay off the loading path; reveals only matter once the
 *   visitor scrolls. It re-scans the page after each client-side navigation.
 */
const WAKE_EVENTS = [
  "scroll",
  "wheel",
  "pointermove",
  "pointerdown",
  "touchstart",
  "keydown",
] as const;
const WAKE_AFTER_MS = 4000;

export function MotionRoot() {
  const pathname = usePathname();
  const bar = useRef<HTMLDivElement>(null);
  const engine = useRef<MotionEngine | null>(null);
  const firstPath = useRef(true);

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.transform = `scaleX(${progress})`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      stopListening();
      void import("@/lib/motion/engine").then(({ createMotionEngine }) => {
        if (cancelled) return;
        engine.current = createMotionEngine();
        engine.current.scan();
      });
    };
    const opts = { passive: true, capture: true } as const;
    const stopListening = () => {
      for (const type of WAKE_EVENTS) window.removeEventListener(type, start, opts);
      window.clearTimeout(fallback);
    };
    for (const type of WAKE_EVENTS) window.addEventListener(type, start, opts);
    const fallback = window.setTimeout(start, WAKE_AFTER_MS);
    return () => {
      cancelled = true;
      stopListening();
      engine.current?.destroy();
      engine.current = null;
    };
  }, []);

  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    engine.current?.scan();
  }, [pathname]);

  return (
    <>
      <div aria-hidden className="scroll-progress">
        <div ref={bar} className="scroll-progress-bar" />
      </div>
      <div aria-hidden data-cursor-dot className="cursor-dot" />
      <div aria-hidden data-cursor-ring className="cursor-ring">
        <span className="cursor-ring-circle" />
        <span className="cursor-label">{t.cursor.view}</span>
      </div>
    </>
  );
}
