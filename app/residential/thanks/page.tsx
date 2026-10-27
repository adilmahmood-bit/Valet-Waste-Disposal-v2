import type { Metadata } from "next";
import Link from "next/link";
import { residential } from "@/config/residential";
import { addDays, formatLong } from "@/lib/residential/schedule";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

export default async function ThanksPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { status, start, name } = await searchParams;
  const { contact, payments } = residential;
  const quote = status === "quote_needed";
  const validStart = start && /^\d{4}-\d{2}-\d{2}$/.test(start) ? start : null;

  return (
    <div className="max-w-xl mx-auto px-4 py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold">{name ? `Thank you, ${name}!` : "Thank you!"}</h1>

      {quote ? (
        <div className="mt-6 space-y-4 text-lg text-slate-700">
          <p>We got your request.</p>
          <p>
            We&apos;ll look at your access notes and text you a custom price. Your service starts once you approve it.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-lg text-slate-700">You&apos;re signed up.</p>
          {validStart && (
            <div className="rounded-2xl bg-res-mist p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-res-teal-dark">Your first service</p>
              <p className="mt-2 text-lg">
                Bins out: <strong>evening of {formatLong(addDays(validStart, -1))}</strong>
              </p>
              <p className="text-lg">
                Pickup and bins back: <strong>{formatLong(validStart)}</strong>
              </p>
            </div>
          )}
          {!payments.enabled && (
            <p className="text-slate-700">We&apos;ll text you to set up billing before your first visit.</p>
          )}
          <p className="text-slate-700">A confirmation email is on its way.</p>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-slate-200 p-5">
        <p className="font-semibold">Questions?</p>
        <p className="mt-1 text-slate-700">
          Call or text us at{" "}
          <a href={`tel:${contact.phoneHref}`} className="font-semibold text-res-teal-dark whitespace-nowrap">{contact.phone}</a>.
        </p>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link href="/residential/signup?add=1" className="text-center rounded-full border-2 border-res-navy px-6 py-3 font-semibold hover:bg-res-navy hover:text-white">
          Add another property
        </Link>
        <Link href="/residential" className="text-center rounded-full px-6 py-3 font-semibold text-res-teal-dark">
          Back to home
        </Link>
      </div>
    </div>
  );
}
