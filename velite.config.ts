import { existsSync } from "node:fs";
import { join } from "node:path";
import rehypeShiki from "@shikijs/rehype";
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
      year: s.number().int().min(2000).max(2100),
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
    .transform((data) => {
      const media = (file: string) =>
        !file || /^https?:\/\//.test(file) ? file : `/projects/${data.slug}/${file}`;
      return {
        ...data,
        url: `/projects/${data.slug}`,
        coverSrc: media(data.cover),
        previewSrc: media(data.preview),
        gallery: data.gallery.map((g) => ({ ...g, src: media(g.src) })),
      };
    }),
});

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
    rehypePlugins: [
      [
        rehypeShiki,
        {
          theme: "github-dark-default",
          // Build-time highlighting only: zero runtime JS (SPEC §2).
        },
      ],
    ],
  },
});
