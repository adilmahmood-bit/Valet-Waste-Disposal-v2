import type { Metadata } from "next";
import { residential } from "@/config/residential";

export const metadata: Metadata = { title: "Residential service terms", robots: { index: false } };

// DRAFT. Needs attorney review before go-live. Bump residential.terms.version in the config
// whenever this text changes; each acceptance is logged against the version shown here.
export default function TermsPage() {
  const { terms, contact, policies } = residential;
  // Undecided policies show a FILL IN marker in demo mode, and a neutral line on the live site.
  const fillIn = (v: string | number | null, what: string) =>
    v != null ? v : residential.showPlaceholderBanner ? <mark className="bg-amber-100 px-1">[FILL IN: {what}]</mark> : `Call or text us at ${contact.phone} for details.`;

  return (
    <article className="max-w-3xl mx-auto px-4 py-12 md:py-16 leading-relaxed">
      {!terms.attorneyReviewed && (
        <p className="mb-6 rounded-xl bg-amber-100 text-amber-950 p-4 text-sm font-semibold">
          Draft. These terms have not been reviewed by an attorney yet.
        </p>
      )}
      <h1 className="text-3xl font-bold">Residential Service Terms</h1>
      <p className="mt-2 text-sm text-slate-600">Version {terms.version}</p>

      <div className="mt-8 space-y-6 text-slate-800 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-res-navy">
        <section>
          <h2>1. The service</h2>
          <p className="mt-2">
            Valet Waste Disposal (&quot;we&quot;) moves your trash, recycling and green waste bins from their usual spot to the curb the
            evening before your scheduled trash pickup and, on round-trip plans, returns them after pickup. We service the bins and
            number of bins listed on your account.
          </p>
        </section>
        <section>
          <h2>2. Schedule and holidays</h2>
          <p className="mt-2">
            Service follows the trash day you give us. When your city or its trash hauler shifts collection for a holiday, we follow the shifted schedule.
            We don&apos;t offer custom service times or days.
          </p>
        </section>
        <section>
          <h2>3. Access</h2>
          <p className="mt-2">
            You agree to give us safe access to your bins, including any gate code. We keep gate codes restricted to our office and the
            person servicing your home. If access is blocked or unsafe, we may skip that visit and let you know. Homes with steep
            driveways, stairs or long walks to the curb may be quoted a different price before service starts.
          </p>
        </section>
        <section>
          <h2>4. Your bins</h2>
          <p className="mt-2">
            Bins must be the ones issued by your trash hauler, closed, and not overloaded. We don&apos;t move loose items, bulky items or anything outside the bins.
            Bin cleaning, bulky pickup and junk removal are not part of this service.
          </p>
        </section>
        <section>
          <h2>5. Billing</h2>
          <p className="mt-2">
            Monthly plans are billed month-to-month and renew automatically each month until cancelled. One-time visits are billed once.
            Prices are as shown at sign-up for your number of bins.
          </p>
        </section>
        <section>
          <h2>6. Pausing and cancelling</h2>
          <p className="mt-2">
            You can pause service for travel by contacting us. You can cancel at any time by call, text or email to Valet Waste Disposal
            at {contact.phone} or {contact.email}. {fillIn(policies.cancellation, "when cancellation takes effect")}
          </p>
        </section>
        <section>
          <h2>7. Missed visits</h2>
          <p className="mt-2">{fillIn(policies.missedVisit, "missed-visit policy")}</p>
        </section>
        <section>
          <h2>8. Changes to these terms</h2>
          <p className="mt-2">
            We may update these terms. We&apos;ll tell you before changes take effect, and the version you accepted is kept on file.
          </p>
        </section>
        <section>
          <h2>9. Contact</h2>
          <p className="mt-2">
            Valet Waste Disposal, {contact.phone}, {contact.email}.
          </p>
        </section>
      </div>
    </article>
  );
}
