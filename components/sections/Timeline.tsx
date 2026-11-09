import { timeline } from "@/content/timeline";
import { t } from "@/lib/i18n";

/**
 * About milestones (SPEC §5.2). Mobile: vertical list. Desktop: horizontal track.
 * The motion engine draws the trace on scroll (scrub) and pins the block on desktop.
 */
export function Timeline() {
  return (
    <div className="mt-16 lg:mt-24" data-timeline>
      <h3 className="label mb-8 text-dim">{t.about.timelineLabel}</h3>
      <ol className="relative grid gap-8 ps-8 lg:grid-flow-col lg:auto-cols-fr lg:gap-6 lg:ps-0 lg:pt-10">
        {/* The circuit trace: cyan (hardware) blending into violet (AI). */}
        <span
          aria-hidden
          data-timeline-line
          className="absolute start-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-cyan to-violet lg:inset-x-0 lg:top-[7px] lg:bottom-auto lg:h-px lg:w-auto lg:bg-gradient-to-r rtl:lg:bg-gradient-to-l"
        />
        {timeline.map((m) => (
          <li key={m.year + m.title} className="relative" data-timeline-item>
            <span
              aria-hidden
              className={`absolute -start-8 top-1.5 size-[15px] rounded-full border-2 border-bg lg:start-0 lg:-top-10 ${
                m.side === "ai" ? "bg-violet" : "bg-cyan"
              }`}
            />
            <p className={`font-mono text-sm ${m.side === "ai" ? "text-violet-ink" : "text-cyan"}`}>
              {m.year}
            </p>
            <p className="mt-1 font-display text-lg font-semibold">{m.title}</p>
            <p className="mt-1 text-sm text-dim">{m.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
