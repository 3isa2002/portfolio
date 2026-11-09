/** Project categories and statuses — shared by the Velite schema and the UI. */
export const CATEGORIES = ["AI", "Embedded", "IoT", "Web"] as const;
export const STATUSES = ["shipped", "in-progress", "prototype"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Status = (typeof STATUSES)[number];

export type Accent = "violet" | "cyan" | "neutral";

/** Story colors (SPEC §1): AI = violet, hardware (Embedded / IoT) = cyan; Web work is neutral. */
export function accentFor(category: Category): Accent {
  if (category === "AI") return "violet";
  return category === "Web" ? "neutral" : "cyan";
}

/** URL value for the `?c=` filter param, e.g. "AI" → "ai". */
export function categoryParam(category: Category): string {
  return category.toLowerCase();
}

export function categoryFromParam(param: string | null): Category | null {
  return CATEGORIES.find((c) => c.toLowerCase() === param?.toLowerCase()) ?? null;
}
