"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { t } from "@/lib/i18n";
import type { MotionEngine } from "@/lib/motion/engine";
import { QUERIES } from "@/lib/motion/media";
import { INTRO_DONE, onFirstInteraction } from "@/lib/motion/wake";

/**
 * Site-wide motion layer, mounted once in the root layout.
 * - Scroll progress line (SPEC §5): plain scroll listener, works with or without motion.
 * - Custom cursor elements: hidden until the engine turns them on (mouse + motion allowed).
 * - The GSAP/Lenis engine: imported on the visitor's first interaction (or after a few seconds),
 *   so its ~56 KB and start-up work stay off the loading path; reveals only matter once the
 *   visitor scrolls. It re-scans the page after each client-side navigation.
 */
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
    const cancelWake = onFirstInteraction(
      () => {
        void import("@/lib/motion/engine").then(({ createMotionEngine }) => {
          if (cancelled) return;
          engine.current = createMotionEngine();
          engine.current.scan();
        });
      },
      4000,
      // Desktop wakes as the boot intro ends; phones keep waiting for a touch (or the timer),
      // so the intro and the engine never compete for a phone's main thread.
      window.matchMedia(QUERIES.finePointer).matches ? [INTRO_DONE] : [],
    );
    return () => {
      cancelled = true;
      cancelWake();
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
