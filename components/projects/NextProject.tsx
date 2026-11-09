import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Picture } from "@/components/ui/Picture";
import { t } from "@/lib/i18n";
import type { Project } from "@/lib/projects";

/** Large card to the next case study (SPEC §6 page order, item 8). Hover preview arrives in Phase 5. */
export function NextProject({ project }: { project: Project }) {
  return (
    <Link
      href={project.url}
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
      <div className="aspect-[16/10] bg-bg-elev-2">
        <Picture
          src={project.coverSrc}
          alt=""
          width={1600}
          height={1000}
          sizes="(min-width: 768px) 50vw, 100vw"
          className="size-full object-cover"
        />
      </div>
    </Link>
  );
}
