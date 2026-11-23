import type { Metadata } from "next";
import { residential } from "@/config/residential";
import { faqs } from "@/components/residential/faq";
import JsonLd from "@/components/JsonLd";
import { faqPage, breadcrumbs } from "@/components/residential/schema";

export const metadata: Metadata = {
  title: "Trash Can Valet FAQ",
  description: "Answers about our trash-to-curb service: gate codes, holiday weeks, rain, pausing for travel, steep driveways and cancelling.",
  alternates: { canonical: "/residential/faq" },
};

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [faqPage(faqs), breadcrumbs([{ name: "For Homes", path: "/residential" }, { name: "FAQ", path: "/residential/faq" }])],
        }}
      />
      <h1 className="text-4xl font-bold">Trash-to-curb service: questions and answers</h1>
      <div className="mt-8 divide-y divide-slate-200">
        {faqs.map((f) => (
          <div key={f.q} className="py-5">
            <h2 className="font-semibold text-lg">{f.q}</h2>
            <p className="mt-2 text-slate-700 leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
      <p className="mt-10 rounded-2xl bg-res-mist p-6 text-lg">
        Something else? Call or text us at{" "}
        <a href={`tel:${residential.contact.phoneHref}`} className="font-semibold text-res-teal-dark whitespace-nowrap">{residential.contact.phone}</a>.
      </p>
    </div>
  );
}
