import { site } from "@/content/site";
import type { Project } from "@/lib/projects";

/**
 * Structured data (SPEC §8): JSON-LD rendered into the static HTML. `<` is escaped so content
 * can never close the script tag early.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** schema.org Person for the home page. */
export function personSchema(): Record<string, unknown> {
  const sameAs = [site.links.github, site.links.linkedin].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: site.url,
    jobTitle: site.roles.join(", "),
    address: { "@type": "PostalAddress", addressLocality: "Cairo", addressCountry: "EG" },
    knowsAbout: site.skills.flatMap((g) => g.items),
    sameAs,
  };
}

/** schema.org CreativeWork for a case study. */
export function projectSchema(project: Project): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary,
    url: `${site.url}${project.url}`,
    dateCreated: String(project.year),
    keywords: project.stack.join(", "),
    genre: project.category.join(", "),
    creativeWorkStatus: project.status,
    image: `${site.url}${project.coverSrc}`,
    creator: { "@type": "Person", name: site.name, url: site.url },
  };
}
