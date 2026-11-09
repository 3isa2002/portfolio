/**
 * Build-time image pipeline (SPEC §2 media, decision 4 in PLAN.md).
 *
 * For every image under public/projects/, writes AVIF + WebP copies at each width in
 * lib/image-widths.json to public/_img/ (git-ignored). lib/image-loader.ts points next/image
 * at these files, so the static export still gets responsive, modern-format images.
 *
 * Incremental: an output is skipped when it is newer than its source.
 * Run with plain Node (type stripping): `node scripts/optimize-images.mts`.
 */
import { mkdir, readdir, stat } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import sharp, { type Sharp } from "sharp";
import widths from "../lib/image-widths.json" with { type: "json" };

const SOURCE_DIR = join("public", "projects");
const OUT_DIR = join("public", "_img");
const SOURCE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const FORMATS = {
  avif: (img: Sharp) => img.avif({ quality: 50, effort: 4 }),
  webp: (img: Sharp) => img.webp({ quality: 75 }),
} as const;

async function* walk(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return; // no projects folder yet
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (SOURCE_EXT.has(extname(e.name).toLowerCase())) yield p;
  }
}

async function mtime(path: string): Promise<number> {
  try {
    return (await stat(path)).mtimeMs;
  } catch {
    return 0;
  }
}

let written = 0;
let skipped = 0;
const started = performance.now();

for await (const src of walk(SOURCE_DIR)) {
  const srcTime = await mtime(src);
  // public/projects/<slug>/cover.webp → public/_img/projects/<slug>/cover
  const base = join(OUT_DIR, relative("public", src)).slice(0, -extname(src).length);
  await mkdir(dirname(base), { recursive: true });

  for (const width of widths) {
    for (const [format, encode] of Object.entries(FORMATS)) {
      const out = `${base}-${width}.${format}`;
      if ((await mtime(out)) > srcTime) {
        skipped++;
        continue;
      }
      await encode(sharp(src).resize({ width, withoutEnlargement: true })).toFile(out);
      written++;
    }
  }
}

console.log(
  `[images] ${written} written, ${skipped} up to date (${Math.round(performance.now() - started)} ms)`,
);
