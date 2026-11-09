/**
 * The synthesizer behind the site's sound (Web Audio, no files). Loaded lazily by lib/sound.ts
 * the moment the browser allows audio, so none of it is in the page's initial JavaScript.
 *
 *   play("tick")  soft click for hovers and confirmations
 *   play("hum")   "power-on" hum
 *   playIntro()   the boot intro's score, scene by scene (SPEC §4 storyboard), from any point
 *   ambient       a dark, slowly breathing pad with sparse echoing "data" notes; its filter
 *                 opens as the visitor scrolls (circuit → neural), muted in hidden tabs
 */

let ac: AudioContext | null = null;
let master: GainNode | null = null;
let introBus: GainNode | null = null;
let noise: AudioBuffer | null = null;
let lastTick = 0;
let ambient: { stop: () => void } | null = null;

const MASTER = 0.9;
/** A minor pentatonic, the site's palette of notes. */
const PENTA = [440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];

export function attach(ctx: AudioContext) {
  if (ac === ctx) return;
  ac = ctx;
  master = ctx.createGain();
  master.gain.value = MASTER;
  master.connect(ctx.destination);
  noise = makeNoise(ctx);
  // Hidden tab: fade everything out (the context keeps running, so it returns instantly).
  document.addEventListener("visibilitychange", () => {
    if (!ac || !master) return;
    master.gain.setTargetAtTime(document.hidden ? 0 : MASTER, ac.currentTime, 0.15);
  });
}

// --- building blocks ------------------------------------------------------------------------

