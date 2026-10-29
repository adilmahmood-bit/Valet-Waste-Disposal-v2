import type { Metadata } from "next";
import { residential } from "@/config/residential";
import { faqs } from "@/components/residential/faq";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Bin Valet FAQ: Curbside Trash Can Service",
  description: "Answers about our bin-to-curb service: gate codes, holiday weeks, rain, pausing for travel, steep driveways and cancelling.",
  alternates: { canonical: "/residential/faq" },
};

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <h1 className="text-4xl font-bold">Questions</h1>
      <dl className="mt-8 divide-y divide-slate-200">
        {faqs.map((f) => (
          <div key={f.q} className="py-5">
            <dt className="font-semibold text-lg">{f.q}</dt>
            <dd className="mt-2 text-slate-700 leading-relaxed">{f.a}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-10 rounded-2xl bg-res-mist p-6 text-lg">
        Something else? Call or text us at{" "}
        <a href={`tel:${residential.contact.phoneHref}`} className="font-semibold text-res-teal-dark whitespace-nowrap">{residential.contact.phone}</a>.
      </p>
    </div>
  );
}
