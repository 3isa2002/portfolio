import { site } from "@/content/site";
import { t } from "@/lib/i18n";
import { OG_SIZE, renderOg } from "@/lib/og";

// Static export: generated once at build time.
export const dynamic = "force-static";

// Share image for the home page and every page without its own (generated at build time).
export const alt = t.meta.title;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOg({
    eyebrow: `${t.hero.eyebrowHardware} × ${t.hero.eyebrowAi}`,
    title: site.name.toUpperCase(),
    subtitle: site.roles.join(" · "),
    footer: `${site.location} · ${site.url.replace(/^https?:\/\//, "")}`,
  });
}
