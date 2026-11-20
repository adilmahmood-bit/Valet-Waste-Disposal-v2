import { requireAdmin } from "@/lib/residential/admin-auth";
import { billingOverview } from "@/lib/residential/client-billing";
import { makeClientPaymentLink } from "../actions";
import { Badge, btn, card, SetupNotice } from "../ui";

export const dynamic = "force-dynamic";

const money = (n: number) => `$${n.toFixed(2)}`;
const dash = (path: string) => `https://dashboard.stripe.com/${process.env.STRIPE_SECRET_KEY?.includes("_test_") ? "test/" : ""}${path}`;

// Stripe autopay for customers: who's set up, and a checkout link to send the ones who aren't.
export default async function BillingPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const q = await searchParams;
  let rows: Awaited<ReturnType<typeof billingOverview>>;
  try {
    rows = await billingOverview();
  } catch (e) {
    return <SetupNotice error={e} />;
  }
  const live = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") || process.env.STRIPE_SECRET_KEY?.startsWith("rk_live");

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-sm text-slate-600">
          Each customer pays through Stripe autopay: one subscription with a line per active property at its rate. The first payment covers this month&apos;s pickups from each property&apos;s first service day (e.g. 2 of 5 Mondays), whenever they pay;
          after that Stripe charges on the 1st. Stripe is in <strong>{live ? "live" : "test"}</strong> mode.
        </p>
      </div>
      {q.err && <p className="rounded-xl bg-red-50 border border-red-200 text-red-900 px-4 py-3 text-sm" role="alert">{q.err}</p>}
      {q.link && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 text-sm space-y-2" role="status">
          <p>
            Payment link for <strong>{q.for}</strong>. It works for 24 hours; send it by text or email. Once they pay, their properties show as on autopay here.
          </p>
          <input readOnly value={q.link} className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 font-mono text-xs" aria-label="Payment link" />
        </div>
      )}

      <ul className="space-y-3">
        {rows.map((c) => (
          <li key={c.id} className={`${card} p-4`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-slate-600">
                  {c.email} · {money(c.monthly)}/month for active properties
                  {c.stripe_customer_id && (
                    <>
                      {" "}· <a href={dash(`customers/${c.stripe_customer_id}`)} target="_blank" rel="noopener noreferrer" className="underline">Stripe customer</a>
                    </>
                  )}
                </p>
              </div>
              {c.unbilled > 0 ? (
                <form action={makeClientPaymentLink}>
                  <input type="hidden" name="customer_id" value={c.id} />
                  <button className={btn}>Make autopay link ({c.unbilled})</button>
                </form>
              ) : (
                <span className="text-sm text-slate-500">{c.rows.some((r) => r.stripeSub) ? "All active properties on autopay" : "No active properties to bill"}</span>
              )}
            </div>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {c.rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="py-1.5 pr-2">{r.street}, {r.city}</td>
                    <td className="py-1.5 pr-2"><Badge value={r.status} /></td>
                    <td className="py-1.5 pr-2 text-right">{r.price ? money(r.price) : "—"}</td>
                    <td className="py-1.5 text-right">
                      {r.stripeSub ? (
                        <a href={dash(`subscriptions/${r.stripeSub}`)} target="_blank" rel="noopener noreferrer" className="underline text-emerald-800">Autopay ({r.billing})</a>
                      ) : r.status === "active" ? (
                        <span className="text-amber-800">Not set up</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">
        Adding a property or changing a rate after autopay is set up: change it in Stripe on the customer&apos;s subscription for now.
      </p>
    </div>
  );
}
