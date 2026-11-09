"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

const GLASS_AFTER = 80;
const HIDE_AFTER = 160;

/**
 * Navbar behaviour (SPEC §5 persistent UI): transparent at the top, glass blur after 80px of
 * scroll, hidden while scrolling down, back on any scroll up. It never hides while it holds
 * keyboard focus or an open menu. Only `transform` and `opacity` change; with reduced motion
 * the global CSS rule makes both instant.
 */
export function NavbarShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const header = ref.current;
      const pinned =
        y < HIDE_AFTER ||
        !!header?.contains(document.activeElement) ||
        !!header?.querySelector("[aria-expanded='true']");
      setScrolled(y > GLASS_AFTER);
      if (pinned || y < last - 2) setHidden(false);
      else if (y > last + 2) setHidden(true);
      last = y;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const reveal = () => setHidden(false);
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    ref.current?.addEventListener("focusin", reveal);
    const header = ref.current;
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      header?.removeEventListener("focusin", reveal);
    };
  }, []);

  return (
    <header
      ref={ref}
      data-scrolled={scrolled || undefined}
      data-hidden={hidden || undefined}
      className="group/nav fixed inset-x-0 top-0 z-50 transition-transform duration-300 ease-out-expo data-hidden:-translate-y-full"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 border-b border-line bg-bg/75 opacity-0 backdrop-blur-md transition-opacity duration-300 group-data-scrolled/nav:opacity-100"
      />
      {children}
    </header>
  );
}