function makeNoise(ctx: AudioContext): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/** One enveloped oscillator note. */
function tone(
  dest: AudioNode,
  t: number,
  freq: number,
  dur: number,
  peak: number,
  type: OscillatorType = "sine",
  attack = 0.008,
  glideTo?: number,
) {
  if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** Band-passed noise whose centre frequency sweeps from f0 to f1. */
function sweep(
  dest: AudioNode,
  t: number,
  dur: number,
  f0: number,
  f1: number,
  peak: number,
  q = 1.2,
) {
  if (!ac || !noise) return;
  const src = ac.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = q;
  bp.frequency.setValueAtTime(f0, t);
  bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(g).connect(dest);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

// --- one-shots ------------------------------------------------------------------------------

export function play(kind: "tick" | "hum") {
  if (!ac || !master) return;
  const now = ac.currentTime;
  if (kind === "tick") {
    if (now - lastTick < 0.04) return; // never a machine-gun on fast mouse moves
    lastTick = now;
    tone(master, now, 1800, 0.05, 0.035, "triangle", 0.004, 900);
    return;
  }
  // hum: two detuned low saws through a low-pass, plus a soft rising "power-on" sine.
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 220;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.06, now + 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
  lp.connect(g).connect(master);
  for (const f of [55, 55.7]) {
    const o = ac.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = f;
    o.connect(lp);
    o.start(now);
    o.stop(now + 1.7);
  }
  tone(master, now + 0.2, 220, 0.9, 0.02, "sine", 0.3, 880);
}

// --- the boot intro's score -----------------------------------------------------------------

/**
 * Schedules the intro soundtrack, aligned with the GSAP timeline in BootIntro (times in seconds
 * from the intro's start). `from` is where the timeline is now: earlier events are skipped, so a
 * visitor who unlocks audio mid-intro hears the rest in sync.
 */
export function playIntro(from: number) {
  if (!ac || !master) return;
  introBus = ac.createGain();
  introBus.gain.value = 1;
  introBus.connect(master);
  const bus = introBus;
  const base = ac.currentTime - from;
  const at = (time: number, fn: (t: number) => void) => {
    if (time >= from - 0.02) fn(base + Math.max(time, from));
  };

  // 0.0 — power applied: a deep thump.
  at(0, (t) => {
    tone(bus, t, 70, 0.5, 0.09, "sine", 0.005, 40);
    sweep(bus, t, 0.12, 2400, 600, 0.03, 0.8);
  });
  // 0.3–1.0 — firmware log: fast typing clicks per line, a light chime on each green OK.
  [0, 1, 2, 3].forEach((line) => {
    const start = 0.3 + line * 0.17;
    for (let k = 0; k < 6; k++) {
      at(start + k * 0.02, (t) =>
        tone(bus, t, 2600 + Math.random() * 600, 0.018, 0.012, "square", 0.002),
      );
    }
    if (line < 3) {
      at(start + 0.13, (t) => {
        tone(bus, t, 1318.51, 0.09, 0.016, "sine", 0.004);
        tone(bus, t + 0.05, 1760, 0.14, 0.014, "sine", 0.004);
      });
    }
  });
  // 1.0–1.6 — the log collapses into the chip: a descending whoosh, then the chip powers up.
  at(1.0, (t) => sweep(bus, t, 0.5, 3200, 380, 0.045, 1.4));
  at(1.1, (t) => {
    tone(bus, t, 110, 0.5, 0.05, "sine", 0.04, 440);
    tone(bus, t, 220, 0.5, 0.012, "triangle", 0.04, 880);
  });
  at(1.55, (t) => tone(bus, t, 60, 0.18, 0.06, "sine", 0.004, 45)); // the chip locks in
  // 1.6–2.3 — current flows out along the traces: an electric crackle and a rising arpeggio.
  at(1.6, (t) => sweep(bus, t, 0.6, 1400, 5200, 0.022, 6));
  [0, 1, 2, 3, 4, 5].forEach((i) => {
    at(1.62 + i * 0.075, (t) => tone(bus, t, PENTA[i] ?? 880, 0.16, 0.022, "sine", 0.005));
  });
  // 2.3–2.8 — the network forms: a soft chord swells, nodes pulse.
  at(2.3, (t) => {
    if (!ac) return;
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1800;
    lp.connect(bus);
    for (const f of [220, 261.63, 329.63, 493.88]) tone(lp, t, f, 1.1, 0.016, "triangle", 0.25);
  });
  [0, 1, 2].forEach((i) =>
    at(2.5 + i * 0.08, (t) => tone(bus, t, 880, 0.08, 0.018, "sine", 0.003)),
  );
  // 2.74–3.02 — the name resolves: quick glitchy blips.
  for (let i = 0; i < 9; i++) {
    at(2.74 + i * 0.03, (t) =>
      tone(
        bus,
        t,
        PENTA[4 + Math.floor(Math.random() * 5)] ?? 1046.5,
        0.03,
        0.008,
        "square",
        0.002,
      ),
    );
  }
  // 3.06 — resolved: a low impact and a clean bell.
  at(3.06, (t) => {
    tone(bus, t, 55, 0.7, 0.08, "sine", 0.005, 40);
    sweep(bus, t, 0.25, 900, 200, 0.03, 0.9);
    tone(bus, t, 880, 1.6, 0.035, "sine", 0.004);
    tone(bus, t, 1318.51, 1.4, 0.016, "sine", 0.004);
  });
}

/** Skip: fade the rest of the intro score out quickly. */
export function stopIntro() {
  if (!ac || !introBus) return;
  const bus = introBus;
  introBus = null;
  bus.gain.setTargetAtTime(0, ac.currentTime, 0.08);
  window.setTimeout(() => bus.disconnect(), 800);
}

// --- background ambience --------------------------------------------------------------------

export function startAmbient() {
  if (ambient || !ac || !master) return;
  const ctx = ac;
  const t = ctx.currentTime;

  const bus = ctx.createGain();
  bus.gain.setValueAtTime(0.0001, t);
  bus.gain.exponentialRampToValueAtTime(1, t + 4);
  bus.connect(master);

  // Pad: A2 + E3, each two slightly detuned saws, through a low-pass that breathes slowly.
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 340;
  lp.Q.value = 0.8;
  const pad = ctx.createGain();
  pad.gain.value = 0.02;
  pad.connect(lp).connect(bus);
  const voices: OscillatorNode[] = [];
  for (const [f, detune] of [
    [110, -7],
    [110, 6],
    [164.81, -5],
    [164.81, 8],
  ] as const) {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = f;
    o.detune.value = detune;
    o.connect(pad);
    o.start(t);
    voices.push(o);
  }
  // Sub: a quiet A1 for warmth.
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.frequency.value = 55;
  subGain.gain.value = 0.014;
  sub.connect(subGain).connect(bus);
  sub.start(t);
  voices.push(sub);
  // Breathing: a very slow LFO on the filter.
  const lfo = ctx.createOscillator();
  const lfoDepth = ctx.createGain();
  lfo.frequency.value = 0.06;
  lfoDepth.gain.value = 120;
  lfo.connect(lfoDepth).connect(lp.frequency);
  lfo.start(t);
  voices.push(lfo);

  // Sparse "data" notes through an echo.
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.33;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.35;
  const wet = ctx.createGain();
  wet.gain.value = 0.5;
  delay.connect(feedback).connect(delay);
  delay.connect(wet).connect(bus);
  let timer = 0;
  const blip = () => {
    if (!document.hidden) {
      const now = ctx.currentTime;
      const f = PENTA[Math.floor(Math.random() * 6)] ?? 880;
      tone(delay, now, f, 0.5, 0.01, "sine", 0.01);
      tone(bus, now, f, 0.5, 0.01, "sine", 0.01);
    }
    timer = window.setTimeout(blip, 2600 + Math.random() * 3200);
  };
  timer = window.setTimeout(blip, 3000);

  // The filter opens a little as the page scrolls toward the neural sections.
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    lp.frequency.setTargetAtTime(340 + p * 520, ctx.currentTime, 0.6);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  ambient = {
    stop: () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      const now = ctx.currentTime;
      bus.gain.cancelScheduledValues(now);
      bus.gain.setTargetAtTime(0, now, 0.4);
      window.setTimeout(() => {
        for (const v of voices) v.stop();
        bus.disconnect();
      }, 2000);
    },
  };
}

export function stopAmbient() {
  ambient?.stop();
  ambient = null;
}
