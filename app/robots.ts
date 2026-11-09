import type { MetadataRoute } from "next";
import { site } from "@/content/site";

// Static export: generated once at build time.
export const dynamic = "force-static";

/** robots.txt (SPEC §8): everything is public; points crawlers at the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
