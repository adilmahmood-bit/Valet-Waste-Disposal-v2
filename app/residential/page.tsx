import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { IconCalendarEvent, IconArrowBigUpLines, IconArrowBigDownLines, IconHome, IconPlaneDeparture, IconHeartHandshake, IconBuildingCottage, IconPhone, IconMessage, IconCheck } from "@tabler/icons-react";
import { residential, planById, enabledPlans } from "@/config/residential";
import JsonLd from "@/components/JsonLd";
import StickyCta from "@/components/residential/StickyCta";
import { cityPages } from "@/components/residential/cities";
import ZipCheck from "@/components/residential/ZipCheck";
import PlanCards from "@/components/residential/PlanCards";
import { faqs } from "@/components/residential/faq";

const steps = [
  { icon: IconCalendarEvent, title: "Sign up and tell us your trash day.", text: "Pick your plan and tell us where your bins live." },
  { icon: IconArrowBigUpLines, title: "The evening before pickup, we roll your bins to the curb.", text: "Trash, recycling and green waste." },
  { icon: IconArrowBigDownLines, title: "After pickup, we bring them back to their spot.", text: "Your curb stays clear." },
];

const audiences = [
  { icon: IconHome, title: "Busy families", text: "One less chore on a busy weeknight." },
  { icon: IconHeartHandshake, title: "Seniors", text: "Or anyone who finds heavy bins hard to move.", href: "/residential/seniors" },
  { icon: IconPlaneDeparture, title: "Travelers", text: "Your bins still go out while you're away." },
  { icon: IconBuildingCottage, title: "Airbnb & Vrbo hosts", text: "Short-term rental guests don't need to know your trash day.", href: "/residential/hosts" },
];

const trust = ["Background-checked staff", "Locally owned in San Diego", "Follows your city's holiday schedule"];

// Sections are compact on phones (most visitors arrive from a door knock or a post) and open up on desktop.
const section = "py-10 md:py-20";
const heading = "text-2xl md:text-3xl font-bold text-center";

export const metadata: Metadata = { alternates: { canonical: "/residential" } };

const SITE = "https://yourdoorstepdisposal.com";

// What Google reads about this page: a curbside bin service, who provides it, where, and for how much.
function serviceJsonLd() {
  const { contact } = residential;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Residential bin valet (bin-to-curb service)",
    serviceType: "Curbside trash can service",
    url: `${SITE}/residential`,
    description: "We take trash, recycling and green waste bins to the curb the evening before pickup and bring them back after.",
    provider: {
      "@type": "LocalBusiness",
      name: "Valet Waste Disposal",
      url: SITE,
      telephone: `+1-${contact.phone}`,
      email: contact.email,
      image: `${SITE}/logo/vwd-logo-navy.png`,
      address: { "@type": "PostalAddress", addressLocality: "San Diego", addressRegion: "CA", addressCountry: "US" },
    },
    areaServed: residential.serviceCities.map((name) => ({ "@type": "City", name: `${name}, CA` })),
    offers: enabledPlans().map((p) => ({
      "@type": "Offer",
      name: p.name,
      priceCurrency: "USD",
      price: p.basePrice,
      ...(p.billing === "monthly" && {
        priceSpecification: { "@type": "UnitPriceSpecification", price: p.basePrice, priceCurrency: "USD", unitText: "MONTH" },
      }),
    })),
  };
}

