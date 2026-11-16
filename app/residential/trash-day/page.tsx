import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { IconChevronDown, IconExternalLink } from "@tabler/icons-react";
import { residential } from "@/config/residential";
import { cityPages } from "@/components/residential/cities";
import { trashCollectors } from "@/components/residential/trashDay";
import { otherAreas, type OtherArea } from "@/components/residential/trashDayLookup";
import TrashDayFinder from "@/components/residential/TrashDayFinder";
import JsonLd from "@/components/JsonLd";
import { faqPage, breadcrumbs } from "@/components/residential/schema";

const shareImage = { url: "/residential/og/trash-day.jpg", width: 1200, height: 630, alt: "San Diego skyline at night" };

export const metadata: Metadata = {
  title: { absolute: "When Is Trash Day in San Diego? Find Your Pickup Day | Doorstep Disposal" },
  description: "What day is trash day in San Diego? Enter your city or ZIP to find your pickup day, collection rules and holiday schedule anywhere in San Diego County.",
  alternates: { canonical: "/residential/trash-day" },
  openGraph: {
    title: "When is trash day in San Diego?",
    description: "Find your trash pickup day, collection rules and holiday schedule anywhere in San Diego County.",
    url: "/residential/trash-day",
    siteName: "Doorstep Disposal",
    locale: "en_US",
    type: "website",
    images: [shareImage],
  },
  twitter: { card: "summary_large_image", images: [shareImage] },
};

// The first question matches how people search ("what day is trash day in San Diego"). It is shown
// on the page and marked up as an FAQ so search engines and AI tools can quote the answer.
const faqs = [
  {
    q: "What day is trash day in San Diego?",
    a: "There's no single trash day in San Diego. Each street has its own collection day, Monday through Friday, and a holiday can push it one day later that week. Enter your city, neighborhood or ZIP code above to find your day, or use the City of San Diego's collection lookup if you live in the city.",
  },
  {
    q: "When is trash day in San Diego?",
    a: "It depends on your street. In the City of San Diego, single-family homes are collected by Environmental Services on a set weekday, and the City's online lookup shows your day. Other cities in the county use a contracted hauler such as EDCO, WM or Republic Services, each with its own lookup.",
  },
  {
    q: "Do holidays change my trash day?",
    a: "Often, yes. In most San Diego County cities, a weekday holiday pushes pickup one day later for the rest of that week. Each city page above lists the holiday rules for that area.",
  },
  {
    q: "What time do trash cans need to be out?",
    a: "In most of San Diego County, carts need to be at the curb by 6 a.m. on collection day. Some cities also set a time to bring them back in. Check your city's page for its rules.",
  },
];

// City pages grouped by who collects the trash, for the list under the finder.
const byHauler = cityPages.reduce<Record<string, typeof cityPages>>((acc, c) => {
  const name = trashCollectors[c.slug]?.name ?? "Other";
  (acc[name] ??= []).push(c);
  return acc;
}, {});

// Rows shown before "Show more areas": San Diego, Escondido and Poway.
const SHOWN = 3;

function AreaRow({ a }: { a: OtherArea }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
      <span>
        <span className="font-semibold">{a.name === "San Diego" ? "Other City of San Diego neighborhoods" : a.name}</span>
        <span className="block text-sm text-slate-600">{a.name.startsWith("Unincorporated") ? "Several haulers, by community" : a.hauler}</span>
      </span>
      <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-res-teal-dark hover:underline">
        Look up <IconExternalLink size={15} aria-hidden="true" />
        <span className="sr-only">trash day: {a.linkLabel}</span>
      </a>
    </li>
  );
}

