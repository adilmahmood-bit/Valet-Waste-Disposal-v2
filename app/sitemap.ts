import type { MetadataRoute } from "next";

import { cityPages } from "@/components/residential/cities";
import { livePosts } from "@/lib/blog";
import { trashDayUpdated } from "@/components/residential/holidayDates";

const SITE = "https://yourdoorstepdisposal.com";

// lastModified is the build (deploy) time, so search engines recrawl after each release.
const lastModified = new Date();

// The interactive /app screens are noindex. /app/features was taken out on 2026-11-23 (no page
// links to it); only the homepage, blog and public residential pages are listed.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/hosts`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/blog`, lastModified, changeFrequency: "weekly", priority: 0.6 },
    ...livePosts.map((p) => ({ url: `${SITE}/blog/${p.slug}`, lastModified: new Date(p.updated), changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: `${SITE}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    ...["", "/pricing", "/service-area", "/seniors", "/faq"].map((path) => ({
      url: `${SITE}/residential${path}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: path ? 0.6 : 0.9,
    })),
    // Trash day content: the same "Updated" date the pages show.
    ...["/trash-day", ...cityPages.map((c) => `/${c.slug}`)].map((path) => ({
      url: `${SITE}/residential${path}`,
      lastModified: new Date(trashDayUpdated()),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
