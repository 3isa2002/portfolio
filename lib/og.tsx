import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";

/**
 * Open Graph images, rendered once at build time (SPEC §8: per-page OG image, "title + cover on
 * the site's dark style"). Used by app/opengraph-image.tsx and app/projects/[slug]/opengraph-image.tsx.
 */
export const OG_SIZE = { width: 1200, height: 630 };

const COLORS = {
  bg: "#07070b",
  elev: "#0e0e15",
  text: "#ededf2",
  dim: "#8a8a9a",
  cyan: "#22d3ee",
  violet: "#8b5cf6",
};

/**
 * Space Grotesk 700 as TTF (the OG renderer cannot read the WOFF2 files next/font ships).
 * Fetched from Google Fonts at build time, the same source next/font uses; if that fails the
 * image falls back to the renderer's built-in font instead of failing the build.
 */
let display: Promise<ArrayBuffer | null> | null = null;
function displayFont(): Promise<ArrayBuffer | null> {
  display ??= (async () => {
    try {
      const css = await fetch("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700", {
        // An old user agent makes Google serve TrueType instead of WOFF2.
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30" },
      }).then((r) => r.text());
      const url = /src:\s*url\(([^)]+\.ttf)\)/.exec(css)?.[1];
      return url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
    } catch {
      return null;
    }
  })();
  return display;
}

/** A local image (webp/avif/png) as a PNG data URL, which the renderer can draw. */
async function localImage(
  publicPath: string,
  width: number,
  height: number,
): Promise<string | null> {
  try {
    const file = await readFile(join(process.cwd(), "public", publicPath));
    const png = await sharp(file).resize(width, height, { fit: "cover" }).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

type OgOptions = {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Path under public/, e.g. /projects/reply-twin/cover.webp. */
  cover?: string;
  accent?: "cyan" | "violet";
  footer: string;
};

export async function renderOg({
  eyebrow,
  title,
  subtitle,
  cover,
  accent = "cyan",
  footer,
}: OgOptions) {
  const font = await displayFont();
  const image = cover ? await localImage(cover, 520, 630) : null;
  const accentColor = COLORS[accent];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily: font ? "Space Grotesk" : undefined,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 64px 56px",
          backgroundImage: `radial-gradient(circle at 15% 10%, ${accentColor}33, transparent 55%)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 10,
              border: `3px solid ${COLORS.cyan}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              color: COLORS.text,
            }}
          >
            ME
          </div>
          <div
            style={{
              fontSize: 24,
              letterSpacing: 4,
              color: accentColor,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: title.length > 22 ? 64 : 84,
              lineHeight: 1.02,
              letterSpacing: -2,
              backgroundImage: `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.violet})`,
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.3,
              color: COLORS.dim,
              maxWidth: image ? 560 : 900,
            }}
          >
            {subtitle}
          </div>
        </div>
        <div style={{ fontSize: 22, color: COLORS.dim }}>{footer}</div>
      </div>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element -- rendered by the OG renderer, not a page
        <img src={image} width={520} height={630} alt="" style={{ objectFit: "cover" }} />
      )}
    </div>,
    {
      ...OG_SIZE,
      fonts: font
        ? [{ name: "Space Grotesk", data: font, weight: 700, style: "normal" }]
        : undefined,
    },
  );
}
