import { t } from "@/lib/i18n";

/** Navbar targets. Absolute (`/#…`) so they also work from project pages. */
export const navLinks = [
  { href: "/#about", label: t.nav.about },
  { href: "/#projects", label: t.nav.projects },
  { href: "/#skills", label: t.nav.skills },
  { href: "/#contact", label: t.nav.contact },
] as const;
