"use client";

import { useEffect, useState } from "react";

type IndexItem = { id: string; label: string };

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Section index (SPEC §5 persistent UI): a small mono label on the right edge, `02 / 06 · About`,
 * following the section that crosses the middle of the viewport. Desktop only and decorative
 * (the headings carry the same information), so it is hidden from assistive tech.
 */
export function SectionIndex({ items }: { items: IndexItem[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = items.findIndex((item) => item.id === entry.target.id);
          if (i >= 0) setActive(i);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [items]);

  const current = items[active];
  if (!current) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed end-4 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
    >
      <p className="label text-dim [writing-mode:vertical-rl]">
        <span key={active} className="index-in inline-block text-cyan">
          {pad(active + 1)}
        </span>{" "}
        / {pad(items.length)} · {current.label}
      </p>
    </div>
  );
}
