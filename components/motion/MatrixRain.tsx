"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion/media";

const FONT = 16;
const CYAN = "#22d3ee";
const VIOLET = "#8b5cf6";

/**
 * "Overclock mode" background (Konami easter egg): columns of falling binary over the page
 * background, cyan on the left blending to violet on the right. ~30 fps, paused in hidden tabs;
 * with reduced motion a single still frame is drawn instead.
 */
export default function MatrixRain() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    let drops: number[] = [];
    let raf = 0;
    let last = 0;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = window.innerWidth * dpr;
      c.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${FONT}px ui-monospace, monospace`;
      const cols = Math.ceil(window.innerWidth / FONT);
      drops = Array.from({ length: cols }, () =>
        Math.floor((Math.random() * window.innerHeight) / FONT),
      );
      ctx.fillStyle = "#07070b";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    };

    const gradient = () => {
      const g = ctx.createLinearGradient(0, 0, window.innerWidth, 0);
      g.addColorStop(0, CYAN);
      g.addColorStop(1, VIOLET);
      return g;
    };

    const step = () => {
      ctx.fillStyle = "rgba(7, 7, 11, 0.09)";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.fillStyle = gradient();
      drops.forEach((y, i) => {
        ctx.fillText(Math.random() < 0.5 ? "0" : "1", i * FONT, y * FONT);
        drops[i] = y * FONT > window.innerHeight && Math.random() > 0.975 ? 0 : y + 1;
      });
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return;
      last = now;
      step();
    };

    resize();
    if (prefersReducedMotion()) {
      for (let i = 0; i < 40; i++) step();
    } else {
      raf = requestAnimationFrame(loop);
    }
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden className="matrix-rain" />;
}
