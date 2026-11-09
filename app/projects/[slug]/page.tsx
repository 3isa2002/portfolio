import { ArrowLeft, ExternalLink, Play } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXContent } from "@/components/mdx/MDXContent";
import { CategoryBadge } from "@/components/projects/CategoryBadge";
import { NextProject } from "@/components/projects/NextProject";
import { GitHubIcon } from "@/components/ui/icons";
import { Picture } from "@/components/ui/Picture";
import { t } from "@/lib/i18n";
import { getNextProject, getProject, getProjects } from "@/lib/projects";

/** One static page per MDX file; any other slug is a 404 (static export). */
export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const project = getProject((await params).slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: project.url },
  };
}

/**
 * Case study (SPEC §6). Phase 1 covers hero, meta, metrics, MDX body and next project.
 * Phase 5 adds the shared-element transition, count-up metrics, Architecture, Gallery,
 * Video, Code and Board3D components.
 */
export default async function CaseStudyPage({ params }: PageProps<"/projects/[slug]">) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const next = getNextProject(project.slug);
  const external = { target: "_blank", rel: "noreferrer" } as const;
  const videoHref = /^https?:\/\//.test(project.links.video)
    ? project.links.video
    : project.links.video
      ? `https://www.youtube.com/watch?v=${project.links.video}`
      : "";

  return (
    <article className="pt-28 pb-24">
      <header className="container-site">
        <Link
          href="/projects"
          className="label -ms-1 inline-flex min-h-11 items-center gap-2 p-1 text-dim hover:text-text"
        >
          <ArrowLeft size={14} aria-hidden className="rtl:rotate-180" />
          {t.projects.backToProjects}
        </Link>

        <div className="mt-6 flex flex-wrap gap-2">
          {project.category.map((c) => (
            <CategoryBadge key={c} category={c} />
          ))}
        </div>
        <h1 className="mt-4 text-h2 font-semibold">{project.title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-dim">{project.summary}</p>

        <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-line py-6 sm:grid-cols-4">
          <div>
            <dt className="label text-dim">{t.projects.year}</dt>
            <dd className="mt-1 font-mono">{project.year}</dd>
          </div>
          <div>
            <dt className="label text-dim">{t.projects.status}</dt>
            <dd className="mt-1 font-mono">{t.projects.statuses[project.status]}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="label text-dim">{t.projects.role}</dt>
            <dd className="mt-1">{project.role}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="label text-dim">{t.projects.stack}</dt>
            <dd className="mt-1 font-mono text-sm">{project.stack.join(" · ")}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          {project.links.github && (
            <a href={project.links.github} className="btn btn-ghost" {...external}>
              <GitHubIcon size={16} />
              {t.projects.github}
            </a>
          )}
          {project.links.live && (
            <a href={project.links.live} className="btn btn-ghost" {...external}>
              <ExternalLink size={16} aria-hidden />
              {t.projects.live}
            </a>
          )}
          {videoHref && (
            <a href={videoHref} className="btn btn-primary" {...external}>
              <Play size={16} aria-hidden />
              {t.projects.watchDemo}
            </a>
          )}
        </div>
      </header>

      <div className="container-site mt-12">
        <div className="card aspect-[16/10] overflow-hidden">
          <Picture
            src={project.coverSrc}
            alt={`${project.title} cover`}
            width={1600}
            height={1000}
            sizes="(min-width: 1280px) 1184px, calc(100vw - 48px)"
            priority
            className="size-full object-cover"
          />
        </div>
      </div>

      {project.metrics.length > 0 && (
        <section aria-label={t.projects.metrics} className="container-site mt-12">
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {project.metrics.map((m) => (
              <div key={m.label} className="card flex flex-col-reverse gap-2 p-5">
                <dt className="label text-dim">{m.label}</dt>
                <dd className="text-gradient font-display text-3xl font-bold sm:text-4xl">
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <div className="container-site mt-16">
        <div className="prose">
          <MDXContent code={project.body} />
        </div>
      </div>

      {next && (
        <div className="container-site mt-24">
          <NextProject project={next} />
        </div>
      )}
    </article>
  );
}
