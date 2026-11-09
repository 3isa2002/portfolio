/**
 * Builds the particle network for the background (SPEC §7): one set of points with two layouts,
 * plus the lines of each layout. The GPU interpolates between the layouts, so this runs once per
 * particle count / aspect ratio, never per frame.
 *
 * - Circuit: PCB-like traces on a grid (straight runs, right-angle turns, short 45° chamfers),
 *   on three shallow depth layers. Lines join consecutive points of a trace.
 * - Neural: about 12% of the points become neurons in columns ("layers"), each joined to its
 *   three nearest neurons in the next column; the rest become a dim cloud of dust around them.
 *   Few, clear connections read as a network; joining every point made an unreadable hairball.
 *
 * Points are matched across layouts by sorting both on x, so each point travels a short way.
 * A seeded RNG keeps the picture identical between visits.
 */

export type Network = {
  count: number;
  /** xyz per point, circuit layout. */
  circuit: Float32Array;
  /** xyz per point, neural layout. */
  neural: Float32Array;
  /** 0..1 per point: drift phase, size and colour variation, morph stagger. */
  seeds: Float32Array;
  /** Per point in the neural layout: 1 = neuron, 0 = dust. */
  roles: Float32Array;
  /** Point index pairs. */
  edges: Uint32Array;
  /** Per edge: 0 = circuit line, 1 = neural line. */
  kinds: Uint8Array;
};

export function buildNetwork(count: number, halfW: number, halfH: number, seed = 7): Network {
  const rand = mulberry32(seed);
  const circuitEdges: number[] = [];
  const circuitPts = circuitLayout(count, halfW, halfH, rand, circuitEdges);
  const neuralPts = neuralLayout(count, halfW, halfH, rand);

  // Match by x so morphing moves points mostly up/down and in depth, not across the screen.
  const byXCircuit = order(count, (i) => circuitPts[i * 3] ?? 0);
  const byXNeural = order(count, (i) => neuralPts.positions[i * 3] ?? 0);
  const circuit = new Float32Array(count * 3);
  const neural = new Float32Array(count * 3);
  const layerOf = new Int32Array(count);
  const seeds = new Float32Array(count);
  const roles = new Float32Array(count);
  // Point k (in circuit order) keeps its circuit position and takes the k-th neural position.
  const circuitIndexToPoint = new Int32Array(count);
  for (let k = 0; k < count; k++) {
    const ci = byXCircuit[k] ?? 0;
    const ni = byXNeural[k] ?? 0;
    circuitIndexToPoint[ci] = k;
    circuit.set(circuitPts.subarray(ci * 3, ci * 3 + 3), k * 3);
    neural.set(neuralPts.positions.subarray(ni * 3, ni * 3 + 3), k * 3);
    layerOf[k] = neuralPts.layers[ni] ?? -1;
    roles[k] = (neuralPts.layers[ni] ?? -1) >= 0 ? 1 : 0;
    seeds[k] = rand();
  }

  const edges: number[] = [];
  const kinds: number[] = [];
  for (let e = 0; e < circuitEdges.length; e += 2) {
    edges.push(
      circuitIndexToPoint[circuitEdges[e] ?? 0] ?? 0,
      circuitIndexToPoint[circuitEdges[e + 1] ?? 0] ?? 0,
    );
    kinds.push(0);
  }
  neuralEdges(count, neural, layerOf, neuralPts.layerCount, edges, kinds);

  return {
    count,
    circuit,
    neural,
    seeds,
    roles,
    edges: Uint32Array.from(edges),
    kinds: Uint8Array.from(kinds),
  };
}

