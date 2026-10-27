import type { MetadataRoute } from "next";

const SITE = "https://yourdoorstepdisposal.com";

// The interactive /app screens are noindex; only the homepage, the
// readable feature overview and the public residential pages are listed.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/app/features`, changeFrequency: "monthly", priority: 0.5 },
    ...["", "/pricing", "/service-area", "/hosts", "/faq"].map((path) => ({
      url: `${SITE}/residential${path}`,
      changeFrequency: "monthly" as const,
      priority: path ? 0.6 : 0.9,
    })),
  ];
}
