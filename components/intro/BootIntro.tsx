"use client";

import { useLayoutEffect, useRef } from "react";
import { t } from "@/lib/i18n";
import { prefersReducedMotion } from "@/lib/motion/media";
import { INTRO_DONE, INTRO_START } from "@/lib/motion/wake";
import { play } from "@/lib/sound";
import { chipGeometry } from "./chip-geometry";
import { nameScramble } from "./name-canvas";

const geometry = chipGeometry();
const VIOLET = "#8b5cf6";

/**
 * Boot intro (SPEC §4): one GSAP master timeline, 3.2 s.
 *
 *   0.0–0.3  black, blinking caret            1.6–2.3  traces light up outward and branch
 *   0.3–1.0  firmware log types, OK in green  2.3–2.8  trace ends become nodes, cyan → violet, pulse
 *   1.0–1.6  log collapses into a chip         2.8–3.2  network contracts, the name resolves, page in
 *
 * The real hero is server-rendered underneath and never hidden (its name is the LCP element).
 * The name scrambles on a canvas laid exactly over it (a canvas is never an LCP candidate), then
 * the overlay fades and the real one is there. Skip (button, click, wheel, touch, key) finishes
 * in 300 ms. GSAP is imported on demand.
 *
 * It plays on every visit to the home page (Mohamed's decision, 2026-11-09, replacing SPEC §4's
 * "first visit only"): on a full page load `IntroScript` turns it on before first paint; on a
 * client-side navigation back to the home page (a link or the Back button) this component turns
 * it on itself, in a layout effect, so the page never shows before the overlay.
 * With reduced motion it never plays.
 */
export function BootIntro() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const html = document.documentElement;
    // "full" here means IntroScript set it during this page load; anything else ("done" from an
    // earlier play, or nothing) means we arrived through a client-side navigation.
    const fromPageLoad = html.dataset.intro === "full";
    if (!fromPageLoad) {
      if (html.dataset.intro === "calm" || prefersReducedMotion()) return;
      html.dataset.intro = "full"; // before paint: the overlay covers the page from the start
    }
    let disposed = false;
    let cleanup = () => {};

    const done = () => {
      html.dataset.intro = "done";
      window.dispatchEvent(new Event(INTRO_DONE));
    };
    // GSAP loads only after the first paint: the black screen and caret are plain CSS, and the
    // hero underneath must paint (it is the LCP element) before any intro work starts.
    const cancelWait = afterFirstPaint(() => {
      window.dispatchEvent(new Event(INTRO_START));
      play("hum"); // heard when sound is on and the visitor has interacted with the page
      void import("gsap")
        .then(({ gsap }) => {
          if (disposed) return;
          cleanup = playFull(gsap, root.current, done, fromPageLoad);
        })
        .catch(done);
    });

    return () => {
      disposed = true;
      cancelWait();
      cleanup();
      // Left the page mid-intro: the next visit must start fresh, not as a "page load".
      if (html.dataset.intro === "full") html.dataset.intro = "done";
    };
  }, []);

  const lines = t.intro.lines;
  return (
    <div ref={root} className="boot" data-boot>
      <div className="boot-bg" data-boot-bg />
      <div aria-hidden className="boot-stage">
        <svg className="boot-svg" data-boot-svg viewBox="-200 -200 400 400" fill="none">
          <g data-boot-synapses stroke={VIOLET} strokeWidth="1" opacity="0">
            {geometry.synapses.map(([a, b], i) => (
              <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
            ))}
          </g>
          <g stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            {geometry.traces.map((d, i) => (
              <path key={i} d={d} pathLength={1} data-boot-trace />
            ))}
          </g>
          <g data-boot-chip stroke="currentColor" opacity="0">
            <rect
              x="-40"
              y="-40"
              width="80"
              height="80"
              rx="7"
              strokeWidth="2"
              pathLength={1}
              data-boot-draw
            />
            <rect x="-24" y="-24" width="48" height="48" rx="3" strokeWidth="1" opacity="0.5" />
            {geometry.pins.map((d, i) => (
              <path key={i} d={d} strokeWidth="2.5" pathLength={1} data-boot-draw />
            ))}
          </g>
          <g fill="currentColor">
            {geometry.nodes.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="4" data-boot-node />
            ))}
          </g>
        </svg>

        <div className="boot-log" data-boot-log>
          {lines.map((line) => (
            <p key={line.text} className="boot-line" data-boot-line={line.text.length + 3}>
              <span className="text-cyan">&gt;</span> {line.text}
              {line.ok && <span className="text-ok"> {t.intro.ok}</span>}
            </p>
          ))}
          <span className="boot-caret caret" data-boot-caret />
        </div>

        <canvas className="boot-name" data-boot-name />
      </div>
      <button type="button" className="boot-skip btn btn-ghost" data-boot-skip>
        {t.intro.skip} <span aria-hidden>→</span>
      </button>
    </div>
  );
}

