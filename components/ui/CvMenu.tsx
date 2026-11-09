"use client";

import { ChevronDown, Download } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { site } from "@/content/site";
import { t } from "@/lib/i18n";

/**
 * "Download CV" disclosure with the two CVs (SPEC §5.1).
 * A disclosure (not an ARIA menu): Tab moves through the links, Esc or an outside click closes it.
 */
export function CvMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const items = [
    { href: site.cv.ai, label: t.hero.cvAi, accent: "bg-violet" },
    { href: site.cv.embedded, label: t.hero.cvEmbedded, accent: "bg-cyan" },
  ];

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className="btn btn-ghost"
        data-magnetic
      >
        <Download size={16} aria-hidden />
        {t.hero.downloadCv}
        <ChevronDown
          size={16}
          aria-hidden
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <ul
        id={listId}
        hidden={!open}
        className="card absolute start-0 top-full z-20 mt-2 min-w-60 p-1.5 shadow-2xl shadow-black/50"
      >
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              download
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-lg px-3 font-mono text-sm hover:bg-bg-elev-2"
            >
              <span aria-hidden className={`size-2 rounded-full ${item.accent}`} />
              {item.label}
              <span className="ms-auto text-xs text-dim">PDF</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
