import type { MetadataRoute } from "next";

const SITE = "https://yourdoorstepdisposal.com";

// The interactive /app screens are noindex; only the homepage and the
// readable feature overview are listed for search engines.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/app/features`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
