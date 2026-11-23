// Blog posts. Each post has its own page under app/blog/<slug>/page.tsx; this list feeds the
// /blog index (grouped by audience), the sitemap and llms.txt. Newest first within each audience.

export const SITE = "https://yourdoorstepdisposal.com";

export type Post = {
  slug: string;
  title: string; // the H1 and the title on the blog list
  seoTitle?: string; // the browser tab / Google result title, under 60 characters; falls back to title
  description: string; // under 160 characters
  published: string; // ISO date
  updated: string; // ISO date
  image: { src: string; alt: string; width: number; height: number };
  readMinutes: number;
  // "apartments": property managers (Valet Waste Disposal). "homes": homeowners and short-term
  // rental hosts (Doorstep Disposal).
  audience: "apartments" | "homes";
  // Archived posts are left out of the blog list, sitemap and llms.txt, and their page returns 404.
  // The page file stays so the post can come back by removing this flag.
  archived?: boolean;
};

export const posts: Post[] = [
  {
    slug: "is-valet-trash-worth-it",
    title: "Is Valet Trash Worth It? What San Diego Apartments Spend in 2026 Without It",
    seoTitle: "Is Valet Trash Worth It? San Diego Apartment Costs 2026",
    description:
      "What San Diego apartments spend without valet trash: porter time, contamination fines and extra pickups, plus a calculator for your property.",
    published: "2026-11-17",
    updated: "2026-11-23",
    image: {
      src: "/blog/porter-time/dumpster-lid-cannot-close.jpg",
      alt: "Trash bags and an open shoe box piled above the rim of an apartment dumpster so the lid can't close",
      width: 1600,
      height: 424,
    },
    readMinutes: 7,
    audience: "apartments",
  },
  {
    slug: "how-to-get-rid-of-a-mattress-san-diego",
    title: "How to Get Rid of a Mattress in San Diego: Free Drop-Off and Pickup by City (2026)",
    seoTitle: "How to Get Rid of a Mattress in San Diego (2026)",
    description:
      "Free mattress drop-off at Miramar Landfill, which cities pick up mattresses for free, and what other haulers charge across San Diego County.",
    published: "2026-11-23",
    updated: "2026-11-23",
    image: {
      // Photo sent by Adil 2026-11-23.
      src: "/blog/bulky/bulky-items-at-curb.webp",
      alt: "A box spring, dresser, flat-screen TV, microwave, leather armchair and small TV set out at the curb for bulky item pickup",
      width: 1921,
      height: 1081,
    },
    readMinutes: 5,
    audience: "homes",
  },
  {
    slug: "when-to-put-trash-cans-out-san-diego",
    archived: true, // Archived by Adil 2026-11-23.
    title: "When Can You Put Trash Cans Out in San Diego? Set-Out and Bring-In Rules by City",
    seoTitle: "When to Put Trash Cans Out in San Diego: Rules by City",
    description:
      "What time trash cans need to be at the curb, when they have to come back in, and where to place them in San Diego, Oceanside, Carlsbad and EDCO cities.",
    published: "2026-11-23",
    updated: "2026-11-23",
    image: {
      src: "/residential-hero-ranch.jpg",
      alt: "Gray, blue and green trash cans at the curb in front of a white Spanish-style house",
      width: 1792,
      height: 1008,
    },
    readMinutes: 5,
    audience: "homes",
  },
  {
    slug: "airbnb-checkout-rules-trash",
    title: "Airbnb's New Checkout Rules (Nov 2026): Guests Can't Be Asked to Take Out the Trash",
    seoTitle: "Airbnb's New Rules Nov 2026: Who Takes Out the Trash?",
    description:
      "Airbnb's house rules policy for bookings from Nov. 20, 2026 bars asking guests to take trash offsite. What it means for San Diego hosts on trash day.",
    published: "2026-11-23",
    updated: "2026-11-23",
    image: {
      src: "/residential-hosts-bungalow.jpg",
      alt: "Trash cans at the curb in front of a beach rental with surfboards by the garage",
      width: 1792,
      height: 1008,
    },
    readMinutes: 5,
    audience: "homes",
  },
];

// Posts that are live on the site (not archived).
export const livePosts = posts.filter((p) => !p.archived);
export const isLive = (slug: string) => livePosts.some((p) => p.slug === slug);

export const postUrl = (slug: string) => `${SITE}/blog/${slug}`;

// "2026-11-17" -> "November 17, 2026"
export const formatPostDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" });
