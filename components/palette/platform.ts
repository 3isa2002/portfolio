import { useSyncExternalStore } from "react";

const subscribeNothing = () => () => {};

/** The palette shortcut as this device writes it: "⌘K" on Apple devices, "Ctrl K" elsewhere. */
export function useShortcutLabel(): { label: string; aria: string } {
  const mac = useSyncExternalStore(
    subscribeNothing,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => true,
  );
  return mac ? { label: "⌘K", aria: "Meta+K" } : { label: "Ctrl K", aria: "Control+K" };
}
