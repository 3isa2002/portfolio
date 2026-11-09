import { existsSync } from "node:fs";
import { join } from "node:path";
import rehypeShiki from "@shikijs/rehype";
import sharp from "sharp";
import type { ShikiTransformer } from "shiki";
import { defineCollection, defineConfig, s } from "velite";
import { CATEGORIES, STATUSES } from "./lib/categories";

/**
 * Content model — SPEC §6. One MDX file per project in `content/projects/`.
 * Invalid frontmatter (or a missing media file) fails the build with a clear message.
 */

/** Accepts a full URL or an empty string (frontmatter placeholders use ""). */
const optionalUrl = s.union([s.string().url(), s.literal("")]).default("");

const projects = defineCollection({
  name: "Project",
  pattern: "projects/*.mdx",
  schema: s
    .object({
      title: s.string().min(1).max(80),
      slug: s.slug("projects"),
      summary: s.string().min(1).max(120),
      category: s.array(s.enum(CATEGORIES)).min(1),
      featured: s.boolean().default(false),
      order: s.number().int().default(99),
      /** Optional: left out when the build year is not known (never guessed). */
      year: s.number().int().min(2000).max(2100).optional(),
      status: s.enum(STATUSES),
      role: s.string().min(1),
      stack: s.array(s.string()).default([]),
      cover: s.string().min(1),
      preview: s.string().default(""),
      links: s
        .object({
          github: optionalUrl,
          live: optionalUrl,
          /** R2 URL or YouTube video ID. */
          video: s.string().default(""),
        })
        .default({}),
      gallery: s
        .array(s.object({ src: s.string().min(1), caption: s.string().default("") }))
        .default([]),
      metrics: s
        .array(s.object({ label: s.string().min(1), value: s.string().min(1) }))
        .max(4)
        .default([]),
      model3d: s.string().default(""),
      demo: s.string().default(""),
      body: s.mdx(),
    })
    .superRefine((data, ctx) => {
      // Every local media file referenced in frontmatter must exist in public/projects/<slug>/.
      const local = [data.cover, data.preview, ...data.gallery.map((g) => g.src)].filter(
        (f) => f && !/^https?:\/\//.test(f),
      );
      for (const file of local) {
        if (!existsSync(join("public", "projects", data.slug, file))) {
          ctx.addIssue({
            code: "custom",
            message: `Missing media file: public/projects/${data.slug}/${file}`,
          });
        }
      }
    })
    .transform(async (data) => {
      const media = (file: string) =>
        !file || /^https?:\/\//.test(file) ? file : `/projects/${data.slug}/${file}`;
      // Gallery images keep their real proportions in the masonry, so their sizes are read at
      // build time: width/height on every <img> means no layout shift while they load.
      const gallery = await Promise.all(
        data.gallery.map(async (g) => {
          const local = !/^https?:\/\//.test(g.src);
          const meta = local
            ? await sharp(join("public", "projects", data.slug, g.src)).metadata()
            : { width: 1600, height: 1000 };
          return {
            ...g,
            src: media(g.src),
            width: meta.width ?? 1600,
            height: meta.height ?? 1000,
          };
        }),
      );
      return {
        ...data,
        url: `/projects/${data.slug}`,
        coverSrc: media(data.cover),
        previewSrc: media(data.preview),
        gallery,
      };
    }),
});

/** Copies the fence's `title="…"` onto <pre data-title>, read by the MDX CodeBlock tab. */
const fileTitle: ShikiTransformer = {
  pre(node) {
    const title: unknown = this.options.meta?.title;
    if (typeof title === "string") node.properties["data-title"] = title;
  },
};

export default defineConfig({
  // Run as `velite build --strict` (see package.json) so any schema error fails the build (SPEC §6).
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: { projects },
  mdx: {
    // Media live in public/projects/<slug>/ and the case-study page resolves them; Velite must
    // not try to copy relative paths it sees in MDX (e.g. <Video src="demo.webm" />).
    copyLinkedFiles: false,
    rehypePlugins: [
      [
        rehypeShiki,
        {
          theme: "github-dark-default",
          // Build-time highlighting only: zero runtime JS (SPEC §2).
          // ```python title="retrieve.py" → the file name tab of the code block.
          parseMetaString: (meta: string) => {
            const title = /title="([^"]+)"/.exec(meta)?.[1];
            return title ? { title } : {};
          },
          transformers: [fileTitle],
        },
      ],
    ],
  },
});
