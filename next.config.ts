import type { NextConfig } from "next";
import widths from "./lib/image-widths.json";

// In `next dev`, keep Velite watching content/ so MDX edits show up live.
// (`pnpm dev` runs one full content build first, so .velite/ always exists before Next starts.)
if (process.argv.includes("dev") && !process.env.VELITE_STARTED) {
  process.env.VELITE_STARTED = "1";
  void import("velite").then((velite) => velite.build({ watch: true, clean: false }));
}

const nextConfig: NextConfig = {
  // Fully static site: `next build` writes plain HTML/CSS/JS to `out/` for Cloudflare Pages.
  output: "export",
  experimental: {
    // Inline the (small, Tailwind-generated) CSS into <head>: removes one render-blocking
    // round trip for first-time visitors, which is most of a portfolio's traffic (SPEC §8 LCP).
    inlineCss: true,
  },
  images: {
    // Static export has no image server: point next/image at the AVIF/WebP files that
    // scripts/optimize-images.ts generates at build time.
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    deviceSizes: widths.filter((w) => w >= 640),
    imageSizes: widths.filter((w) => w < 640),
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
