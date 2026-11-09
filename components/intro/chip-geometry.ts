import { mulberry32 } from "@/lib/random";

/**
 * SVG geometry for the boot intro (SPEC §4): a chip with pins on four sides, copper traces that
 * leave each pin, bend (right angles and 45° chamfers, like a PCB) and sometimes branch, and a
 * node at every trace end. The nodes are then wired to their nearest neighbours to form the
 * neural network. Generated once at build time from a fixed seed (viewBox -200 -200 400 400).
 */
type Point = [number, number];

export type ChipGeometry = {
  pins: string[];
  traces: string[];
  nodes: Point[];
  synapses: [Point, Point][];
};

const CHIP = 40; // half-size of the package
const PIN = 11; // pin length
const LIMIT = 186; // keep everything inside the viewBox

export function chipGeometry(seed = 2026): ChipGeometry {
  const rand = mulberry32(seed);
  const pins: string[] = [];
  const traces: string[] = [];
  const nodes: Point[] = [];
  const sides: { dir: Point; tan: Point }[] = [
    { dir: [1, 0], tan: [0, 1] },
    { dir: [-1, 0], tan: [0, 1] },
    { dir: [0, 1], tan: [1, 0] },
    { dir: [0, -1], tan: [1, 0] },
  ];
  const clamp = (v: number) => Math.max(-LIMIT, Math.min(LIMIT, v));
  const at = (p: Point, d: Point, len: number): Point => [
    clamp(p[0] + d[0] * len),
    clamp(p[1] + d[1] * len),
  ];
  const path = (pts: Point[]) =>
    pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

  for (const { dir, tan } of sides) {
    for (const k of [-28, -14, 0, 14, 28]) {
      const base: Point = [dir[0] * CHIP + tan[0] * k, dir[1] * CHIP + tan[1] * k];
      const tip = at(base, dir, PIN);
      pins.push(path([base, tip]));

      // Bend away from the chip's centre line, so traces fan out instead of crossing.
      const s = k === 0 ? (rand() < 0.5 ? -1 : 1) : Math.sign(k);
      const diag: Point = [
        (dir[0] + tan[0] * s) * Math.SQRT1_2,
        (dir[1] + tan[1] * s) * Math.SQRT1_2,
      ];
      const p1 = at(tip, dir, 14 + rand() * 30);
      const p2 = at(p1, diag, 18 + rand() * 30);
      const p3 = at(p2, dir, 20 + rand() * 60);
      traces.push(path([tip, p1, p2, p3]));
      nodes.push(p3);

      if (rand() < 0.45) {
        // A branch leaves the first run sideways, then heads outward again.
        const b1 = at(p1, [tan[0] * -s, tan[1] * -s], 16 + rand() * 18);
        const b2 = at(b1, dir, 30 + rand() * 50);
        traces.push(path([p1, b1, b2]));
        nodes.push(b2);
      }
    }
  }

  const synapses: [Point, Point][] = [];
  const seen = new Set<string>();
  nodes.forEach((a, i) => {
    const nearest = nodes
      .map((b, j) => ({ j, d: (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 }))
      .filter(({ j }) => j !== i)
      .sort((x, y) => x.d - y.d)
      .slice(0, 2);
    for (const { j } of nearest) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      const b = nodes[j];
      if (seen.has(key) || !b) continue;
      seen.add(key);
      synapses.push([a, b]);
    }
  });

  return { pins, traces, nodes, synapses };
}
