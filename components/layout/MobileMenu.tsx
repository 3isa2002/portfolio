"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { navLinks } from "./nav-links";

/** Small-screen navigation: a disclosure button with a panel under the navbar. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? t.a11y.closeMenu : t.a11y.openMenu}
        onClick={() => setOpen((o) => !o)}
        className="-me-2 grid size-11 place-items-center rounded-card text-text hover:bg-bg-elev-2"
      >
        {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-16 border-b border-line bg-bg/95 backdrop-blur-md"
      >
        <ul className="container-site flex flex-col py-3">
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="label flex min-h-12 items-center text-text hover:text-cyan"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
