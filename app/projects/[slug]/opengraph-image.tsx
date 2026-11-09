import { site } from "@/content/site";
import { accentFor } from "@/lib/categories";
import { OG_SIZE, renderOg } from "@/lib/og";
import { getProject, getProjects } from "@/lib/projects";

// Static export: generated once at build time.
export const dynamic = "force-static";

// One share image per case study: title, summary and cover (SPEC §8), generated at build time.
export const alt = "Project case study: title, summary and cover";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const project = getProject((await params).slug);
  if (!project)
    return renderOg({ eyebrow: "Project", title: site.name, subtitle: "", footer: site.name });
  const category = project.category[0] ?? "AI";
  return renderOg({
    eyebrow: project.category.join(" · "),
    title: project.title,
    subtitle: project.summary,
    cover: project.coverSrc,
    accent: accentFor(category) === "violet" ? "violet" : "cyan",
    footer: project.year ? `${site.name} · ${project.year}` : site.name,
  });
}
