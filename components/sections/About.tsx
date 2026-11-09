import { ChipLogo } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { site } from "@/content/site";
import { t } from "@/lib/i18n";
import { Timeline } from "./Timeline";

/** Section 2 — About: 3-sentence intro, portrait slot, milestone timeline (SPEC §5.2). */
export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="section">
      <div className="container-site">
        <SectionHeading
          index={2}
          label={t.sections.about.label}
          title={t.sections.about.title}
          id="about-title"
        />

        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-5 text-lg lg:col-span-7">
            {site.about.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          {/* TODO(mohamed): portrait photo or avatar (SPEC §11). Slot keeps a fixed 4:5 ratio, so no layout shift later. */}
          <figure className="card relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden lg:col-span-4 lg:col-start-9 lg:max-w-none">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_srgb,var(--cyan)_18%,transparent),transparent_60%),radial-gradient(circle_at_80%_90%,color-mix(in_srgb,var(--violet)_22%,transparent),transparent_60%)]"
            />
            <div className="relative grid h-full place-items-center">
              <ChipLogo size={120} />
            </div>
          </figure>
        </div>

        <Timeline />
      </div>
    </section>
  );
}
