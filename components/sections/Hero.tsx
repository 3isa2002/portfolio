import { CvMenu } from "@/components/ui/CvMenu";
import { site } from "@/content/site";
import { t } from "@/lib/i18n";

/**
 * Section 1 — Hero (SPEC §5.1).
 * Phase 1: static. Phase 2 adds the typed/deleted line loop; Phase 3 the 3D network behind it;
 * Phase 4 the name scramble from the boot intro.
 */
export function Hero() {
  const [firstLine] = site.heroLines;
  return (
    <section
      aria-labelledby="hero-title"
      // Top-anchored (not vertically centered): when the body font swaps in, a change in the
      // paragraph's line count must not move the name above it (CLS < 0.05, SPEC §8).
      className="container-site relative flex min-h-dvh flex-col pt-[max(7rem,22dvh)] pb-28"
    >
      <p className="label mb-6 text-dim">
        <span className="text-cyan">{t.hero.eyebrowHardware}</span> ×{" "}
        <span className="text-violet-ink">{t.hero.eyebrowAi}</span>
      </p>

      <h1 id="hero-title" className="text-display font-bold tracking-tight">
        <span className="text-gradient">{site.name.toUpperCase()}</span>
      </h1>

      <p className="mt-6 font-mono text-lg text-text sm:text-xl">
        <span className="sr-only">{site.heroLines.join(". ")}</span>
        <span aria-hidden className="text-cyan">
          &gt;{" "}
        </span>
        <span aria-hidden className="caret">
          {firstLine}
        </span>
      </p>

      <p className="mt-4 max-w-xl text-dim">
        {site.roles.join(" · ")} — {site.location}
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <a href="#projects" className="btn btn-primary">
          {t.hero.viewProjects}
        </a>
        <CvMenu />
      </div>

      <a
        href="#about"
        className="label absolute bottom-8 start-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-dim hover:text-text rtl:translate-x-1/2"
      >
        {t.hero.scrollCue}
        <span aria-hidden className="h-10 w-px bg-gradient-to-b from-cyan to-transparent" />
      </a>
    </section>
  );
}
