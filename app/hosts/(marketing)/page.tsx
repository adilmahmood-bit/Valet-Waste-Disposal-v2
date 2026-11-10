import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { IconCalendarOff, IconUsers, IconHomePlus, IconMapPinCheck, IconDeviceMobile } from "@tabler/icons-react";
import { residential, planById, advertisedPrice, money } from "@/config/residential";
import ZipCheck from "@/components/residential/ZipCheck";
import { cityPages } from "@/components/residential/cities";

export const metadata: Metadata = {
  // Written out in full: the layout's "| Valet Waste Disposal" template only applies to pages below it.
  title: { absolute: "Residential Trash Valet & Can-to-Curb Service for Airbnb & Vrbo Hosts | Valet Waste Disposal" },
  description: "Trash-to-curb trash can service for San Diego short-term rentals on Airbnb, Vrbo and other platforms. Cans out the evening before trash day and back after, even between guests.",
  alternates: { canonical: "/hosts" },
};

const points = [
  { icon: IconCalendarOff, title: "Trash day covered", text: "Guests don't know your trash day. We do. Your trash cans go out the evening before pickup and come back after." },
  { icon: IconUsers, title: "Guest-ready curb", text: "No cans left at the street for days. Your property looks cared for when the next guest pulls up." },
  { icon: IconMapPinCheck, title: "GPS and photo verified", text: "Every visit is logged by GPS, with a photo when your trash cans go out and when they're back. You know it got done." },
  { icon: IconHomePlus, title: "More than one property", text: "Sign up your first property, then add the rest from the confirmation page. Each property keeps its own trash day and notes." },
];

export default function HostsPage() {
  const weekly = planById("weekly")!;
  return (
    <>
      <section className="relative overflow-hidden bg-res-navy text-white">
        <Image src="/residential-hosts-bungalow.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[50%_60%]" />
        <div className="absolute inset-0 bg-res-navy/60" aria-hidden="true" />
        {/* Dark text shadow keeps the copy readable over the photo. */}
        <div className="relative max-w-4xl mx-auto px-4 pt-8 pb-10 md:py-24 text-shadow-md text-shadow-black/80">
          <p className="text-res-teal font-semibold text-xs md:text-sm uppercase tracking-[0.15em]">For Airbnb, Vrbo and short-term rental hosts</p>
          <h1 className="mt-2 md:mt-3 text-[2rem] md:text-5xl font-bold leading-[1.15]">Trash day, handled between guests.</h1>
          <p className="mt-3 md:mt-4 md:text-lg text-white/85 max-w-2xl">
            Weekly trash can valet for your short-term rental, whether it&apos;s listed on Airbnb, Vrbo or booked direct. Same price as a homeowner: from {money(advertisedPrice(weekly))} a month per property for up to {weekly.includedBins} cans with code {residential.promo.label}.
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