type Gsap = typeof import("gsap").gsap;

/** Runs `callback` two frames after the first contentful paint (or at once if it already happened). */
function afterFirstPaint(callback: () => void): () => void {
  let cancelled = false;
  let frame = 0;
  let observer: PerformanceObserver | undefined;
  const run = () => {
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (!cancelled) callback();
      });
    });
  };
  if (performance.getEntriesByName("first-contentful-paint").length > 0) run();
  else if (typeof PerformanceObserver === "function") {
    observer = new PerformanceObserver((list) => {
      if (!list.getEntries().some((e) => e.name === "first-contentful-paint")) return;
      observer?.disconnect();
      run();
    });
    observer.observe({ type: "paint", buffered: true });
  } else {
    frame = requestAnimationFrame(run);
  }
  return () => {
    cancelled = true;
    cancelAnimationFrame(frame);
    observer?.disconnect();
  };
}

function playFull(
  gsap: Gsap,
  root: HTMLElement | null,
  done: () => void,
  /** On a page load the black screen has been showing since first paint: catch up to it. */
  catchUp: boolean,
): () => void {
  if (!root) {
    done();
    return () => {};
  }
  root.dataset.running = ""; // stops the CSS failsafe that hides a stuck overlay
  const q = <T extends Element = HTMLElement>(sel: string) =>
    Array.from(root.querySelectorAll<T>(sel));
  const bg = q("[data-boot-bg]")[0];
  const svg = q<SVGSVGElement>("[data-boot-svg]")[0];
  const log = q("[data-boot-log]")[0];
  const canvas = q<HTMLCanvasElement>("[data-boot-name]")[0];
  const skipButton = q("[data-boot-skip]")[0];
  const heroName = document.querySelector<HTMLElement>("#hero-title");

  // The name resolves on a canvas laid exactly over the real heading (see name-canvas.ts).
  const drawName = canvas && heroName ? nameScramble(canvas, heroName) : null;

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    removeSkip();
    done();
  };

  const tl = gsap.timeline({ onComplete: finish });
  const chip = q("[data-boot-chip]");
  tl.fromTo(skipButton ?? [], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0.3);

  // 0.3–1.0: each log line types in ~120 ms.
  q("[data-boot-line]").forEach((line, i) => {
    const chars = Number(line.dataset.bootLine) || 20;
    tl.fromTo(
      line,
      { clipPath: "inset(0 100% 0 0)" },
      { clipPath: "inset(0 0% 0 0)", duration: 0.12, ease: `steps(${chars})` },
      0.3 + i * 0.17,
    );
  });

  // 1.0–1.6: the log collapses to the centre and becomes the chip.
  if (log) {
    const r = log.getBoundingClientRect();
    tl.to(
      log,
      {
        x: window.innerWidth / 2 - (r.left + r.width / 2),
        y: window.innerHeight / 2 - (r.top + r.height / 2),
        scale: 0.15,
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut",
      },
      1.0,
    );
  }
  tl.fromTo(
    chip,
    { opacity: 0, scale: 0.6, transformOrigin: "50% 50%" },
    { opacity: 1, scale: 1, duration: 0.5, ease: "expo.out" },
    1.05,
  );
  tl.fromTo(
    q("[data-boot-draw]"),
    { strokeDasharray: 1, strokeDashoffset: 1 },
    { strokeDashoffset: 0, duration: 0.5, ease: "power2.out", stagger: 0.01 },
    1.1,
  );

  // 1.6–2.3: current flows out along the traces.
  tl.fromTo(
    q("[data-boot-trace]"),
    { strokeDasharray: 1, strokeDashoffset: 1 },
    { strokeDashoffset: 0, duration: 0.45, ease: "power1.in", stagger: 0.008 },
    1.6,
  );

  // 2.3–2.8: ends become nodes, cyan → violet, the network pulses.
  const nodes = q<SVGCircleElement>("[data-boot-node]");
  tl.fromTo(
    nodes,
    { scale: 0, opacity: 0, transformOrigin: "50% 50%" },
    { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(3)", stagger: 0.006 },
    2.15,
  );
  if (svg) tl.to(svg, { color: VIOLET, duration: 0.5 }, 2.3);
  tl.to(chip, { opacity: 0, duration: 0.35 }, 2.35);
  tl.to(q("[data-boot-synapses]"), { opacity: 0.55, duration: 0.35 }, 2.35);
  tl.to(
    nodes,
    { scale: 1.7, duration: 0.14, yoyo: true, repeat: 1, stagger: { each: 0.006, from: "random" } },
    2.5,
  );

  // 2.8–3.2: the network contracts, the name resolves, the page appears.
  if (svg) tl.to(svg, { scale: 0.45, opacity: 0, duration: 0.4, ease: "power2.in" }, 2.75);
  if (canvas && drawName) {
    const scramble = { p: 0 };
    tl.set(canvas, { opacity: 1 }, 2.74);
    tl.to(
      scramble,
      { p: 1, duration: 0.28, ease: "none", onUpdate: () => drawName(scramble.p) },
      2.74,
    );
  }
  tl.to(skipButton ?? [], { autoAlpha: 0, duration: 0.15 }, 2.9);
  tl.to(bg ?? [], { opacity: 0, duration: 0.13, ease: "power1.out" }, 3.02);
  tl.to(root, { opacity: 0, duration: 0.01 }, 3.15); // ends at 3.16 s

  // The black screen and caret have been on screen since first paint while GSAP downloaded:
  // start the timeline at the matching point so the whole intro stays within 3.2 s of first
  // paint. On a slow download the first log lines simply appear already typed (capped at 0.6 s,
  // so the log is always seen).
  const painted = performance.getEntriesByName("first-contentful-paint")[0]?.startTime;
  if (catchUp && painted !== undefined)
    tl.time(Math.min(0.6, Math.max(0, (performance.now() - painted) / 1000)));

  // Skip: any click, wheel, touch or key jumps to the final state in 300 ms.
  const skip = () => {
    if (finished) return;
    removeSkip();
    tl.kill();
    gsap.to(root, { opacity: 0, duration: 0.3, ease: "power2.out", onComplete: finish });
  };
  // Only things the visitor does: a `scroll` event also fires when the browser restores the
  // scroll position on Back, which would skip the intro before it is seen.
  const events = ["pointerdown", "wheel", "touchstart", "keydown"] as const;
  const opts = { capture: true, passive: true } as const;
  function removeSkip() {
    for (const type of events) window.removeEventListener(type, skip, opts);
  }
  for (const type of events) window.addEventListener(type, skip, opts);

  return () => {
    removeSkip();
    tl.kill();
  };
}
