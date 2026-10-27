import type { Metadata } from "next";
import Link from "next/link";
import { IconCalendarOff, IconUsers, IconHomePlus } from "@tabler/icons-react";
import { residential, planById } from "@/config/residential";
import ZipCheck from "@/components/residential/ZipCheck";

export const metadata: Metadata = {
  title: "Airbnb and vacation rental hosts",
  description: "Bin valet for San Diego short-term rental hosts. Bins out on trash day and back after, even between guests.",
};

const points = [
  { icon: IconCalendarOff, title: "Trash day covered", text: "Guests don't know your trash day. We do. Your bins go out the evening before pickup and come back after." },
  { icon: IconUsers, title: "Guest-ready curb", text: "No bins left at the street for days. Your property looks cared for when the next guest pulls up." },
  { icon: IconHomePlus, title: "More than one property", text: "Sign up your first property, then add the rest from the confirmation page. Each property keeps its own trash day and notes." },
];

export default function HostsPage() {
  const weekly = planById("weekly")!;
  return (
    <>
      <section className="bg-res-navy text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
          <p className="text-res-teal font-semibold text-sm uppercase tracking-[0.15em]">For Airbnb and vacation rental hosts</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold leading-tight">Trash day, handled between guests.</h1>
          <p className="mt-4 text-lg text-white/85 max-w-2xl">
            Weekly bin valet for your rental. Same price as a homeowner: ${weekly.basePrice} a month per property for up to {weekly.includedBins} bins.
          </p>
          <div className="mt-8 max-w-md">
            <ZipCheck dark />
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          {points.map((p) => (
            <div key={p.title} className="rounded-2xl bg-res-mist p-6">
              <p.icon size={30} className="text-res-teal-dark" aria-hidden="true" />
              <h2 className="mt-3 font-semibold text-lg">{p.title}</h2>
              <p className="mt-1 text-slate-700">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
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
