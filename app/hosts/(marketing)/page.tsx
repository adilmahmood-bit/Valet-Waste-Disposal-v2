import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { IconCalendarOff, IconUsers, IconHomePlus, IconMapPinCheck, IconDeviceMobile } from "@tabler/icons-react";
import { residential, planById, advertisedPrice, money } from "@/config/residential";
import ZipCheck from "@/components/residential/ZipCheck";
import { cityPages } from "@/components/residential/cities";
import JsonLd from "@/components/JsonLd";
import { SITE, businessRef, residentialBusiness, offers, faqPage, breadcrumbs } from "@/components/residential/schema";

export const metadata: Metadata = {
  // Written out in full: the layout's title template only applies to pages below it.
  title: { absolute: "Doorstep Disposal - Trash-to-Curb for Airbnb & Vrbo Hosts" },
  description: "Trash-to-curb service for San Diego Airbnb and Vrbo rentals. Cans out the evening before trash day and back after, even between guests.",
  alternates: { canonical: "/hosts" },
  openGraph: {
    siteName: "Doorstep Disposal",
    locale: "en_US",
    type: "website",
    images: [{ url: "/residential-hosts-bungalow.jpg", width: 1792, height: 1008, alt: "Trash cans at the curb in front of a beach rental with surfboards by the garage" }],
  },
};

const steps = [
  { title: "Sign up each property", text: "Tell us the address, trash day, where the cans are kept and any gate code. Add more properties after the first." },
  { title: "Cans out the evening before", text: "We roll the trash, recycling and green waste cans to the curb the evening before pickup, whoever is staying." },
  { title: "Cans back after pickup", text: "After the truck comes, the cans go back to their spot. You get a GPS-logged photo of each step." },
];

const points = [
  { icon: IconCalendarOff, title: "Trash day covered", text: "Guests don't know your trash day. We do. Your trash cans go out the evening before pickup and come back after." },
  { icon: IconUsers, title: "Guest-ready curb", text: "No cans left at the street for days. Your property looks cared for when the next guest pulls up." },
  { icon: IconMapPinCheck, title: "GPS and photo verified", text: "Every visit is logged by GPS, with a photo when your trash cans go out and when they're back. You know it got done." },
  { icon: IconHomePlus, title: "More than one property", text: "Sign up your first property, then add the rest from the confirmation page. Each property keeps its own trash day and notes." },
];

// Shown on the page and in the FAQ structured data. Same facts as the residential FAQ.
function hostFaqs(weekly: NonNullable<ReturnType<typeof planById>>) {
  return [
    {
      q: "How does trash-to-curb service work for an Airbnb or Vrbo?",
      a: "Every week we take your trash cans to the curb the evening before pickup and bring them back after the truck comes. Your guests don't need to know your trash day or do anything.",
    },
    {
      q: "How much does it cost for a short-term rental?",
      a: `The same as a homeowner: from ${money(advertisedPrice(weekly))} a month per property for up to ${weekly.includedBins} cans with code ${residential.promo.label}. See the pricing page for every plan.`,
    },
    {
      q: "How do I know the cans went out and came back?",
      a: "Every visit is logged by GPS, with a photo when your trash cans go out and when they're back.",
    },
    {
      q: "Can I add more than one rental property?",
      a: "Yes. Sign up your first property, then add the rest from the confirmation page. Each property keeps its own trash day and notes. Managing a larger portfolio? Call or text us.",
    },
    {
      q: "What if my rental has a gate code?",
      a: "Add it when you sign up. It's stored encrypted, and only our office and the person servicing your property can see it.",
    },
    {
      q: "What happens on holiday weeks?",
      a: "We follow your city's holiday collection schedule. If your pickup moves a day, we move with it.",
    },
  ];
}

