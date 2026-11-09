import { accentFor, type Category } from "@/lib/categories";

const STYLE = {
  violet: "border-violet/40 bg-violet/10 text-violet-ink",
  cyan: "border-cyan/40 bg-cyan/10 text-cyan",
  neutral: "border-white/20 bg-white/5 text-text",
} as const;

/** Category pill: violet for AI, cyan for Embedded / IoT, neutral for Web (SPEC §6). */
export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill border px-2.5 py-0.5 font-mono text-xs tracking-wide uppercase ${STYLE[accentFor(category)]}`}
    >
      {category}
    </span>
  );
}
