/**
 * Workaround for a Next.js 16.4 static-export mismatch in segment prefetch files.
 *
 * `next build` writes nested segment payloads as folders, e.g.
 *   out/projects/__next.projects/__PAGE__.txt
 * but the client router requests the dot-joined name:
 *   /projects/__next.projects.__PAGE__.txt
 * so every prefetch of a nested route 404s (navigation still works, via the full `.txt`
 * fallback, but with console errors and wasted requests).
 *
 * This copies each nested segment file to its dot-joined name. Originals are kept.
 * Remove once Next.js exports the names the router requests.
 */
import { copyFile, readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const OUT = "out";
let copied = 0;

/** Walk `dir`; when inside a `__next.*` folder, mirror files to the dot-joined name at `anchor`. */
async function walk(dir: string, anchor: string | null): Promise<void> {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "_next") continue; // static assets, not route payloads
      const startsSegment = anchor === null && e.name.startsWith("__next.");
      await walk(p, startsSegment ? dir : anchor);
    } else if (anchor !== null && e.name.endsWith(".txt")) {
      const flat = relative(anchor, p).split(sep).join(".");
      await copyFile(p, join(anchor, flat));
      copied++;
    }
  }
}

await walk(OUT, null);
console.log(`[segment-prefetch] ${copied} segment files mirrored to dot-joined names`);
