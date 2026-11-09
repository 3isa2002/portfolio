import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { getProjects } from "@/lib/projects";

// Static export: generated once at build time.
export const dynamic = "force-static";

/** sitemap.xml (SPEC §8), generated at build time from the content. */
export default function sitemap(): MetadataRoute.Sitemap {
  const projects = getProjects().map((p) => ({
    url: `${site.url}${p.url}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
  return [
    { url: site.url, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/projects`, changeFrequency: "monthly", priority: 0.9 },
    ...projects,
  ];
}
