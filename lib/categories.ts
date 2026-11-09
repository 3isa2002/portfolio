/** Project categories and statuses — shared by the Velite schema and the UI. */
export const CATEGORIES = ["AI", "Embedded", "IoT"] as const;
export const STATUSES = ["shipped", "in-progress", "prototype"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Status = (typeof STATUSES)[number];

/** Story colors (SPEC §1): AI = violet, hardware (Embedded / IoT) = cyan. */
export function accentFor(category: Category): "violet" | "cyan" {
  return category === "AI" ? "violet" : "cyan";
}

/** URL value for the `?c=` filter param, e.g. "AI" → "ai". */
export function categoryParam(category: Category): string {
  return category.toLowerCase();
}

export function categoryFromParam(param: string | null): Category | null {
  return CATEGORIES.find((c) => c.toLowerCase() === param?.toLowerCase()) ?? null;
}
