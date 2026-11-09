/**
 * Runs `callback` once, on the visitor's first interaction (scroll, wheel, pointer, touch, key)
 * or after `fallbackMs`, whichever comes first. Heavy client code (the motion engine, the 3D
 * scene) waits for this so none of it competes with the first paint and hydration.
 * Returns a cancel function.
 */
const WAKE_EVENTS = [
  "scroll",
  "wheel",
  "pointermove",
  "pointerdown",
  "touchstart",
  "keydown",
] as const;

/** Window events fired by the boot intro (components/intro/BootIntro.tsx). */
export const INTRO_START = "intro:start";
export const INTRO_DONE = "intro:done";

export function onFirstInteraction(
  callback: () => void,
  fallbackMs = 4000,
  /** Extra window events that also count as "wake up", e.g. the end of the boot intro. */
  extraEvents: readonly string[] = [],
): () => void {
  let done = false;
  const opts = { passive: true, capture: true } as const;
  const events = [...WAKE_EVENTS, ...extraEvents];
  const stop = () => {
    for (const type of events) window.removeEventListener(type, fire, opts);
    window.clearTimeout(timer);
  };
  function fire() {
    if (done) return;
    done = true;
    stop();
    callback();
  }
  for (const type of events) window.addEventListener(type, fire, opts);
  const timer = window.setTimeout(fire, fallbackMs);
  return () => {
    done = true;
    stop();
  };
}

/** `requestIdleCallback` with a timeout, falling back to a short timer (Safari). */
export function whenIdle(callback: () => void, timeout = 1000): () => void {
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(callback, 50);
  return () => clearTimeout(id);
}
