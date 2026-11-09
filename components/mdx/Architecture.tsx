import { useId } from "react";
import { t } from "@/lib/i18n";

type ArchNode = {
  id: string;
  label: string;
  /** Second line, e.g. the part number or the framework. */
  note?: string;
  /** Accent: hardware (cyan), AI (violet) or neutral. */
  kind?: "hw" | "ai" | "data";
};

type ArchitectureProps = {
  nodes: ArchNode[];
  /** [from, to] node ids. */
  edges: [string, string][];
  /** Accessible description of the whole diagram. */
  title?: string;
};

const W = 168; // node width
const H = 58; // node height
const COL = 236; // horizontal distance between ranks (desktop)
const ROW = 84; // vertical distance between nodes of one rank (desktop)
const MW = 150; // node width (mobile)
const MCOL = 172; // horizontal distance between nodes of one rank (mobile)
const MROW = 118; // vertical distance between ranks (mobile)

const STROKE = { hw: "var(--cyan)", ai: "var(--violet)", data: "var(--text-dim)" } as const;

/**
 * Architecture diagram for case studies (SPEC §6), drawn at build time as SVG from MDX:
 *
 *   <Architecture
 *     nodes={[{ id: "mic", label: "INMP441", note: "I²S mic", kind: "hw" }, …]}
 *     edges={[["mic", "esp"], …]}
 *   />
 *
 * Nodes are placed in ranks by their longest path from a source (left → right on desktop,
 * top → bottom on phones). Lines carry small "packets" (SVG animateMotion, no JavaScript;
 * hidden with reduced motion). The motion engine draws boxes and lines in when scrolled to.
 */
export function Architecture({ nodes, edges, title }: ArchitectureProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const rank = ranks(nodes, edges);
  const byRank: ArchNode[][] = [];
  for (const n of nodes) (byRank[rank.get(n.id) ?? 0] ??= []).push(n);
  const maxPerRank = Math.max(1, ...byRank.map((r) => r?.length ?? 0));
  const ranksCount = byRank.length;
  const label = title ?? t.architecture.label;

  // Desktop: ranks are columns.
  const wide = new Map<string, { x: number; y: number }>();
  byRank.forEach((col, r) =>
    col?.forEach((n, i) => {
      const offset = ((maxPerRank - col.length) * ROW) / 2;
      wide.set(n.id, { x: r * COL, y: offset + i * ROW });
    }),
  );
  const wideW = (ranksCount - 1) * COL + W;
  const wideH = (maxPerRank - 1) * ROW + H;

  // Phones: ranks are rows.
  const tall = new Map<string, { x: number; y: number }>();
  byRank.forEach((row, r) =>
    row?.forEach((n, i) => {
      const offset = ((maxPerRank - row.length) * MCOL) / 2;
      tall.set(n.id, { x: offset + i * MCOL, y: r * MROW });
    }),
  );
  const tallW = (maxPerRank - 1) * MCOL + MW;
  const tallH = (ranksCount - 1) * MROW + H;

  const diagram = (
    layout: Map<string, { x: number; y: number }>,
    w: number,
    h: number,
    nodeW: number,
    vertical: boolean,
    key: string,
  ) => {
    const paths = edges.flatMap(([from, to], i) => {
      const a = layout.get(from);
      const b = layout.get(to);
      if (!a || !b) return [];
      const d = vertical
        ? curve(a.x + nodeW / 2, a.y + H, b.x + nodeW / 2, b.y, true)
        : curve(a.x + nodeW, a.y + H / 2, b.x, b.y + H / 2, false);
      const kind = nodes.find((n) => n.id === to)?.kind ?? "data";
      return [{ id: `${uid}${key}e${i}`, d, color: STROKE[kind] }];
    });
    return (
      <svg
        viewBox={`-8 -8 ${w + 16} ${h + 16}`}
        className={`architecture-svg ${vertical ? "md:hidden" : "hidden md:block"}`}
        role="img"
        aria-label={label}
        data-arch
      >
        <g fill="none" strokeWidth="1.5">
          {paths.map((p) => (
            <path
              key={p.id}
              id={p.id}
              d={p.d}
              stroke={p.color}
              strokeOpacity="0.55"
              pathLength={1}
              data-arch-edge
            />
          ))}
        </g>
        <g className="arch-packets" data-arch-packets>
          {paths.flatMap((p, i) =>
            [0, 1].map((k) => (
              <circle key={`${p.id}-${k}`} r="2.6" fill={p.color}>
                <animateMotion
                  dur="2.4s"
                  begin={`${(i * 0.37 + k * 1.2) % 2.4}s`}
                  repeatCount="indefinite"
                >
                  <mpath href={`#${p.id}`} />
                </animateMotion>
              </circle>
            )),
          )}
        </g>
        {nodes.map((n) => {
          const p = layout.get(n.id);
          if (!p) return null;
          const stroke = STROKE[n.kind ?? "data"];
          return (
            <g key={n.id} transform={`translate(${p.x} ${p.y})`} data-arch-node>
              <rect
                width={nodeW}
                height={H}
                rx="10"
                fill="var(--bg-elev)"
                stroke={stroke}
                strokeOpacity="0.6"
              />
              <text x={nodeW / 2} y={n.note ? 25 : 33} textAnchor="middle" className="arch-label">
                {n.label}
              </text>
              {n.note && (
                <text x={nodeW / 2} y="43" textAnchor="middle" className="arch-note">
                  {n.note}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <figure className="not-prose architecture card p-4 sm:p-6">
      {diagram(wide, wideW, wideH, W, false, "w")}
      {diagram(tall, tallW, tallH, MW, true, "t")}
    </figure>
  );
}

/** Longest-path rank from the sources; back edges of any cycle are ignored. */
function ranks(nodes: ArchNode[], edges: [string, string][]): Map<string, number> {
  const rank = new Map(nodes.map((n) => [n.id, 0]));
  for (let pass = 0; pass < nodes.length; pass++) {
    let changed = false;
    for (const [from, to] of edges) {
      const next = (rank.get(from) ?? 0) + 1;
      if (rank.has(to) && next > (rank.get(to) ?? 0) && next < nodes.length) {
        rank.set(to, next);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return rank;
}

function curve(x1: number, y1: number, x2: number, y2: number, vertical: boolean): string {
  if (vertical) {
    const my = (y1 + y2) / 2;
    return `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`;
  }
  const mx = (x1 + x2) / 2;
  return `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
}
