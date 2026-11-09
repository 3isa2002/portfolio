import { accentFor, type Category } from "@/lib/categories";

/** Category pill: violet for AI, cyan for Embedded / IoT (SPEC §6). */
export function CategoryBadge({ category }: { category: Category }) {
  const violet = accentFor(category) === "violet";
  return (
    <span
      className={`inline-flex items-center rounded-pill border px-2.5 py-0.5 font-mono text-xs tracking-wide uppercase ${
        violet
          ? "border-violet/40 bg-violet/10 text-violet-ink"
          : "border-cyan/40 bg-cyan/10 text-cyan"
      }`}
    >
      {category}
    </span>
  );
}
