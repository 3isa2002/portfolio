"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion/media";

/**
 * Makes the browser's Back/Forward buttons animate like link navigations (SPEC §6: "the browser
 * back button reverses it").
 *
 * React runs a transition started inside a `popstate` event synchronously (to keep scroll
 * restoration exact), and synchronous updates never start a view transition, so Back would
 * otherwise cut instantly. This listener sees the popstate first (capture phase), starts the
 * view transition itself, names the project covers on the page being left, and only then hands
 * the same event to Next's router. Covers on the arriving page get the same names, so the
 * case-study hero morphs back into its card. Elements opt in with `data-vt-cover="<slug>"`.
 *
 * Skipped without View Transitions support and with reduced motion (the page just swaps).
 */
export function BackTransitions() {
  useEffect(() => {
    if (!("startViewTransition" in document)) return;
    let replaying = false;

    const name = (on: boolean) => {
      for (const el of document.querySelectorAll<HTMLElement>("[data-vt-cover]")) {
        el.style.viewTransitionName = on ? `cover-${el.dataset.vtCover}` : "";
        if (on) el.style.setProperty("view-transition-class", "morph");
        else el.style.removeProperty("view-transition-class");
      }
    };

    const onPopState = (e: PopStateEvent) => {
      // Only router-managed history entries; our own replay passes straight through.
      const state: unknown = e.state;
      if (replaying || prefersReducedMotion() || !(state as { __NA?: boolean } | null)?.__NA)
        return;
      e.stopImmediatePropagation();
      name(true);
      const transition = document.startViewTransition(async () => {
        name(false);
        const main = document.getElementById("main");
        const changed = waitForChange(main);
        replaying = true;
        window.dispatchEvent(new PopStateEvent("popstate", { state }));
        replaying = false;
        await changed;
        name(true);
      });
      void transition.finished.finally(() => name(false));
    };

    window.addEventListener("popstate", onPopState, { capture: true });
    return () => window.removeEventListener("popstate", onPopState, { capture: true });
  }, []);
  return null;
}

/** Resolves when the page content changes (the router committed), or after 500 ms. */
function waitForChange(target: HTMLElement | null): Promise<void> {
  return new Promise((resolve) => {
    if (!target) return resolve();
    const done = () => {
      observer.disconnect();
      window.clearTimeout(timer);
      // One more task so React finishes the commit (refs, layout) before the snapshot.
      window.setTimeout(resolve, 0);
    };
    const observer = new MutationObserver(done);
    observer.observe(target, { childList: true, subtree: true });
    const timer = window.setTimeout(done, 500);
  });
}
