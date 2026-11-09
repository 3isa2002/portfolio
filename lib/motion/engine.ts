/**
 * Motion engine (SPEC §3 motion principles, §7 signature interactions). Loaded with a dynamic
 * `import()` after first paint, so none of GSAP or Lenis is on the critical path.
 *
 * Components stay server-rendered and only declare intent with data attributes:
 *   data-reveal="split"    heading: lines slide up from a mask (SplitText)
 *   data-reveal="up"       fade up 16px
 *   data-reveal="stagger"  direct children fade up, 60ms apart, on one trigger
 *   data-reveal="each"     direct children fade up, each on its own trigger (long prose)
 *   data-scramble          text resolves from binary noise
 *   data-magnetic          pulls toward the cursor within 60px, springs back
 *   data-cursor="view"     custom cursor shows VIEW
 *   data-timeline / -line / -item   About timeline: pinned + scrubbed on desktop
 *
 * Everything runs inside `gsap.matchMedia`, keyed on the same queries as `useReducedMotion`, so
 * switching reduced motion on reverts every animation live and leaves the static, readable page.
 * Only `transform` and `opacity` are animated.
 */
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { QUERIES } from "./media";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);
ScrollTrigger.config({ ignoreMobileResize: true });

const POINTER_MOTION = `${QUERIES.motionOk} and ${QUERIES.finePointer}`;
const PIN_DESKTOP = `${QUERIES.desktop} and ${QUERIES.finePointer}`;

const ENTER = "expo.out";
const FADE_UP = { opacity: 0, y: 16, duration: 0.7, ease: ENTER } as const;
const MAGNET_RADIUS = 60;
const MAGNET_MAX = 14;

/** Reveal triggers fire once, when the element's top passes 88% of the viewport. */
const once = (trigger: Element): ScrollTrigger.Vars => ({ trigger, start: "top 88%", once: true });

/**
 * Elements already on screen when the engine starts are left alone: hiding them now would make
 * visible content blink. Only content below the fold gets an entrance.
 */
const belowFold = (el: Element) => el.getBoundingClientRect().top > window.innerHeight * 0.92;

const all = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

export type MotionEngine = {
  /** Re-read the page's data attributes (call after a client-side navigation). */
  scan: () => void;
  destroy: () => void;
};

export function createMotionEngine(): MotionEngine {
  const html = document.documentElement;
  const persistent = gsap.matchMedia();
  let page: gsap.MatchMedia | null = null;
  let lenis: Lenis | null = null;
  let magnets: HTMLElement[] = [];

  // Lenis smooth scroll, driven by GSAP's ticker so ScrollTrigger reads the same position.
  // Mouse/trackpad only: touch devices keep native scrolling (SPEC §8 mobile).
  persistent.add(POINTER_MOTION, () => {
    const instance = new Lenis({ autoRaf: false, anchors: false, lerp: 0.1 });
    lenis = instance;
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      instance.destroy();
      lenis = null;
    };
  });

  // Custom cursor (dot + lagging ring) and magnetic buttons, mouse only.
  persistent.add(POINTER_MOTION, () => {
    const dot = document.querySelector<HTMLElement>("[data-cursor-dot]");
    const ring = document.querySelector<HTMLElement>("[data-cursor-ring]");
    if (!dot || !ring) return;

    const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3.out" });
    const pulled = new Set<HTMLElement>();
    let frame = 0;
    let px = 0;
    let py = 0;

    const pullMagnets = () => {
      frame = 0;
      for (const el of magnets) {
        const r = el.getBoundingClientRect();
        // Measure from the element's resting position, not where the pull has moved it.
        const cx = r.left + r.width / 2 - Number(gsap.getProperty(el, "x"));
        const cy = r.top + r.height / 2 - Number(gsap.getProperty(el, "y"));
        const dx = px - cx;
        const dy = py - cy;
        const near =
          Math.abs(dx) < r.width / 2 + MAGNET_RADIUS && Math.abs(dy) < r.height / 2 + MAGNET_RADIUS;
        if (near) {
          pulled.add(el);
          gsap.to(el, {
            x: gsap.utils.clamp(-MAGNET_MAX, MAGNET_MAX, dx * 0.2),
            y: gsap.utils.clamp(-MAGNET_MAX, MAGNET_MAX, dy * 0.3),
            duration: 0.4,
            ease: "power3.out",
            overwrite: "auto",
          });
        } else if (pulled.delete(el)) {
          gsap.to(el, {
            x: 0,
            y: 0,
            duration: 0.8,
            ease: "elastic.out(1, 0.4)",
            overwrite: "auto",
          });
        }
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (html.dataset.cursor !== "on") {
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
        html.dataset.cursor = "on";
      }
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
      px = e.clientX;
      py = e.clientY;
      if (!frame) frame = requestAnimationFrame(pullMagnets);
    };
    const onOver = (e: PointerEvent) => {
      html.dataset.cursorState = cursorStateFor(e.target);
    };
    // Leaving the window: hide the custom cursor until the mouse comes back.
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) delete html.dataset.cursor;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      cancelAnimationFrame(frame);
      delete html.dataset.cursor;
      delete html.dataset.cursorState;
      gsap.killTweensOf(magnets);
      gsap.set(magnets, { clearProps: "transform" });
      gsap.set([dot, ring], { clearProps: "transform" });
    };
  });

  // In-page anchor links scroll with Lenis (Lenis's own `anchors` option does not cancel the
  // native jump), update the URL, and move focus to the target so keyboard users land there too.
  const onClick = (e: MouseEvent) => {
    if (!lenis || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = (e.target as Element | null)?.closest?.<HTMLAnchorElement>("a[href*='#']");
    if (!link || link.target === "_blank") return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    e.preventDefault(); // also stops next/link, which checks `defaultPrevented`
    history.pushState(history.state, "", url.hash);
    lenis.scrollTo(target, {
      onComplete: () => {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      },
    });
  };
  document.addEventListener("click", onClick, { capture: true });

  // Content height changes (filtering, images, fonts) move every trigger below them.
  let refreshTimer: number | undefined;
  const observer = new ResizeObserver(() => {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 200);
  });
  observer.observe(document.body);
  void document.fonts?.ready.then(() => ScrollTrigger.refresh());

  function scanNow() {
    page?.revert();
    page = gsap.matchMedia();
    magnets = all("[data-magnetic]");
    page.add({ motion: QUERIES.motionOk, pin: PIN_DESKTOP }, (context) => {
      const { motion, pin } = context.conditions as { motion: boolean; pin: boolean };
      if (!motion) return;
      // The pin adds scroll space below the timeline, so it must exist (and be measured)
      // before `reveals()` decides which elements are still below the fold.
      timeline(pin);
      ScrollTrigger.refresh();
      reveals();
    });
  }

  return {
    // After the new route's DOM and Next's scroll reset are in place, and in its own idle task
    // so start-up work does not stack into one long main-thread task.
    scan: () => whenIdle(scanNow),
    destroy: () => {
      document.removeEventListener("click", onClick, { capture: true });
      observer.disconnect();
      window.clearTimeout(refreshTimer);
      page?.revert();
      persistent.revert();
    },
  };
}

