import widths from "./image-widths.json";

/**
 * Custom next/image loader for the static export.
 * Maps a local image (e.g. /projects/reply-twin/cover.webp) to the pre-generated file from
 * scripts/optimize-images.ts (e.g. /_img/projects/reply-twin/cover-960.webp).
 * Remote URLs (R2, etc.) are passed through unchanged.
 */

type LoaderArgs = { src: string; width: number; quality?: number };

const OPTIMIZED_PREFIX = "/projects/";

function pickWidth(requested: number): number {
  return widths.find((w) => w >= requested) ?? widths[widths.length - 1] ?? requested;
}

function build(format: "avif" | "webp") {
  return ({ src, width }: LoaderArgs): string => {
    if (!src.startsWith(OPTIMIZED_PREFIX)) return src;
    const base = src.replace(/\.[a-z0-9]+$/i, "");
    return `/_img${base}-${pickWidth(width)}.${format}`;
  };
}

export const avifLoader = build("avif");
export const webpLoader = build("webp");

export default webpLoader;
