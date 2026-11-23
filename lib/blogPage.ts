import type { Metadata } from "next";
import { posts, postUrl, SITE, type Post } from "@/lib/blog";
import { BUSINESS_ID } from "@/components/residential/schema";

// Shared metadata and structured data for blog post pages. Homeowner posts are credited to
// Doorstep Disposal (the residential business); apartment posts to Valet Waste Disposal.

export const getPost = (slug: string) => posts.find((p) => p.slug === slug)!;

export function postMetadata(post: Post): Metadata {
  return {
    title: { absolute: post.seoTitle ?? post.title },
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      siteName: post.audience === "homes" ? "Doorstep Disposal" : "Valet Waste Disposal",
      locale: "en_US",
      type: "article",
      publishedTime: post.published,
      modifiedTime: post.updated,
      images: [{ url: post.image.src, width: post.image.width, height: post.image.height, alt: post.image.alt }],
    },
    twitter: { card: "summary_large_image" },
  };
}

// BlogPosting + FAQPage + BreadcrumbList. Questions must match the page word for word.
export function postJsonLd(post: Post, faqs: { q: string; a: string }[], about: string[]) {
  const url = postUrl(post.slug);
  const by = post.audience === "homes" ? { "@id": BUSINESS_ID } : { "@id": `${SITE}/#org` };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: post.title,
        description: post.description,
        image: `${SITE}${post.image.src}`,
        datePublished: post.published,
        dateModified: post.updated,
        author: by,
        publisher: { "@id": `${SITE}/#org` },
        mainEntityOfPage: url,
        about,
        spatialCoverage: { "@type": "AdministrativeArea", name: "San Diego County, CA" },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
    ],
  };
}
