/**
 * Optional UI sound (SPEC §4, §7): off by default, toggled from the navbar or the command
 * palette, remembered in localStorage. Every sound is synthesized with the Web Audio API, so
 * there are no audio files to download (SPEC: "files under 50 KB" — here, zero).
 *
 *   tick  a short, soft click for hovers and confirmations
 *   hum   a low boot hum with a rising tone (played when sound is switched on, and with the
 *         return-visit name scramble when sound is already on)
 */
const KEY = "sound";
export const SOUND_EVENT = "sound:change";

let ctx: AudioContext | null = null;
let lastTick = 0;

export function soundEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

export function setSound(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // Storage blocked: the setting lasts for this page only.
  }
  window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: on }));
  if (on) play("hum");
}

function audio(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  ctx ??= new AudioContext();
  // Browsers start the context suspended until a user gesture; resume when we can.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function play(kind: "tick" | "hum") {
  if (!soundEnabled()) return;
  const ac = audio();
  if (!ac || ac.state !== "running") return;
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
