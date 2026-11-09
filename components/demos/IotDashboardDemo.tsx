"use client";

import { Fan } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { mulberry32 } from "@/lib/random";

const s = t.demos.iot;
const POINTS = 40;
const W = 400;
const H = 140;
const TEMP = { min: 18, max: 34 };
const HUM = { min: 30, max: 80 };

type Sample = { temp: number; hum: number };

/**
 * IoT dashboard demo (SPEC §6): a simulated live temperature/humidity chart and a relay toggle.
 * A new reading arrives every second (generated in the browser: slow drift + noise); switching
 * the "fan relay" on cools the room and dries the air, off lets it warm up again. Pauses while
 * off screen or in a hidden tab. Readings are plain text (no live region: once a second would
 * flood a screen reader); the chart itself is decorative.
 */
export default function IotDashboardDemo() {
  const [relay, setRelay] = useState(false);
  const [data, setData] = useState<Sample[]>(() => seed());
  const root = useRef<HTMLElement>(null);
  const relayRef = useRef(relay);
  useEffect(() => {
    relayRef.current = relay;
  }, [relay]);

  useEffect(() => {
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e?.isIntersecting ?? true;
    });
    if (root.current) io.observe(root.current);
    const id = window.setInterval(() => {
      if (!visible || document.hidden) return;
      setData((d) => [
        ...d.slice(1),
        next(d[d.length - 1] ?? { temp: 26, hum: 55 }, relayRef.current, Math.random),
      ]);
    }, 1000);
    return () => {
      window.clearInterval(id);
      io.disconnect();
    };
  }, []);

  const last = data[data.length - 1] ?? { temp: 0, hum: 0 };
  const line = (key: keyof Sample, range: { min: number; max: number }) =>
    data
      .map((p, i) => {
        const x = (i / (POINTS - 1)) * W;
        const y = H - ((p[key] - range.min) / (range.max - range.min)) * H;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <section ref={root} aria-label={s.title} className="p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Reading label={s.temperature} value={`${last.temp.toFixed(1)} °C`} color="text-cyan" />
        <Reading label={s.humidity} value={`${last.hum.toFixed(0)} %`} color="text-violet-ink" />
        <div className="card col-span-2 flex items-center justify-between gap-3 p-4 sm:col-span-1">
          <span className="label text-dim">{s.relay}</span>
          <button
            type="button"
            role="switch"
            aria-checked={relay}
            onClick={() => setRelay((r) => !r)}
            className="relay-switch"
          >
            <Fan size={16} aria-hidden className={relay ? "relay-spin" : ""} />
            <span className="font-mono text-xs">{relay ? s.on : s.off}</span>
          </button>
        </div>
      </div>

      <figure className="mt-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-40 w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="var(--border)" />
          ))}
          <polyline
            points={line("hum", HUM)}
            fill="none"
            stroke="var(--violet)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={line("temp", TEMP)}
            fill="none"
            stroke="var(--cyan)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <figcaption className="mt-2 font-mono text-[11px] text-dim">{s.chart}</figcaption>
      </figure>
      <p className="mt-3 text-xs text-dim">{s.note}</p>
    </section>
  );
}

function Reading({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card p-4">
      <p className="label text-dim">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function next(prev: Sample, relayOn: boolean, rand: () => number): Sample {
  const noise = () => (rand() - 0.5) * 0.35;
  const temp = prev.temp + (relayOn ? -0.18 : 0.08) + noise();
  const hum = prev.hum + (relayOn ? -0.35 : 0.15) + noise() * 2;
  return {
    temp: Math.min(TEMP.max - 0.5, Math.max(TEMP.min + 0.5, temp)),
    hum: Math.min(HUM.max - 1, Math.max(HUM.min + 1, hum)),
  };
}

/** Seeded, so the prerendered chart and the hydrated one are identical. */
function seed(): Sample[] {
  const rand = mulberry32(7);
  const out: Sample[] = [];
  let p: Sample = { temp: 25.5, hum: 52 };
  for (let i = 0; i < POINTS; i++) out.push((p = next(p, false, rand)));
  return out;
}
