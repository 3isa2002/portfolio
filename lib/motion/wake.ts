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

export function onFirstInteraction(callback: () => void, fallbackMs = 4000): () => void {
  let done = false;
  const opts = { passive: true, capture: true } as const;
  const stop = () => {
    for (const type of WAKE_EVENTS) window.removeEventListener(type, fire, opts);
    window.clearTimeout(timer);
  };
  function fire() {
    if (done) return;
    done = true;
    stop();
    callback();
  }
  for (const type of WAKE_EVENTS) window.addEventListener(type, fire, opts);
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
