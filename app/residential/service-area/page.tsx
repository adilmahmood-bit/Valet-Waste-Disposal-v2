import type { Metadata } from "next";
import { residential } from "@/config/residential";
import Link from "next/link";
import ZipCheck from "@/components/residential/ZipCheck";
import { cityPages } from "@/components/residential/cities";

export const metadata: Metadata = {
  title: "Bin to Curb Service Area: San Diego & North County",
  description: `Curbside bin service in ${residential.serviceCities.slice(0, 8).join(", ")} and more. Check your ZIP code or join the waitlist.`,
  alternates: { canonical: "/residential/service-area" },
};

export default async function ServiceAreaPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  return (
    <div className="max-w-xl mx-auto px-4 py-12 md:py-16">
      <h1 className="text-4xl font-bold">Do we serve your street?</h1>
      <p className="mt-3 text-slate-600">Enter your ZIP code. If we&apos;re not there yet, join the waitlist and we&apos;ll let you know.</p>
      <div className="mt-8">
        <ZipCheck plan={plan} />
      </div>
      <section className="mt-12">
        <h2 className="text-lg font-semibold">ZIP codes we serve today</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {residential.serviceZips.map((z) => (
            <li key={z} className="rounded-full bg-res-mist px-3 py-1 text-sm font-medium">{z}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-slate-600">Across San Diego and North County.</p>
      </section>
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Popular areas</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {cityPages.map((c) => (
            <li key={c.slug}>
              <Link href={`/residential/${c.slug}`} className="block rounded-xl border border-slate-200 px-4 py-3 font-medium hover:border-res-teal">
                {c.name} <span className="text-res-teal-dark">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
