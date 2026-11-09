/** Window event for the Konami easter egg (detail: true when overclock mode turns on). */
export const OVERCLOCK_EVENT = "overclock";

/** ↑ ↑ ↓ ↓ ← → ← → B A (SPEC §7). */
export const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
] as const;
