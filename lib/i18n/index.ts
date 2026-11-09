import { en } from "./en";

/**
 * Active dictionary. English only for now; an Arabic dictionary with the same shape
 * (`satisfies Dictionary`) plus `dir="rtl"` on <html> is all a second locale needs.
 */
export const t = en;
export type { Dictionary } from "./en";
