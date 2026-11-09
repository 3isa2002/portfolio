"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { KONAMI, OVERCLOCK_EVENT } from "@/lib/overclock";
import { play } from "@/lib/sound";

// The rain only downloads once someone finds the egg.
const MatrixRain = dynamic(() => import("./MatrixRain"), { ssr: false });

/**
 * Konami easter egg (SPEC §7): ↑↑↓↓←→←→BA switches the background into a "matrix rain" of
 * binary and logs `> overclock mode enabled` in the contact terminal; the code again turns it
 * off. Ignored while typing in a text field (except the terminal, where it is part of the fun).
 */
export function Konami() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    let progress = 0;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.matches?.("input:not(.terminal-input), textarea, [contenteditable=true]")) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      progress = key === KONAMI[progress] ? progress + 1 : key === KONAMI[0] ? 1 : 0;
      if (progress === KONAMI.length) {
        progress = 0;
        setOn((was) => {
          const next = !was;
          window.dispatchEvent(new CustomEvent(OVERCLOCK_EVENT, { detail: next }));
          return next;
        });
        play("hum");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return on ? <MatrixRain /> : null;
}
