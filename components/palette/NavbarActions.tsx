"use client";

import { Search, Volume2, VolumeX } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { t } from "@/lib/i18n";
import {
  justUnlocked,
  play,
  SOUND_EVENT,
  setSound,
  soundActive,
  soundEnabled,
  unlockAudio,
} from "@/lib/sound";
import type { PaletteData } from "./CommandPalette";
import { useShortcutLabel } from "./platform";

// cmdk + the palette load on first open only.
const CommandPalette = dynamic(() => import("./CommandPalette"), { ssr: false });

/** Window event that opens the palette (the footer hint and the terminal fire it). */
export const OPEN_PALETTE = "palette:open";

const subscribeSound = (cb: () => void) => {
  window.addEventListener(SOUND_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(SOUND_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};

/**
 * Navbar tools (SPEC §5 persistent UI): the ⌘K / Ctrl+K palette button and the sound toggle.
 * The shortcut works anywhere on the site. With sound on, links and buttons tick on hover.
 */
export function NavbarActions({ data }: { data: PaletteData }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Shown as on only when sound is enabled *and* the browser lets the page play it.
  const sound = useSyncExternalStore(subscribeSound, soundActive, () => false);
  const shortcut = useShortcutLabel();
  // Where focus was when the palette opened: it goes back there on close (the dialog has no
  // Radix trigger to return to, since it opens from a shortcut or from several buttons).
  const returnTo = useRef<HTMLElement | null>(null);

  function show() {
    returnTo.current = document.activeElement as HTMLElement | null;
    setLoaded(true);
    setOpen(true);
  }
  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) window.setTimeout(() => returnTo.current?.focus({ preventScroll: true }), 0);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE, show);
    };
  }, []);

  // Audio may start only after a gesture: unlock it on the first click, tap or key.
  useEffect(() => {
    const opts = { capture: true, passive: true } as const;
    const unlock = () => {
      unlockAudio();
      for (const type of ["pointerdown", "keydown", "touchstart"] as const)
        window.removeEventListener(type, unlock, opts);
    };
    for (const type of ["pointerdown", "keydown", "touchstart"] as const)
      window.addEventListener(type, unlock, opts);
    return () => {
      for (const type of ["pointerdown", "keydown", "touchstart"] as const)
        window.removeEventListener(type, unlock, opts);
    };
  }, []);

  // Hover ticks, only while sound is on.
  useEffect(() => {
    if (!sound) return;
    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && (e.target as Element | null)?.closest?.("a, button"))
        play("tick");
    };
    document.addEventListener("pointerover", onOver, { passive: true });
    return () => document.removeEventListener("pointerover", onOver);
  }, [sound]);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={show}
        // The accessible name includes the visible shortcut text (WCAG 2.5.3).
        aria-label={`${t.palette.open} (${shortcut.label})`}
        aria-keyshortcuts={shortcut.aria}
        className="nav-tool"
      >
        <Search size={16} aria-hidden />
        <kbd className="hidden font-mono text-[11px] text-dim sm:inline">{shortcut.label}</kbd>
      </button>
      <button
        type="button"
        onClick={() => {
          // The click that unlocked audio already played the hum: keep sound on.
          if (justUnlocked()) return;
          // Enabled but still blocked by the browser: this press wakes it rather than muting it.
          if (soundEnabled() && !sound) return unlockAudio();
          setSound(!sound);
        }}
        aria-pressed={sound}
        aria-label={t.sound.label}
        className="nav-tool"
      >
        {sound ? (
          <Volume2 size={16} aria-hidden />
        ) : (
          <VolumeX size={16} aria-hidden className="opacity-60" />
        )}
      </button>
      {loaded && <CommandPalette open={open} onOpenChange={onOpenChange} data={data} />}
    </div>
  );
}