export default function ResidentialHome() {
  const { contact } = residential;
  const weekly = planById("weekly")!;
  return (
    <>
      <JsonLd data={serviceJsonLd()} />
      <section className="relative overflow-hidden bg-res-navy text-white">
        <Image src="/residential-hero-bins.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[70%_20%]" />
        <div className="absolute inset-0 bg-res-navy/60" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-10 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          {/* Dark text shadow keeps the copy readable over the photo. */}
          <div className="text-shadow-md text-shadow-black/80">
            <p className="text-res-teal font-semibold text-xs md:text-sm uppercase tracking-[0.15em]">Bin-to-curb valet · San Diego</p>
            <h1 className="mt-2 md:mt-3 text-[2rem] md:text-5xl font-bold leading-[1.15]">Your bins to the curb and back. Every week.</h1>
            <p className="mt-3 md:mt-4 md:text-lg text-white/85">
              We roll your trash, recycling and green waste bins out the evening before pickup, then bring them back after.
            </p>
            <div className="mt-6 max-w-md">
              <p className="font-semibold text-sm md:text-base mb-2">Check if we serve your street</p>
              <div className="text-shadow-none">
                <ZipCheck dark />
              </div>
              <p className="mt-3 text-sm text-white/75">
                From <span className="font-semibold text-white">${weekly.basePrice}/month</span> for up to {weekly.includedBins} bins.
              </p>
            </div>
            <ul className="mt-6 space-y-1.5 text-sm text-white/85 md:hidden">
              {trust.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <IconCheck size={16} className="text-res-teal shrink-0" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Price card: desktop only. On phones the price sits under the ZIP check and in Plans below. */}
          <div className="hidden md:block rounded-3xl bg-res-navy/80 border border-white/10 p-8">
            <p className="text-sm text-white/70">Weekly out &amp; back</p>
            <p className="mt-1 text-5xl font-bold">${weekly.basePrice}<span className="text-xl font-medium text-white/70"> / month</span></p>
            <p className="mt-2 text-white/80">Up to {weekly.includedBins} bins. Month-to-month.</p>
            <ul className="mt-6 space-y-3 text-white/90">
              {trust.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <IconCheck size={18} className="text-res-teal shrink-0" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`tel:${contact.phoneHref}`} className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-5 py-2.5 font-semibold hover:border-res-teal">
                <IconPhone size={18} aria-hidden="true" /> Call
              </a>
              <a href={`sms:${contact.phoneHref}`} className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-5 py-2.5 font-semibold hover:border-res-teal">
                <IconMessage size={18} aria-hidden="true" /> Text
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className={`scroll-mt-20 ${section}`}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className={heading}>How it works</h2>
          <ol className="mt-6 md:mt-10 grid md:grid-cols-3 gap-5 md:gap-6">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4 md:block md:rounded-2xl md:bg-res-mist md:p-6">
                <div className="flex items-center gap-3 shrink-0">
                  <span className="grid place-items-center h-9 w-9 md:h-10 md:w-10 rounded-full bg-res-navy text-white font-bold">{i + 1}</span>
                  <s.icon size={28} className="hidden md:block text-res-teal-dark" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold md:mt-4 md:text-lg leading-snug">{s.title}</p>
                  <p className="mt-0.5 md:mt-1 text-sm md:text-base text-slate-600">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`${section} bg-slate-50`}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className={heading}>Who it&apos;s for</h2>
          <div className="mt-6 md:mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            {audiences.map((a) => {
              const body = (
                <>
                  <a.icon size={26} className="text-res-teal-dark" aria-hidden="true" />
                  <p className="mt-2 font-semibold leading-snug">{a.title}</p>
                  <p className="mt-1 text-sm text-slate-600 leading-snug">{a.text}</p>
                  {a.href && <p className="mt-2 text-sm font-semibold text-res-teal-dark">Learn more →</p>}
                </>
              );
              const box = "rounded-2xl bg-white border border-slate-200 p-4 md:p-6";
              return a.href ? (
                <Link key={a.title} href={a.href} className={`${box} hover:border-res-teal`}>{body}</Link>
              ) : (
                <div key={a.title} className={box}>{body}</div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="plans" className={section}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className={heading}>Plans</h2>
          <div className="mt-6 md:mt-10">
            <PlanCards />
          </div>
          <p className="mt-5 text-center text-sm text-slate-600 max-w-md mx-auto">
            Steep driveway, stairs, or a long walk to the curb? We&apos;ll text you a custom price.{" "}
            <Link href="/residential/pricing" className="font-semibold text-res-teal-dark underline underline-offset-4 whitespace-nowrap">Full pricing</Link>
          </p>
        </div>
      </section>

      <section className={`${section} bg-slate-50`}>
        <div className="max-w-3xl mx-auto px-4">
          <h2 className={heading}>Curbside bin service in San Diego and North County</h2>
          <p className="mt-4 text-slate-700 leading-relaxed">
            Valet Waste Disposal is a bin-to-curb service for homes. The evening before your trash day, we take your trash,
            recycling and green waste cans curbside. After the truck comes, we bring them back to your side yard or garage.
            No more hauling heavy bins down the driveway or leaving them at the street all day.
          </p>
          <p className="mt-4 text-sm text-slate-600 leading-relaxed">
            <span className="font-semibold text-res-navy">Where we work:</span> {residential.serviceCities.join(", ")}.{" "}
            <Link href="/residential/service-area" className="font-semibold text-res-teal-dark underline underline-offset-4 whitespace-nowrap">Check your ZIP</Link>
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {cityPages.map((c) => (
              <li key={c.slug}>
                <Link href={`/residential/${c.slug}`} className="inline-block rounded-full bg-white border border-slate-200 px-3 py-1.5 text-sm font-medium hover:border-res-teal">
                  Bin valet in {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${section} bg-res-mist`}>
        <div className="max-w-3xl mx-auto px-4">
          <h2 className={heading}>Questions</h2>
          <div className="mt-4 md:mt-8 divide-y divide-slate-300/60">
            {faqs.slice(0, 4).map((f) => (
              <details key={f.q} className="py-3.5 md:py-4 group">
                <summary className="cursor-pointer font-semibold list-none flex justify-between gap-4">
                  {f.q}
                  <span className="text-res-teal-dark text-xl leading-none group-open:rotate-45 transition-transform" aria-hidden="true">+</span>
                </summary>
                <p className="mt-2 text-slate-700">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-5 text-center">
            <Link href="/residential/faq" className="font-semibold text-res-teal-dark underline underline-offset-4">All questions</Link>
          </p>
        </div>
      </section>

      <section className={section}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className={heading}>Rather talk to a person?</h2>
          <p className="mt-3 md:text-lg text-slate-700">
            Call or text us at{" "}
            <a href={`tel:${contact.phoneHref}`} className="font-semibold text-res-teal-dark whitespace-nowrap">{contact.phone}</a>.
          </p>
        </div>
      </section>

      <StickyCta />
    </>
  );
}
