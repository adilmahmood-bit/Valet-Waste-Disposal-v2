import type { MetadataRoute } from "next";

import { cityPages } from "@/components/residential/cities";

const SITE = "https://yourdoorstepdisposal.com";

// lastModified is the build (deploy) time, so search engines recrawl after each release.
const lastModified = new Date();

// The interactive /app screens are noindex; only the homepage, the
// readable feature overview and the public residential pages are listed.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/app/features`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/hosts`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    ...["", "/pricing", "/service-area", "/seniors", "/faq", "/trash-day", ...cityPages.map((c) => `/${c.slug}`)].map((path) => ({
      url: `${SITE}/residential${path}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: path ? 0.6 : 0.9,
    })),
  ];
}
