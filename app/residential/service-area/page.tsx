import type { Metadata } from "next";
import { residential } from "@/config/residential";
import ZipCheck from "@/components/residential/ZipCheck";

export const metadata: Metadata = { title: "Service area" };

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
    </div>
  );
}
