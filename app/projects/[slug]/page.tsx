import { ArrowLeft, ExternalLink, Play } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type ComponentProps, ViewTransition } from "react";
import { Board3D } from "@/components/mdx/Board3D";
import { Compare } from "@/components/mdx/Compare";
import { Demo } from "@/components/mdx/Demo";
import { Gallery } from "@/components/mdx/Gallery";
import { MDXContent } from "@/components/mdx/MDXContent";
import { Video } from "@/components/mdx/Video";
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
 * Case study (SPEC §6).
 * - The cover shares its view-transition name with the card that opened it, so it morphs from
 *   the card into this hero (and back on the browser's back button); the rest rises in after it.
 * - Metrics count up when scrolled into view (motion engine, `data-count`).
 * - MDX can use Gallery, Video, Board3D and Compare with this project's own media (bound here)
 *   plus Architecture, Callout, Demo and highlighted code (shared).
 * - `demo` in the frontmatter adds the interactive demo after the text.
 */
export default async function CaseStudyPage({ params }: PageProps<"/projects/[slug]">) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const next = getNextProject(project.slug);
  const external = { target: "_blank", rel: "noreferrer" } as const;
  const media = (file: string) =>
    !file || /^(https?:)?\//.test(file) ? file : `/projects/${project.slug}/${file}`;
  const bound = {
    Gallery: () => <Gallery items={project.gallery} />,
    Video: (props: Partial<ComponentProps<typeof Video>>) => (
      <Video
        title={props.title ?? project.title}
        poster={media(props.poster ?? "") || project.coverSrc}
        src={
          /^[A-Za-z0-9_-]{11}$/.test(props.src ?? "")
            ? (props.src ?? "")
            : media(props.src ?? project.links.video)
        }
        captions={props.captions ? media(props.captions) : undefined}
      />
    ),
    Board3D: (props: Partial<ComponentProps<typeof Board3D>>) => (
      <Board3D src={media(props.src ?? project.model3d)} hotspots={props.hotspots} />
    ),
    Compare: (props: ComponentProps<typeof Compare>) => (
      <Compare {...props} before={media(props.before)} after={media(props.after)} />
    ),
  };
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
          transitionTypes={["nav-back"]}
          className="label -ms-1 inline-flex min-h-11 items-center gap-2 p-1 text-dim hover:text-text"
        >
          <ArrowLeft size={14} aria-hidden className="rtl:rotate-180" />
          {t.projects.backToProjects}
        </Link>

        <ViewTransition enter="cs-rise" default="none">
          <div>
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
          </div>
        </ViewTransition>
      </header>

      <div className="container-site mt-12">
        <ViewTransition name={`cover-${project.slug}`} share="morph" default="none">
          <div className="card aspect-[16/10] overflow-hidden" data-vt-cover={project.slug}>
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
        </ViewTransition>
      </div>

      <ViewTransition enter="cs-rise-late" default="none">
        <div>
          {project.metrics.length > 0 && (
            <section aria-label={t.projects.metrics} className="container-site mt-12">
              <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {project.metrics.map((m) => (
                  <div key={m.label} className="card flex flex-col-reverse gap-2 p-5">
                    <dt className="label text-dim">{m.label}</dt>
                    <dd
                      className="text-gradient font-display text-3xl font-bold sm:text-4xl"
                      data-count
                    >
                      {m.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <div className="container-site mt-16">
            <div className="prose" data-reveal="each">
              <MDXContent code={project.body} components={bound} />
            </div>
          </div>

          {project.demo && (
            <section aria-labelledby="demo-title" className="container-site mt-16">
              <h2 id="demo-title" className="label mb-4 text-dim">
                {t.demo.title}
              </h2>
              <Demo name={project.demo} />
            </section>
          )}
        </div>
      </ViewTransition>

      {next && (
        <div className="container-site mt-24">
          <NextProject project={next} />
        </div>
      )}
    </article>
  );
}