function circuitLayout(
  count: number,
  halfW: number,
  halfH: number,
  rand: () => number,
  edges: number[],
): Float32Array {
  const pts = new Float32Array(count * 3);
  const step = (halfH * 2) / 26;
  const cols = Math.floor(halfW / step);
  const rows = Math.floor(halfH / step);
  const depths = [-1.6, -0.6, 0.4];
  const dirs = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ] as const;
  let n = 0;
  while (n < count) {
    let ix = Math.round((rand() * 2 - 1) * cols);
    let iy = Math.round((rand() * 2 - 1) * rows);
    const z = (depths[Math.floor(rand() * depths.length)] ?? 0) + (rand() - 0.5) * 0.2;
    let d = Math.floor(rand() * 4);
    const length = 5 + Math.floor(rand() * 14);
    let prev = -1;
    for (let s = 0; s < length && n < count; s++) {
      if (Math.abs(ix) > cols || Math.abs(iy) > rows) break;
      pts[n * 3] = ix * step;
      pts[n * 3 + 1] = iy * step;
      pts[n * 3 + 2] = z;
      if (prev >= 0) edges.push(prev, n);
      prev = n;
      n++;
      const r = rand();
      if (r < 0.22) d = (d + (rand() < 0.5 ? 1 : 3)) % 4; // right-angle turn
      const [dx, dy] = dirs[d] ?? [1, 0];
      if (r > 0.9) {
        // 45° chamfer, as PCB traces do at corners
        const [ox, oy] = dirs[(d + 1) % 4] ?? [0, 1];
        ix += dx + ox;
        iy += dy + oy;
      } else {
        ix += dx;
        iy += dy;
      }
    }
  }
  return pts;
}

function neuralLayout(count: number, halfW: number, halfH: number, rand: () => number) {
  const layerCount = halfW > halfH ? 7 : 4;
  const neurons = Math.min(count, Math.max(layerCount * 6, Math.round(count * 0.12)));
  const positions = new Float32Array(count * 3);
  /** Layer index for neurons, -1 for dust. */
  const layers = new Int32Array(count).fill(-1);
  const columnX = (l: number) =>
    ((layerCount > 1 ? l / (layerCount - 1) : 0.5) * 2 - 1) * halfW * 0.8;
  for (let i = 0; i < count; i++) {
    if (i < neurons) {
      const l = i % layerCount;
      const t = layerCount > 1 ? l / (layerCount - 1) : 0.5;
      const bulge = 0.5 + 0.5 * Math.sin(Math.PI * t); // middle layers are taller
      const y = gauss(rand) * halfH * 0.32 * bulge;
      positions[i * 3] = columnX(l) + Math.sin(y * 0.5 + l) * 0.25 + gauss(rand) * 0.06;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = gauss(rand) * 0.5;
      layers[i] = l;
    } else {
      // Dust: a loose cloud around the net, deeper so it reads as background.
      positions[i * 3] = (rand() * 2 - 1) * halfW;
      positions[i * 3 + 1] = gauss(rand) * halfH * 0.45;
      positions[i * 3 + 2] = gauss(rand) * 1.4 - 1;
    }
  }
  return { positions, layers, layerCount };
}

/** Each neuron joins its three nearest neurons (in y/z) in the next layer. */
function neuralEdges(
  count: number,
  pos: Float32Array,
  layerOf: Int32Array,
  layerCount: number,
  edges: number[],
  kinds: number[],
) {
  const members: number[][] = Array.from({ length: layerCount }, () => []);
  for (let i = 0; i < count; i++) {
    const l = layerOf[i] ?? -1;
    if (l >= 0) members[l]?.push(i);
  }
  const yz = (i: number, j: number) => {
    const dy = (pos[i * 3 + 1] ?? 0) - (pos[j * 3 + 1] ?? 0);
    const dz = (pos[i * 3 + 2] ?? 0) - (pos[j * 3 + 2] ?? 0);
    return dy * dy + dz * dz;
  };
  for (let l = 0; l < layerCount - 1; l++) {
    const next = members[l + 1] ?? [];
    for (const i of members[l] ?? []) {
      const nearest = [...next].sort((a, b) => yz(i, a) - yz(i, b)).slice(0, 3);
      for (const j of nearest) {
        edges.push(i, j);
        kinds.push(1);
      }
    }
  }
}

function order(count: number, key: (i: number) => number): Int32Array {
  const idx = Array.from({ length: count }, (_, i) => i);
  idx.sort((a, b) => key(a) - key(b));
  return Int32Array.from(idx);
}

function gauss(rand: () => number): number {
  // Box–Muller, clamped so no point lands far off screen.
  const u = Math.max(rand(), 1e-6);
  const v = rand();
  return Math.max(-2.5, Math.min(2.5, Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)));
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
