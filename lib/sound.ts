/**
 * UI sound (SPEC §4, §7): on by default (Mohamed's decision, 2026-11-09), toggled from the navbar
 * or the command palette, remembered in localStorage. Every sound is synthesized with the Web
 * Audio API, so there are no audio files to download.
 *
 *   tick  a short, soft click for hovers and confirmations
 *   hum   a low boot hum with a rising "power-on" tone
 *
 * Browsers keep a page silent until the visitor's first click, tap or key (autoplay policy), so:
 * - the navbar icon shows sound as active only once audio can really play (`soundActive`);
 * - the moment audio becomes available, the hum plays once, so that first interaction is heard;
 * - a press on the sound button that is what unlocked audio does not also switch sound off
 *   (`justUnlocked`).
 */
const KEY = "sound";
/** Fired when the setting changes or audio becomes (un)available. */
export const SOUND_EVENT = "sound:change";

let ctx: AudioContext | null = null;
let lastTick = 0;
/** Whether the hum has greeted the visitor since audio last became available / sound was enabled. */
let greeted = false;
let unlockedAt = -Infinity;

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
    greet();
  }
  window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: on }));
}

function greet() {
  if (greeted || !soundEnabled() || ctx?.state !== "running") return;
  greeted = true;
  playNow(ctx, "hum");
}

function audio(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  if (!ctx) {
    const ac = new AudioContext();
    ctx = ac;
    ac.addEventListener("statechange", () => {
      if (ac.state === "running") unlockedAt = performance.now();
      greet();
      window.dispatchEvent(new CustomEvent(SOUND_EVENT));
    });
    // Created during a gesture, a context can start out running (no statechange follows).
    if (ac.state === "running") {
      unlockedAt = performance.now();
      queueMicrotask(() => {
        greet();
        window.dispatchEvent(new CustomEvent(SOUND_EVENT));
      });
    }
  }
  // Suspended until the browser allows audio; resume() takes effect after a gesture.
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}

export function play(kind: "tick" | "hum") {
  if (!soundEnabled()) return;
  const ac = audio();
  // Not allowed yet: stay silent. The first interaction plays the hum (see greet).
  if (!ac || ac.state !== "running") return;
  if (kind === "hum") greeted = true;
  playNow(ac, kind);
}

function playNow(ac: AudioContext, kind: "tick" | "hum") {
  const now = ac.currentTime;
  const out = ac.createGain();
  out.connect(ac.destination);

  if (kind === "tick") {
    if (now - lastTick < 0.04) return; // never a machine-gun on fast mouse moves
    lastTick = now;
    const osc = ac.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.03);
    out.gain.setValueAtTime(0.0001, now);
    out.gain.exponentialRampToValueAtTime(0.035, now + 0.004);
    out.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.connect(out);
    osc.start(now);
    osc.stop(now + 0.06);
    return;
  }

  // hum: two detuned low oscillators swelling in, plus a soft rising "power-on" tone.
  out.gain.setValueAtTime(0.0001, now);
  out.gain.exponentialRampToValueAtTime(0.06, now + 0.35);
  out.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
  for (const f of [55, 55.7]) {
    const o = ac.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = f;
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 220;
    o.connect(lp).connect(out);
    o.start(now);
    o.stop(now + 1.7);
  }
  const rise = ac.createOscillator();
  const g = ac.createGain();
  rise.type = "sine";
  rise.frequency.setValueAtTime(220, now + 0.2);
  rise.frequency.exponentialRampToValueAtTime(880, now + 0.9);
  g.gain.setValueAtTime(0.0001, now + 0.2);
  g.gain.exponentialRampToValueAtTime(0.02, now + 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
  rise.connect(g).connect(ac.destination);
  rise.start(now + 0.2);
  rise.stop(now + 1.2);
}