export default function TrashDayPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            faqPage(faqs),
            breadcrumbs([
              { name: "For Homes", path: "/residential" },
              { name: "Trash day", path: "/residential/trash-day" },
            ]),
          ],
        }}
      />

      <section className="relative overflow-hidden bg-res-navy text-white">
        <Image
          src="/residential/trash-day-san-diego.jpg"
          alt="San Diego skyline at night across the bay"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_55%]"
        />
        <div className="absolute inset-0 bg-res-navy/70 md:bg-res-navy/55" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto px-4 pt-8 pb-10 md:py-20 text-shadow-md text-shadow-black/80">
          <nav aria-label="Breadcrumb" className="text-xs text-white/60">
            <Link href="/residential" className="hover:text-white">For Homes</Link> › <span className="text-white/80">Trash day</span>
          </nav>
          <h1 className="mt-3 text-[2rem] md:text-5xl font-bold leading-[1.15]">When is trash day in San Diego?</h1>
          <p className="mt-3 md:mt-4 md:text-lg text-white/85">
            Pickup days change street by street. Enter your city, neighborhood or ZIP code to find your day, plus the set-out
            rules and holiday schedule where you live.
          </p>
          <div className="mt-6">
            <TrashDayFinder />
          </div>
        </div>
      </section>

      <section className="py-10 md:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold">Trash day by area</h2>
          <p className="mt-3 text-slate-700">Each page has a link to look up your exact day, a pickup map where one is published, and local collection rules.</p>
          <div className="mt-6 space-y-6">
            {Object.entries(byHauler).map(([hauler, cities]) => (
              <div key={hauler}>
                <h3 className="font-semibold">Collected by {hauler}</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {cities.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/residential/${c.slug}#trash-day`} className="inline-block rounded-full bg-res-mist px-3 py-1.5 text-sm font-medium hover:bg-res-teal-dark hover:text-white">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <h2 className="mt-12 text-2xl md:text-3xl font-bold">Other San Diego County areas</h2>
          <p className="mt-3 text-slate-700">Look up your day on the collector&apos;s own site.</p>
          {/* The first few areas show; the rest open from "Show more areas". */}
          <ul className="mt-4 divide-y divide-slate-200 border-t border-slate-200">
            {otherAreas.slice(0, SHOWN).map((a) => <AreaRow key={a.name} a={a} />)}
          </ul>
          <details className="group border-y border-slate-200">
            <summary className="flex cursor-pointer list-none items-center justify-between py-3 font-semibold text-res-teal-dark [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">Show {otherAreas.length - SHOWN} more areas</span>
              <span className="hidden group-open:inline">Show fewer areas</span>
              <IconChevronDown size={20} className="transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <ul className="divide-y divide-slate-200 border-t border-slate-200">
              {otherAreas.slice(SHOWN).map((a) => <AreaRow key={a.name} a={a} />)}
            </ul>
          </details>

          <div className="mt-12 rounded-2xl bg-res-mist p-6">
            <h2 className="text-xl md:text-2xl font-bold">Rather not think about trash day at all?</h2>
            <p className="mt-2 text-slate-700">
              We track your trash day, holiday weeks included, and roll your cans to the curb the evening before and back after pickup.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/residential/signup" className="rounded-full bg-res-teal-dark px-6 py-3 font-semibold text-white hover:bg-res-navy">Get started</Link>
              <Link href="/residential/pricing" className="rounded-full border-2 border-res-navy px-6 py-3 font-semibold hover:bg-res-navy hover:text-white">See plans and pricing</Link>
            </div>
          </div>

          <h2 className="mt-12 text-2xl md:text-3xl font-bold">Trash day questions</h2>
          <dl className="mt-4 divide-y divide-slate-200">
            {faqs.map((f) => (
              <div key={f.q} className="py-4">
                <dt className="font-semibold">{f.q}</dt>
                <dd className="mt-1.5 text-slate-700">{f.a}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-10 text-center md:text-lg text-slate-700">
            Questions? Call or text us at{" "}
            <a href={`tel:${residential.contact.phoneHref}`} className="font-semibold text-res-teal-dark whitespace-nowrap">{residential.contact.phone}</a>.
          </p>
        </div>
      </section>
    </>
  );
}
