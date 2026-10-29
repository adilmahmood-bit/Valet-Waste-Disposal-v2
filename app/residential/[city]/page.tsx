import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconCheck, IconBuildingCottage } from "@tabler/icons-react";
import { residential, planById, enabledPlans } from "@/config/residential";
import { cityPages, cityBySlug } from "@/components/residential/cities";
import ZipCheck from "@/components/residential/ZipCheck";
import PlanCards from "@/components/residential/PlanCards";
import StickyCta from "@/components/residential/StickyCta";
import JsonLd from "@/components/JsonLd";

const SITE = "https://yourdoorstepdisposal.com";

// One static page per city in cities.ts; any other slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return cityPages.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const city = cityBySlug((await params).city);
  if (!city) return {};
  const weekly = planById("weekly")!;
  return {
    title: { absolute: `Bin Valet in ${city.name}, CA | Valet Waste Disposal` },
    description: `Trash can to curb service in ${city.name}. We take your bins to the curb the evening before pickup and bring them back after. From $${weekly.basePrice}/month for up to ${weekly.includedBins} bins.`,
    alternates: { canonical: `/residential/${city.slug}` },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const city = cityBySlug((await params).city);
  if (!city) notFound();
  const { contact } = residential;
  const weekly = planById("weekly")!;
  const others = cityPages.filter((c) => c.slug !== city.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: `Bin valet in ${city.name}, CA`,
        serviceType: "Curbside trash can service",
        url: `${SITE}/residential/${city.slug}`,
        areaServed: { "@type": "City", name: `${city.name}, CA` },
        provider: { "@type": "LocalBusiness", name: "Valet Waste Disposal", url: SITE, telephone: `+1-${contact.phone}`, email: contact.email },
        offers: enabledPlans().map((p) => ({ "@type": "Offer", name: p.name, price: p.basePrice, priceCurrency: "USD" })),
      },
      {
        "@type": "FAQPage",
        mainEntity: city.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "For Homes", item: `${SITE}/residential` },
          { "@type": "ListItem", position: 2, name: "Service area", item: `${SITE}/residential/service-area` },
          { "@type": "ListItem", position: 3, name: city.name, item: `${SITE}/residential/${city.slug}` },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <section className="bg-res-navy text-white">
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-10 md:py-16">
          <nav aria-label="Breadcrumb" className="text-xs text-white/60">
            <Link href="/residential" className="hover:text-white">For Homes</Link> ›{" "}
            <Link href="/residential/service-area" className="hover:text-white">Service area</Link> › <span className="text-white/80">{city.name}</span>
          </nav>
          <h1 className="mt-3 text-[2rem] md:text-5xl font-bold leading-[1.15]">Bin valet in {city.name}</h1>
          <p className="mt-2 text-res-teal font-semibold">Trash cans to the curb and back, every week</p>
          <p className="mt-3 md:mt-4 md:text-lg text-white/85 max-w-2xl">{city.intro}</p>
          <div className="mt-6 max-w-md">
            <p className="font-semibold text-sm md:text-base mb-2">Check your ZIP</p>
            <ZipCheck dark />
            <p className="mt-3 text-sm text-white/75">
              From <span className="font-semibold text-white">${weekly.basePrice}/month</span> for up to {weekly.includedBins} bins.
            </p>
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
            <Link href="/residential/hosts" className="mt-8 flex items-start gap-3 rounded-2xl bg-res-mist p-5 hover:ring-2 hover:ring-res-teal">
              <IconBuildingCottage size={28} className="text-res-teal-dark shrink-0" aria-hidden="true" />
              <span>
                <span className="block font-semibold">Run a short-term rental in {city.name}?</span>
                <span className="block text-sm text-slate-700">Airbnb, Vrbo or booked direct, guests don&apos;t need to know your trash day. See how it works for hosts →</span>
              </span>
            </Link>
          )}
        </div>
      </section>

      <section className="py-10 md:py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center">Plans for {city.name} homes</h2>
          <div className="mt-6 md:mt-10">
            <PlanCards />
          </div>
          <p className="mt-5 text-center text-sm text-slate-600">
            Steep driveway, stairs, or a long walk to the curb? We&apos;ll text you a custom price.
          </p>
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
