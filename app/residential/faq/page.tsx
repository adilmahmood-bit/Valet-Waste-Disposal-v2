import type { Metadata } from "next";
import { residential } from "@/config/residential";
import { faqs } from "@/components/residential/faq";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
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
