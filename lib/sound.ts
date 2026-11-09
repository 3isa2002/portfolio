/**
 * UI sound (SPEC §4, §7): on by default (Mohamed's decision, 2026-11-09), toggled from the navbar
 * or the command palette, remembered in localStorage. All sounds are synthesized (Web Audio, no
 * files) by lib/audio-engine.ts, which loads only once the browser allows audio.
 *
 * Browsers keep a page silent until the visitor's first click, tap or key (autoplay policy), so:
 * - the navbar icon shows sound as active only once audio can really play (`soundActive`);
 * - the moment audio becomes available, the site "powers on": the boot intro's score if the
 *   intro is playing (from where it is), otherwise a hum; then the background ambience starts;
 * - a press on the sound button that is what unlocked audio does not also mute it (`justUnlocked`).
 */
type Engine = typeof import("./audio-engine");

const KEY = "sound";
/** Fired when the setting changes or audio becomes (un)available. */
export const SOUND_EVENT = "sound:change";

let ctx: AudioContext | null = null;
let engine: Engine | null = null;
let loading: Promise<Engine> | null = null;
/** Whether the visitor has been "greeted" (hum or intro score) since audio became available. */
let greeted = false;
let unlockedAt = -Infinity;
/** The boot intro while it plays: where its timeline is, and whether its score has started. */
let intro: { time: () => number; scored: boolean } | null = null;

export function soundEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

/** Sound is on and the browser lets the page play it right now. */
export function soundActive(): boolean {
  return soundEnabled() && ctx?.state === "running";
}

/** Sound is on but the browser has not allowed audio yet (no click, tap or key so far). */
export function soundWaiting(): boolean {
  return soundEnabled() && ctx?.state !== "running";
}

/** True for a moment after audio became available: that click was the unlock, not a toggle. */
export function justUnlocked(): boolean {
  return performance.now() - unlockedAt < 700;
}

/** Call on the visitor's first click / tap / key: browsers allow audio only after a gesture. */
export function unlockAudio() {
  if (soundEnabled()) audio();
}

export function setSound(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // Storage blocked: the setting lasts for this page only.
  }
  if (on) {
    greeted = false;
    audio();
    wake();
  } else {
    engine?.stopIntro();
    engine?.stopAmbient();
  }
  window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: on }));
}

/** One-shot UI sounds. Silent until audio is available. */
export function play(kind: "tick" | "hum") {
  if (!soundActive()) return;
  if (engine) engine.play(kind);
  else void loadEngine();
}

/** BootIntro: its timeline started. `time` reports where the timeline is (seconds). */
export function introSoundStart(time: () => number) {
  intro = { time, scored: false };
  wake();
}

/** BootIntro: it finished (or was skipped, or the page changed). */
export function introSoundEnd(skipped: boolean) {
  const wasScored = intro?.scored ?? false;
  intro = null;
  if (skipped) engine?.stopIntro();
  // The score already said hello; otherwise a hum would, once audio is available.
  if (wasScored) greeted = true;
  wake();
}

function loadEngine(): Promise<Engine> {
  loading ??= import("./audio-engine").then((m) => (engine = m));
  return loading;
}

/** Audio is (or may now be) available: greet once, then keep the ambience going. */
function wake() {
  if (!soundActive()) return;
  void loadEngine().then((e) => {
    if (!ctx || !soundActive()) return;
    e.attach(ctx);
    if (intro) {
      if (!intro.scored) {
        intro.scored = true;
        greeted = true;
        e.playIntro(intro.time());
      }
      return; // the ambience starts when the intro ends
    }
    if (!greeted) {
      greeted = true;
      e.play("hum");
    }
    e.startAmbient();
  });
}

function audio(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  if (!ctx) {
    const ac = new AudioContext();
    ctx = ac;
    ac.addEventListener("statechange", () => {
      if (ac.state === "running") unlockedAt = performance.now();
      wake();
      window.dispatchEvent(new CustomEvent(SOUND_EVENT));
    });
    // Created during a gesture, a context can start out running (no statechange follows).
    if (ac.state === "running") {
      unlockedAt = performance.now();
      queueMicrotask(() => {
        wake();
        window.dispatchEvent(new CustomEvent(SOUND_EVENT));
      });
    }
  }
  // Suspended until the browser allows audio; resume() takes effect after a gesture.
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}
