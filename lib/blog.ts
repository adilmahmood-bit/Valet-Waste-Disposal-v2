// Blog posts for property managers (multifamily). Each post has its own page under
// app/blog/<slug>/page.tsx; this list feeds the /blog index, the sitemap and llms.txt.

export const SITE = "https://yourdoorstepdisposal.com";

export type Post = {
  slug: string;
  title: string;
  description: string;
  published: string; // ISO date
  updated: string; // ISO date
  image: { src: string; alt: string; width: number; height: number };
  readMinutes: number;
};

export const posts: Post[] = [
  {
    slug: "is-valet-trash-worth-it",
    title: "Is Valet Trash Worth It? What San Diego Apartments Spend Without It",
    description:
      "Without valet trash, apartment communities pay in porter time, contamination fines and extra pickups. What San Diego managers told us, and a calculator to estimate the cost at your property.",
    published: "2026-11-17",
    updated: "2026-11-17",
    image: {
      src: "/blog/porter-time/dumpster-lid-cannot-close.jpg",
      alt: "Trash bags and an open shoe box piled above the rim of an apartment dumpster so the lid can't close",
      width: 1600,
      height: 424,
    },
    readMinutes: 7,
  },
];

export const postUrl = (slug: string) => `${SITE}/blog/${slug}`;
