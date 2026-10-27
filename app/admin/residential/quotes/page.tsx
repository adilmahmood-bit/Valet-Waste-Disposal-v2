import { requireAdmin } from "@/lib/residential/admin-auth";
import { db, must, type AddressRow, type CustomerRow } from "@/lib/residential/db";
import { planById, planPrice, residential } from "@/config/residential";
import { setQuotePrice, acceptQuote, declineQuote } from "../actions";
import { Badge, btn, btnGhost, card, field, SetupNotice } from "../ui";

type QuoteLine = {
  id: string;
  reason: string;
  plan: string | null;
  status: string;
  quoted_price: number | null;
  created_at: string;
  address: AddressRow & { customer: CustomerRow };
};

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  await requireAdmin();
  const { all } = await searchParams;
  let quotes: QuoteLine[];
  try {
    let q = db().from("res_quote_requests").select("*, address:res_addresses(*, customer:res_customers(*))").order("created_at", { ascending: false });
    if (!all) q = q.in("status", ["open", "quoted"]);
    quotes = must(await q) as QuoteLine[];
  } catch (e) {
    return <SetupNotice error={e} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold">Quote requests <span className="text-slate-500 font-medium">({quotes.length})</span></h1>
        <a href={all ? "?" : "?all=1"} className={btnGhost}>{all ? "Open only" : "Show all"}</a>
      </div>
      {quotes.length === 0 && <p className={`${card} p-4 text-slate-500`}>No open quote requests.</p>}
      <ul className="space-y-3">
        {quotes.map((q) => {
          const a = q.address;
          const plan = planById(q.plan ?? "weekly");
          const listPrice = plan ? planPrice(plan, a.bins) : null;
          const sms = q.quoted_price
            ? `Hi ${a.customer.name.split(" ")[0]}, this is Valet Waste Disposal. For ${a.street}, your price is $${q.quoted_price}/month for ${a.bins} bins. Reply YES to start.`
            : "";
          return (
            <li key={q.id} className={`${card} p-4 grid gap-3 lg:grid-cols-[1fr_auto]`}>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{a.street}, {a.zip}</p>
                  <Badge value={q.status} />
                </div>
                <p className="text-sm">{a.customer.name} · <a href={`tel:${a.customer.mobile}`} className="underline">{a.customer.mobile}</a> · {a.customer.email}</p>
                <p className="text-sm mt-1"><span className="font-semibold">Why:</span> {q.reason}</p>
                <p className="text-sm text-slate-600">{a.trash_day} · {a.bins} bins · {plan?.name} (list ${listPrice})</p>
                {a.access_notes && <p className="text-sm text-slate-600">Notes: {a.access_notes}</p>}
                {sms && (
                  <a href={`sms:${a.customer.mobile}?&body=${encodeURIComponent(sms)}`} className="mt-2 inline-block text-sm font-semibold text-res-teal-dark underline">
                    Text the price
                  </a>
                )}
              </div>
              {(q.status === "open" || q.status === "quoted") && (
                <div className="flex flex-col gap-2 items-start">
                  <form action={setQuotePrice} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={q.id} />
                    <span className="text-sm">$</span>
                    <input name="price" type="number" min="1" step="1" required defaultValue={q.quoted_price ?? listPrice ?? ""} className={`${field} w-24`} aria-label="Monthly price" />
                    <button className={btn}>{q.quoted_price ? "Update price" : "Set price"}</button>
                  </form>
                  {q.quoted_price && (
                    <div className="flex gap-2">
                      <form action={acceptQuote}>
                        <input type="hidden" name="id" value={q.id} />
                        <button className={btn}>Customer accepted</button>
                      </form>
                      <form action={declineQuote}>
                        <input type="hidden" name="id" value={q.id} />
                        <button className={btnGhost}>Declined</button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {!residential.payments.enabled && (
        <p className="text-xs text-slate-500">Payments are off, so there is no checkout link yet. Text the price, then mark the answer here.</p>
      )}
    </div>
  );
}
