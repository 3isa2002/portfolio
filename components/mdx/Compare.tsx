"use client";

import { useId, useState } from "react";
import { t } from "@/lib/i18n";

type CompareProps = {
  /** Image paths, resolved by the case-study page (file names in public/projects/<slug>/). */
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  alt?: string;
  /** Intrinsic aspect ratio, e.g. "16/10" (default), so the frame never shifts the layout. */
  ratio?: string;
};

/**
 * Before/after slider (SPEC §6 `<Compare>`). A native range input drives the split, so it works
 * with mouse, touch and keyboard (arrow keys), and screen readers announce the position.
 */
export function Compare({
  before,
  after,
  beforeLabel = t.compare.before,
  afterLabel = t.compare.after,
  alt = "",
  ratio = "16/10",
}: CompareProps) {
  const [value, setValue] = useState(50);
  const id = useId();
  return (
    <figure className="not-prose card relative overflow-hidden" style={{ aspectRatio: ratio }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static export, files served as-is */}
      <img src={after} alt={alt} className="absolute inset-0 size-full object-cover" />
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, files served as-is */}
        <img src={before} alt="" className="size-full object-cover" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-cyan shadow-[0_0_12px_var(--cyan)]"
        style={{ left: `${value}%` }}
      />
      <span className="label absolute start-3 top-3 rounded-pill bg-bg/80 px-2 py-1">
        {beforeLabel}
      </span>
      <span className="label absolute end-3 top-3 rounded-pill bg-bg/80 px-2 py-1">
        {afterLabel}
      </span>
      <label htmlFor={id} className="sr-only">
        {t.compare.slider}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="compare-range absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
    </figure>
  );
}
