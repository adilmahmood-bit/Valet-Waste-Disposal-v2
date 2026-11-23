import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import { posts, formatPostDate as fmt } from "@/lib/blog";

export const metadata: Metadata = {
  title: { absolute: "Blog: Apartment Trash and Valet Trash in San Diego | Valet Waste Disposal" },
  description:
    "Field notes for San Diego apartment managers on dumpster pads, porter time, contamination fines and valet trash.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  return (
    <>
      <section className="px-4 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-heading text-4xl sm:text-5xl text-ink">Field notes for apartment managers</h1>
          <p className="mt-4 text-lg text-ink-mid">
            What we hear walking San Diego County apartment communities: dumpster pads, porter time, contamination fines
            and how valet trash fits in.
          </p>
          <ul className="mt-10 space-y-6">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group block rounded-3xl border border-border bg-white overflow-hidden hover:shadow-md transition-shadow">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image.src} alt={p.image.alt} width={p.image.width} height={p.image.height} className="w-full h-48 object-cover" />
                  <div className="p-6">
                    <p className="text-sm text-muted">
                      Updated <time dateTime={p.updated}>{fmt(p.updated)}</time> · {p.readMinutes} min read
                    </p>
                    <h2 className="font-heading text-2xl text-ink mt-1 group-hover:text-teal">{p.title}</h2>
                    <p className="mt-2 text-ink-mid">{p.description}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <Footer />
    </>
  );
}
