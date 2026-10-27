import type { Metadata } from "next";
import Link from "next/link";
import { residential } from "@/config/residential";
import PlanCards from "@/components/residential/PlanCards";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  const { contact } = residential;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
      <h1 className="text-4xl font-bold text-center">Simple pricing</h1>
      <p className="mt-3 text-center text-slate-600 max-w-xl mx-auto">Month-to-month weekly service, or a single visit.</p>

      <div className="mt-12">
        <PlanCards />
      </div>

      <section className="mt-10 max-w-2xl mx-auto rounded-2xl bg-res-mist p-6 text-center">
        <h2 className="text-xl font-bold">Several homes or rentals? Let&apos;s talk.</h2>
        <p className="mt-2 text-slate-700">
          Call or text us at{" "}
          <a href={`tel:${contact.phoneHref}`} className="font-semibold text-res-teal-dark whitespace-nowrap">{contact.phone}</a>, or see{" "}
          <Link href="/residential/hosts" className="font-semibold text-res-teal-dark underline underline-offset-4">Airbnb hosts</Link>.
        </p>
      </section>

      <div className="mt-6 max-w-2xl mx-auto space-y-2 text-center text-sm text-slate-600">
        <p>Steep driveway, stairs, or a long walk to the curb? We&apos;ll text you a custom price before you start.</p>
        <p>Bin cleaning, bulky items and junk removal are not part of this service.</p>
      </div>
    </div>
  );
}