export default function HostsPage() {
  const weekly = planById("weekly")!;
  const faqs = hostFaqs(weekly);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            residentialBusiness(),
            {
              "@type": "Service",
              name: "Trash-to-curb service for Airbnb and Vrbo hosts",
              serviceType: "Curbside trash can service for short-term rentals",
              url: `${SITE}/hosts`,
              description: "Weekly trash can valet for short-term rentals in San Diego and North County: cans to the curb the evening before pickup and back after, with GPS and photo logs.",
              audience: { "@type": "BusinessAudience", audienceType: "Short-term rental hosts and property managers" },
              provider: businessRef(),
              offers: offers(),
            },
            faqPage(faqs),
            breadcrumbs([{ name: "For Homes", path: "/residential" }, { name: "Airbnb & Vrbo hosts", path: "/hosts" }]),
          ],
        }}
      />
      <section className="relative overflow-hidden bg-res-navy text-white">
        <Image src="/residential-hosts-bungalow.jpg" alt="Trash, recycling and green waste cans at the curb in front of a beach rental home" fill priority sizes="100vw" className="object-cover object-[50%_60%]" />
        <div className="absolute inset-0 bg-res-navy/60" aria-hidden="true" />
        {/* Dark text shadow keeps the copy readable over the photo. */}
        <div className="relative max-w-4xl mx-auto px-4 pt-8 pb-10 md:py-24 text-shadow-md text-shadow-black/80">
          <p className="text-res-teal font-semibold text-xs md:text-sm uppercase tracking-[0.15em]">For Airbnb, Vrbo and short-term rental hosts</p>
          <h1 className="mt-2 md:mt-3 text-[2rem] md:text-5xl font-bold leading-[1.15]">Trash day, handled between guests.</h1>
          <p className="mt-3 md:mt-4 md:text-lg text-white/85 max-w-2xl">
            Weekly trash can valet for your short-term rental, whether it&apos;s listed on Airbnb, Vrbo or booked direct. Same price as a homeowner: from <s className="opacity-60">{money(weekly.basePrice)}</s> {money(advertisedPrice(weekly))} a month per property for up to {weekly.includedBins} cans with code {residential.promo.label}.
          </p>
          <div className="mt-6 md:mt-8 max-w-md text-shadow-none">
            <ZipCheck dark />
          </div>
          <Link
            href="/hosts/portal"
            className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-white/60 px-5 py-2.5 text-sm font-semibold text-shadow-none hover:border-res-teal hover:bg-white/10"
          >
            <IconDeviceMobile size={18} aria-hidden="true" /> See the host portal
          </Link>
        </div>
      </section>

      <section className="py-10 md:py-20">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {points.map((p) => (
            <div key={p.title} className="rounded-2xl bg-res-mist p-5 md:p-6">
              <p.icon size={30} className="text-res-teal-dark" aria-hidden="true" />
              <h2 className="mt-3 font-semibold text-lg">{p.title}</h2>
              <p className="mt-1 text-slate-700">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-10 md:pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center">How it works for hosts</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3 md:gap-6">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-slate-200 p-5 md:p-6">
                <p className="text-sm font-semibold text-res-teal-dark">Step {i + 1}</p>
                <h3 className="mt-1 font-semibold text-lg">{s.title}</h3>
                <p className="mt-1 text-slate-700">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="pb-10 md:pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center">Questions from hosts</h2>
          <div className="mt-6 divide-y divide-slate-200">
            {faqs.map((f) => (
              <div key={f.q} className="py-5">
                <h3 className="font-semibold text-lg">{f.q}</h3>
                <p className="mt-2 text-slate-700 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center">
            <Link href="/residential/faq" className="font-semibold text-res-teal-dark underline underline-offset-4">More questions and answers</Link>
          </p>
        </div>
      </section>

      <section className="pb-12 md:pb-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold">Popular rental areas</h2>
          <ul className="mt-4 mb-12 flex flex-wrap justify-center gap-2">
            {cityPages.filter((c) => c.strHeavy).map((c) => (
              <li key={c.slug}>
                <Link href={`/residential/${c.slug}`} className="inline-block rounded-full bg-res-mist px-4 py-2 text-sm font-medium hover:bg-res-teal-dark hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="text-2xl font-bold">Managing several properties?</h2>
          <p className="mt-3 text-slate-700">
            Call or text us at{" "}
            <a href={`tel:${residential.contact.phoneHref}`} className="font-semibold text-res-teal-dark whitespace-nowrap">{residential.contact.phone}</a>{" "}
            to talk about your portfolio.
          </p>
          <Link href="/residential/pricing" className="mt-6 inline-block rounded-full border-2 border-res-navy px-6 py-3 font-semibold hover:bg-res-navy hover:text-white">
            See pricing
          </Link>
        </div>
      </section>
    </>
  );
}
