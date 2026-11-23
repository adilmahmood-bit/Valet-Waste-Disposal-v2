import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { IconCheck, IconBuildingCottage, IconCalendarSearch, IconExternalLink } from "@tabler/icons-react";
import { residential } from "@/config/residential";
import { SITE, residentialBusiness, faqPage, breadcrumbs } from "@/components/residential/schema";
import { cityPages, cityBySlug } from "@/components/residential/cities";
import ZipCheck from "@/components/residential/ZipCheck";
import StickyCta from "@/components/residential/StickyCta";
import JsonLd from "@/components/JsonLd";
import { trashCollectors, ruleLabels } from "@/components/residential/trashDay";
import { currentYear, trashDayUpdated, formatLongDate } from "@/components/residential/holidayDates";


// One static page per city in cities.ts; any other slug is a 404.
export const dynamicParams = false;
// Rebuild daily so the year in "Holiday schedule <city> <year>" rolls over on its own.
export const revalidate = 86400;

export function generateStaticParams() {
  return cityPages.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const city = cityBySlug((await params).city);
  if (!city) return {};
  // Leads with the phrase people search for ("trash can valet <city>").
  const title = `Trash Can Valet ${city.name}, CA | Doorstep Disposal`;
  const description = `Trash can valet in ${city.name}. Every week we roll your trash, recycling and green waste cans to the curb and bring them back after pickup. Plus when trash day is in ${city.name} in ${currentYear()}.`;
  // Link previews (texts, social posts) show this city's photo. Made by scripts/city-og-images.mjs.
  const image = { url: `/residential/og/${city.slug}.jpg`, width: 1200, height: 630, alt: `${city.name}, California` };
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/residential/${city.slug}` },
    openGraph: { title, description, url: `/residential/${city.slug}`, siteName: "Doorstep Disposal", locale: "en_US", type: "website", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const city = cityBySlug((await params).city);
  if (!city) notFound();
  const { contact } = residential;
  const others = cityPages.filter((c) => c.slug !== city.slug);
  const collector = trashCollectors[city.slug];
  const year = currentYear();
  const updated = trashDayUpdated();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: `Trash can valet in ${city.name}, CA`,
        url: `${SITE}/residential/${city.slug}`,
        dateModified: updated,
      },
      {
        "@type": "Service",
        name: `Trash can valet in ${city.name}, CA`,
        serviceType: "Curbside trash can service",
        url: `${SITE}/residential/${city.slug}`,
        areaServed: { "@type": "City", name: `${city.name}, CA` },
        provider: residentialBusiness(),
      },
      faqPage(city.faqs),
      breadcrumbs([
        { name: "For Homes", path: "/residential" },
        { name: "Service area", path: "/residential/service-area" },
        { name: city.name, path: `/residential/${city.slug}` },
      ]),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <section className="relative overflow-hidden bg-res-navy text-white">
        {city.photo && (
          <>
            <Image
              src={`/residential/cities/${city.slug}.jpg`}
              alt={`${city.name}, California`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: city.photo.position ?? "50% 50%" }}
            />
            <div className="absolute inset-0 bg-res-navy/75 md:bg-res-navy/60" aria-hidden="true" />
          </>
        )}
        {/* Dark text shadow keeps the copy readable over the photo. */}
        <div className={`relative max-w-4xl mx-auto px-4 pt-8 pb-10 md:py-20 ${city.photo ? "text-shadow-md text-shadow-black/80" : ""}`}>
          <nav aria-label="Breadcrumb" className="text-xs text-white/60">
            <Link href="/residential" className="hover:text-white">For Homes</Link> ›{" "}
            <Link href="/residential/service-area" className="hover:text-white">Service area</Link> › <span className="text-white/80">{city.name}</span>
          </nav>
          <h1 className="mt-3 text-[2rem] md:text-5xl font-bold leading-[1.15]">Trash can valet in {city.name}</h1>
          <p className="mt-2 text-[#7FDDE6] font-semibold">Trash cans to the curb and back, every week</p>
          <p className="mt-3 md:mt-4 md:text-lg text-white/85 max-w-2xl">{city.intro}</p>
          <div className="mt-6 max-w-md">
            <p className="font-semibold text-sm md:text-base mb-2">Check your ZIP</p>
            <div className="text-shadow-none">
              <ZipCheck dark />
            </div>
            <Link
              href="/residential/pricing"
              className="text-shadow-none mt-4 block w-full sm:inline-block sm:w-auto rounded-full border-2 border-white/70 px-6 py-3 text-center font-semibold text-white hover:border-res-teal hover:text-res-teal"
            >
              See plans and pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold">{city.localHeading}</h2>
          {city.local.map((p) => (
            <p key={p.slice(0, 30)} className="mt-4 text-slate-700 leading-relaxed">{p}</p>
          ))}

          <div className="mt-8 grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold">Who uses it in {city.name}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {city.whoUsesIt.map((w) => (
                  <li key={w} className="flex gap-2">
                    <IconCheck size={18} className="text-res-teal-dark shrink-0" aria-hidden="true" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Neighborhoods</h3>
              <p className="mt-3 text-sm text-slate-700 leading-relaxed">{city.neighborhoods.join(" · ")}</p>
              <h3 className="mt-5 font-semibold">ZIP codes</h3>
              <p className="mt-2 text-sm text-slate-700">{city.zips.join(", ")}</p>
            </div>
          </div>

          {city.strHeavy && (
            <Link href="/hosts" className="mt-8 flex items-start gap-3 rounded-2xl bg-res-mist p-5 hover:ring-2 hover:ring-res-teal">
              <IconBuildingCottage size={28} className="text-res-teal-dark shrink-0" aria-hidden="true" />
              <span>
                <span className="block font-semibold">Run a short-term rental in {city.name}?</span>
                <span className="block text-sm text-slate-700">Airbnb, Vrbo or booked direct, guests don&apos;t need to know your trash day. See how it works for hosts →</span>
              </span>
            </Link>
          )}

          {collector && (
            <div id="trash-day" className="scroll-mt-4 mt-8 rounded-2xl border border-slate-200 p-5 md:p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <IconCalendarSearch size={22} className="text-res-teal-dark shrink-0" aria-hidden="true" />
                When is trash day in {city.name}? ({year})
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Updated <time dateTime={updated}>{formatLongDate(updated)}</time>
              </p>
              <p className="mt-2 text-slate-700">It depends on your street. {collector.who}</p>
              <a
                href={collector.lookupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-res-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-res-teal-dark"
              >
                Look up your trash day <IconExternalLink size={16} aria-hidden="true" />
              </a>
              <p className="mt-1.5 text-xs text-slate-500">Opens the {collector.lookupLabel}.</p>
              {collector.note && <p className="mt-3 text-sm text-slate-600">{collector.note}</p>}
              {collector.map && (
                <figure className="mt-5">
                  <a href={collector.map.src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <Image
                      src={collector.map.src}
                      alt={`${collector.name} trash pickup day map for ${city.name}`}
                      width={collector.map.width}
                      height={collector.map.height}
                      sizes="(min-width: 768px) 700px, 100vw"
                      className="h-auto w-full"
                    />
                  </a>
                  <figcaption className="mt-1.5 text-xs text-slate-500">
                    {city.name} pickup day map from {collector.name}. Tap to enlarge. Use the lookup above to confirm the day for your address.
                  </figcaption>
                </figure>
              )}
              {ruleLabels.some(([k]) => collector.rules[k]) && (
                <>
                  <h4 className="mt-5 font-semibold">Collection rules in {city.name}</h4>
                  <dl className="mt-2 space-y-2 text-sm text-slate-700">
                    {ruleLabels.map(([k, label]) =>
                      collector.rules[k] ? (
                        <div key={k}>
                          <dt className="inline font-semibold">{k === "holidays" ? `Holiday schedule ${city.name} ${year}` : label}: </dt>
                          <dd className="inline">{collector.rules[k]}</dd>
                        </div>
                      ) : null,
                    )}
                  </dl>
                </>
              )}
              <p className="mt-3 text-sm text-slate-700">Once you sign up, we track your trash day for you, holiday weeks included.</p>
            </div>
          )}

        </div>
      </section>

      <section>
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-2xl bg-res-mist p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold">Rather not worry about trash day for {city.name}?</h2>
            <p className="mt-2 text-slate-700">
              We track your trash day, holiday weeks included, and roll your cans to the curb the evening before and back after pickup.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/residential/signup" className="rounded-full bg-res-teal-dark px-6 py-3 font-semibold text-white hover:bg-res-navy">Get started</Link>
              <Link href="/residential/pricing" className="rounded-full border-2 border-res-navy px-6 py-3 font-semibold hover:bg-res-navy hover:text-white">See plans and pricing</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold">{city.name} questions</h2>
          <dl className="mt-4 divide-y divide-slate-200">
            {city.faqs.map((f) => (
              <div key={f.q} className="py-4">
                <dt className="font-semibold">{f.q}</dt>
                <dd className="mt-1.5 text-slate-700">{f.a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4">
            <Link href="/residential/faq" className="font-semibold text-res-teal-dark underline underline-offset-4">All questions</Link>
          </p>

          <h2 className="mt-12 text-xl font-bold">Other areas we serve</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {others.map((c) => (
              <li key={c.slug}>
                <Link href={`/residential/${c.slug}`} className="inline-block rounded-full bg-res-mist px-3 py-1.5 text-sm font-medium hover:bg-res-teal-dark hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/residential/service-area" className="inline-block rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium hover:border-res-teal">
                All ZIP codes
              </Link>
            </li>
          </ul>

          <p className="mt-10 text-center md:text-lg text-slate-700">
            Questions? Call or text us at{" "}
            <a href={`tel:${contact.phoneHref}`} className="font-semibold text-res-teal-dark whitespace-nowrap">{contact.phone}</a>.
          </p>
        </div>
      </section>

      <StickyCta />
    </>
  );
}