function whenIdle(fn: () => void) {
  if ("requestIdleCallback" in window) window.requestIdleCallback(fn, { timeout: 500 });
  else setTimeout(fn, 50);
}

function cursorStateFor(target: EventTarget | null): string {
  if (!(target instanceof Element)) return "default";
  if (
    target.closest(
      "input:not([type=button],[type=submit],[type=checkbox],[type=radio]), textarea, select, [contenteditable=true]",
    )
  )
    return "text";
  if (target.closest("[data-cursor=view]")) return "view";
  if (target.closest("a, button, summary, label, [role=button]")) return "link";
  return "default";
}

/** Headings by line, then body fading up 16px; children staggered 60ms (SPEC §3). */
function reveals() {
  // Read every position first, then write: interleaving the two would force a layout per element.
  type Job = { el: HTMLElement; kind: string };
  const jobs: Job[] = [];
  for (const el of all("[data-reveal]")) {
    const kind = el.dataset.reveal ?? "up";
    if (kind === "each") {
      for (const child of Array.from(el.children)) {
        if (child instanceof HTMLElement && belowFold(child)) jobs.push({ el: child, kind: "up" });
      }
    } else if (belowFold(el)) {
      jobs.push({ el, kind });
    }
  }
  const scrambles = all("[data-scramble]").filter(belowFold);

  for (const { el, kind } of jobs) {
    if (kind === "split") {
      SplitText.create(el, {
        type: "lines",
        mask: "lines",
        linesClass: "split-line",
        autoSplit: true, // re-split when fonts load or the width changes
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 110,
            duration: 0.9,
            ease: ENTER,
            stagger: 0.08,
            scrollTrigger: once(el),
          }),
      });
    } else if (kind === "stagger") {
      gsap.from(el.children, { ...FADE_UP, stagger: 0.06, scrollTrigger: once(el) });
    } else {
      gsap.from(el, { ...FADE_UP, scrollTrigger: once(el) });
    }
  }

  for (const el of scrambles) {
    gsap.to(el, {
      duration: 0.9,
      ease: "none",
      scrambleText: { text: el.textContent ?? "", chars: "01", speed: 0.6, revealDelay: 0.25 },
      scrollTrigger: once(el),
    });
  }
}

/**
 * About timeline (SPEC §5.2): the trace draws as you scroll and each milestone lights up as the
 * line reaches it. Desktop pins the block while it draws; touch/mobile never pins (SPEC §8).
 */
function timeline(pin: boolean) {
  const root = document.querySelector<HTMLElement>("[data-timeline]");
  const line = root?.querySelector<HTMLElement>("[data-timeline-line]");
  if (!root || !line) return;
  const items = all("[data-timeline-item]", root);
  const rtl = getComputedStyle(root).direction === "rtl";

  if (pin) {
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: root,
        start: "center center",
        end: () => `+=${Math.round(window.innerHeight * 0.9)}`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
    tl.fromTo(
      line,
      { scaleX: 0 },
      { scaleX: 1, transformOrigin: rtl ? "right center" : "left center", duration: 1 },
      0,
    );
    items.forEach((item, i) => {
      tl.from(
        item,
        { opacity: 0, y: 16, duration: 0.12, ease: "power2.out" },
        (i / items.length) * 0.92,
      );
    });
    return;
  }

  gsap.fromTo(
    line,
    { scaleY: 0 },
    {
      scaleY: 1,
      transformOrigin: "center top",
      ease: "none",
      scrollTrigger: { trigger: root, start: "top 75%", end: "bottom 55%", scrub: true },
    },
  );
  for (const item of items.filter(belowFold)) {
    gsap.from(item, { ...FADE_UP, scrollTrigger: once(item) });
  }
}
