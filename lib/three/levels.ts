/**
 * Quality levels for the background scene (SPEC §7, §8).
 * Phones start at `lite` (400 points, no bloom); desktops at `full` (1,500 points + bloom).
 * When drei's PerformanceMonitor sees under 45 fps for 2 s the scene steps down:
 * full → reduced → static fallback; lite → static fallback.
 */
export type SceneLevel = "full" | "reduced" | "lite";
export type BackgroundLevel = SceneLevel | "off";

export const LEVELS: Record<SceneLevel, { count: number; bloom: boolean; dpr: [number, number] }> =
  {
    full: { count: 1500, bloom: true, dpr: [1, 1.75] },
    reduced: { count: 750, bloom: false, dpr: [1, 1.5] },
    lite: { count: 400, bloom: false, dpr: [1, 1.5] },
  };

export function stepDown(level: BackgroundLevel | null): BackgroundLevel {
  return level === "full" ? "reduced" : "off";
}

/** Same values as styles/tokens.css (--bg, --cyan, --violet). */
export const SCENE_COLORS = { bg: "#07070b", cyan: "#22d3ee", violet: "#8b5cf6" } as const;

/**
 * Picks the starting level for this device, or `off` when WebGL is missing, the visitor asked
 * to save data, or the device is very low-end. Runs once, client-side, before the 3D chunk loads.
 */
export function pickLevel(finePointer: boolean): BackgroundLevel {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData) return "off";
  if ((nav.deviceMemory ?? 8) < 2 || (nav.hardwareConcurrency ?? 8) <= 2) return "off";
  if (!hasWebGL()) return "off";
  return finePointer && window.innerWidth >= 768 ? "full" : "lite";
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return gl !== null;
  } catch {
    return false;
  }
}
