"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/motion/media";

const TYPE_MS = 55;
const DELETE_MS = 28;
const HOLD_MS = 1900;
const GAP_MS = 350;

/**
 * Hero rotating line (SPEC §5.1): each line is typed, held, then deleted, in a loop.
 *
 * Every line is also rendered invisibly in the same grid cell, so the box is always as tall as
 * the longest line: typing never changes the layout (no CLS, even where a line wraps on phones).
 * The prerendered HTML shows the first line in full; with reduced motion it stays that way.
 * Pauses while the hero is off screen or the tab is hidden. Screen readers get the full list
 * from the sr-only text in the hero, so this element is aria-hidden.
 */
export function TypedLines({ lines }: { lines: readonly string[] }) {
  const reduced = useReducedMotion();
  const [text, setText] = useState(lines[0] ?? "");
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    if (reduced || lines.length < 2 || !el) return;

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    io.observe(el);

    let line = 0;
    let chars = lines[0]?.length ?? 0;
    let deleting = true;
    let timer = window.setTimeout(step, HOLD_MS + 600);

    function step() {
      if (!visible || document.hidden) {
        timer = window.setTimeout(step, 400);
        return;
      }
      const current = lines[line] ?? "";
      if (deleting) {
        chars -= 1;
        if (chars <= 0) {
          chars = 0;
          deleting = false;
          line = (line + 1) % lines.length;
          setText("");
          timer = window.setTimeout(step, GAP_MS);
          return;
        }
        setText(current.slice(0, chars));
        timer = window.setTimeout(step, DELETE_MS);
        return;
      }
      chars += 1;
      setText(current.slice(0, chars));
      if (chars >= current.length) {
        deleting = true;
        timer = window.setTimeout(step, HOLD_MS);
        return;
      }
      timer = window.setTimeout(step, TYPE_MS);
    }

    return () => {
      window.clearTimeout(timer);
      io.disconnect();
    };
  }, [reduced, lines]);

  return (
    <span ref={root} aria-hidden className="inline-grid align-top">
      {lines.map((l) => (
        <span key={l} className="caret invisible col-start-1 row-start-1">
          {l}
        </span>
      ))}
      <span className="caret col-start-1 row-start-1">{reduced ? lines[0] : text}</span>
    </span>
  );
}
