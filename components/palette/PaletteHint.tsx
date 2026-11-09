"use client";

import { t } from "@/lib/i18n";
import { OPEN_PALETTE } from "./NavbarActions";
import { useShortcutLabel } from "./platform";

/** Footer hint "try ⌘K" (SPEC §5 footer): also a button that opens the palette. */
export function PaletteHint() {
  const shortcut = useShortcutLabel();
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE))}
      className="font-mono text-xs text-dim underline-offset-4 hover:text-text hover:underline"
    >
      {t.footer.hint} <kbd>{shortcut.label}</kbd>
    </button>
  );
}
