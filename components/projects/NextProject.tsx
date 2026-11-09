import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ViewTransition } from "react";
import { Picture } from "@/components/ui/Picture";
import { t } from "@/lib/i18n";
import type { Project } from "@/lib/projects";

/**
 * Large card to the next case study (SPEC §6 page order, item 8); its cover zooms gently on
 * hover. It uses its own view-transition name: sharing `cover-<slug>` with the grid cards would
 * make an unrelated grid card fly down to it when a case study is opened from the grid.
 */
export function NextProject({ project }: { project: Project }) {
  return (
    <Link
      href={project.url}
      transitionTypes={["nav-forward"]}
      data-cursor="view"
      data-reveal="up"
      className="group card grid overflow-hidden transition-colors hover:border-white/15 md:grid-cols-2"
    >
      <div className="flex flex-col justify-center gap-3 p-6 sm:p-10">
        <p className="label text-dim">{t.projects.nextProject}</p>
        <p className="font-display text-h3 font-semibold">{project.title}</p>
        <p className="text-dim">{project.summary}</p>
        <ArrowRight
          size={20}
          aria-hidden
          className="mt-2 text-cyan transition-transform group-hover:translate-x-1 rtl:rotate-180"
        />
      </div>
      <div className="aspect-[16/10] overflow-hidden bg-bg-elev-2">
        <ViewTransition name={`next-cover-${project.slug}`} share="morph" default="none">
          <div className="size-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]">
            <Picture
              src={project.coverSrc}
              alt=""
              width={1600}
              height={1000}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="size-full object-cover"
            />
          </div>
        </ViewTransition>
      </div>
    </Link>
  );
}
