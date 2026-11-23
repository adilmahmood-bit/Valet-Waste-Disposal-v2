import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import { livePosts, formatPostDate as fmt, type Post } from "@/lib/blog";

const description =
  "Trash tips for San Diego County: trash day rules, mattress and bulky item pickup, Airbnb trash, and field notes for apartment managers.";

export const metadata: Metadata = {
  title: { absolute: "San Diego Trash Blog: Tips for Homes & Apartments" },
  description,
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "San Diego Trash Blog",
    description,
    url: "/blog",
    siteName: "Valet Waste Disposal",
    locale: "en_US",
    type: "website",
    images: [{ url: "/hero-building.jpg", width: 1728, height: 972, alt: "Mid-rise apartment building in downtown San Diego" }],
  },
  twitter: { card: "summary_large_image" },
};

// Posts grouped by who they're for (the audience field in lib/blog.ts).
const groups: { audience: Post["audience"]; title: string; text: string }[] = [
  {
    audience: "homes",
    title: "For homeowners and rental hosts",
    text: "Trash day rules, holiday weeks and getting rid of big items, city by city.",
  },
  {
    audience: "apartments",
    title: "For apartment managers",
    text: "What we hear walking apartment communities: dumpster pads, porter time and contamination fines.",
  },
];

function PostCard({ p }: { p: Post }) {
  return (
    <li>
      <Link href={`/blog/${p.slug}`} className="group block rounded-3xl border border-border bg-white overflow-hidden hover:shadow-md transition-shadow">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image.src} alt={p.image.alt} width={p.image.width} height={p.image.height} className="w-full h-48 object-cover" />
        <div className="p-6">
          <p className="text-sm text-muted">
            Updated <time dateTime={p.updated}>{fmt(p.updated)}</time> · {p.readMinutes} min read
          </p>
          <h3 className="font-heading text-2xl text-ink mt-1 group-hover:text-teal">{p.title}</h3>
          <p className="mt-2 text-ink-mid">{p.description}</p>
        </div>
      </Link>
    </li>
  );
}

export default function BlogIndex() {
  return (
    <>
      <section className="px-4 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-heading text-4xl sm:text-5xl text-ink">Trash tips and field notes from San Diego County</h1>
          <p className="mt-4 text-lg text-ink-mid">
            We&apos;re a local, owner-operated trash service. We collect trash at apartment doors five nights a week and
            roll cans to the curb for homes and short-term rentals every week. This is where we write down what we learn:
            each city&apos;s rules, what haulers will and won&apos;t pick up, and what actually keeps a trash area clean.
          </p>
          {groups.map((g) => {
            const list = livePosts.filter((p) => p.audience === g.audience);
            if (!list.length) return null;
            return (
              <section key={g.audience} className="mt-12">
                <h2 className="font-heading text-2xl sm:text-3xl text-ink">{g.title}</h2>
                <p className="mt-2 text-ink-mid">{g.text}</p>
                <ul className="mt-6 space-y-6">
                  {list.map((p) => (
                    <PostCard key={p.slug} p={p} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </section>
      <Footer />
    </>
  );
}
