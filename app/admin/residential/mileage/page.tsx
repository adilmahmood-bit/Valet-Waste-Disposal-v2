import { requireAdmin } from "@/lib/residential/admin-auth";
import { mileageRate, tripMiles, tripsForYear, type MileageTrip } from "@/lib/residential/mileage";
import { todaySD } from "@/lib/residential/schedule";
import { addManualTrip, deleteManualTrip, refreshMileage, saveMileageRate, saveTripActual } from "../actions";
import { btn, btnGhost, card, field, SetupNotice } from "../ui";

export const dynamic = "force-dynamic";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const KIND_LABEL: Record<MileageTrip["kind"], string> = { rollout: "Roll-out route", rollin: "Roll-ins", manual: "Other" };
const mi = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 1 })} mi`;
const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const shortDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

// Business mileage log for tax and accounting: roll-out routes from Routific, roll-in days
// (estimated from the matching roll-out route), and manual trips. Actual miles override.
export default async function MileagePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const q = await searchParams;
  const thisYear = Number(todaySD().slice(0, 4));
  const year = /^\d{4}$/.test(q.year ?? "") ? Number(q.year) : thisYear;

  let trips: MileageTrip[];
  let rate: number | null;
  try {
    [trips, rate] = await Promise.all([tripsForYear(year), mileageRate()]);
  } catch (e) {
    return <SetupNotice error={e} />;
  }

  const total = trips.reduce((n, t) => n + tripMiles(t), 0);
  const byMonth = MONTHS.map((_, i) => trips.filter((t) => Number(t.date.slice(5, 7)) === i + 1).reduce((n, t) => n + tripMiles(t), 0));
  const byKind = (k: MileageTrip["kind"]) => trips.filter((t) => t.kind === k).reduce((n, t) => n + tripMiles(t), 0);
  const needsMiles = trips.filter((t) => t.actual_miles == null && t.planned_miles == null).length;

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mileage</h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Business driving for tax and accounting. Roll-out routes are logged from Routific when the last stop is done (its planned driving distance, start to end).
            Roll-in days are estimated from the roll-out route that served the same properties. Type actual odometer miles on any trip to replace the estimate.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form className="flex items-center gap-2">
            <select name="year" defaultValue={String(year)} className={field} aria-label="Year">
              {[thisYear + 1, thisYear, thisYear - 1, thisYear - 2].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button className={btnGhost}>Show</button>
          </form>
          <a href={`/admin/residential/mileage/export?year=${year}`} className={btn}>Download CSV</a>
        </div>
      </div>

      {q.err && <p className="rounded-xl bg-red-50 border border-red-200 text-red-900 px-4 py-3 text-sm" role="alert">{q.err}</p>}
      {q.msg && <p className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 text-sm" role="status">{q.msg}</p>}

      <div className="grid gap-3 sm:grid-cols-4">
        <div className={`${card} p-4`}>
          <p className="text-xs uppercase tracking-wide text-slate-500">{year} total</p>
          <p className="text-2xl font-bold">{mi(total)}</p>
          <p className="text-xs text-slate-500">{trips.length} trips</p>
        </div>
        <div className={`${card} p-4`}>
          <p className="text-xs uppercase tracking-wide text-slate-500">Roll-out routes</p>
          <p className="text-2xl font-bold">{mi(byKind("rollout"))}</p>
        </div>
        <div className={`${card} p-4`}>
          <p className="text-xs uppercase tracking-wide text-slate-500">Roll-ins</p>
          <p className="text-2xl font-bold">{mi(byKind("rollin"))}</p>
        </div>
        <div className={`${card} p-4`}>
          <p className="text-xs uppercase tracking-wide text-slate-500">Estimated deduction</p>
          <p className="text-2xl font-bold">{rate != null ? usd(total * rate) : "—"}</p>
          <form action={saveMileageRate} className="mt-1 flex items-center gap-1 text-xs">
            <input type="hidden" name="year" value={year} />
            <label htmlFor="rate" className="text-slate-500">$/mile</label>
            <input id="rate" name="rate" defaultValue={rate ?? ""} placeholder="0.70" inputMode="decimal" className="w-16 rounded border border-slate-300 px-1.5 py-0.5" />
            <button className="font-semibold text-res-teal-dark">Save</button>
          </form>
        </div>
      </div>
      <p className="text-xs text-slate-500 -mt-2">Set the per-mile rate your accountant gives you (the IRS standard mileage rate changes each year). The deduction is only an estimate.</p>

      <div className={`${card} p-4 overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>{MONTHS.map((m) => <th key={m} className="px-1 py-1 font-medium text-center">{m}</th>)}</tr>
          </thead>
          <tbody>
            <tr>{byMonth.map((n, i) => <td key={i} className="px-1 py-1 text-center">{n ? Math.round(n) : "—"}</td>)}</tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Trips</h2>
        <form action={refreshMileage}>
          <input type="hidden" name="year" value={year} />
          <button className={btnGhost}>Check for new routes</button>
        </form>
      </div>
      {needsMiles > 0 && (
        <p className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 text-sm">
          {needsMiles} trip{needsMiles === 1 ? " has" : "s have"} no miles yet (no matching roll-out route to estimate from). Type the actual miles below.
        </p>
      )}

      {trips.length === 0 ? (
        <p className={`${card} p-4 text-sm text-slate-600`}>No trips logged for {year} yet.</p>
      ) : (
        <ul className="space-y-2">
          {trips.map((t) => (
            <li key={t.id} className={`${card} p-3`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {shortDate(t.date)} · {KIND_LABEL[t.kind]}
                    <span className="ml-2 font-normal text-slate-500 text-sm">
                      {t.actual_miles != null ? "actual miles" : t.source === "routific" ? "Routific planned distance" : t.source === "estimate" ? "estimate" : ""}
                    </span>
                  </p>
                  <p className="text-sm text-slate-700">{t.purpose}</p>
                  <p className="text-xs text-slate-500">
                    {t.start_address && <>From {t.start_address}{t.end_address && t.end_address !== t.start_address ? ` to ${t.end_address}` : t.end_address ? " and back" : ""} · </>}
                    {t.minutes != null && <>{Math.floor(t.minutes / 60)} h {t.minutes % 60} min · </>}
                    {t.driver && <>Driver: {t.driver} · </>}
                    {t.planned_miles != null && t.actual_miles != null && <>planned {mi(Number(t.planned_miles))}</>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold whitespace-nowrap">{t.actual_miles == null && t.planned_miles == null ? "—" : mi(tripMiles(t))}</p>
                </div>
              </div>
              <form action={saveTripActual} className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="year" value={year} />
                <label htmlFor={`a-${t.id}`} className="text-slate-600">Actual miles</label>
                <input id={`a-${t.id}`} name="actual_miles" defaultValue={t.actual_miles ?? ""} placeholder={t.planned_miles != null ? String(t.planned_miles) : "e.g. 48.5"} inputMode="decimal" className={`${field} w-24`} />
                <input name="note" defaultValue={t.note ?? ""} placeholder="Note (optional)" aria-label="Note" className={`${field} flex-1 min-w-40`} />
                <button className={btnGhost}>Save</button>
              </form>
              {t.kind === "manual" && (
                <form action={deleteManualTrip} className="mt-1 text-right">
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="year" value={year} />
                  <button className="text-xs font-semibold text-red-700">Delete trip</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      <form action={addManualTrip} className={`${card} p-4 space-y-3`}>
        <h2 className="text-lg font-semibold">Add another business trip</h2>
        <p className="text-sm text-slate-600">Supply runs, client meetings, quotes, anything else driven for the business.</p>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="text-sm">Date<input type="date" name="date" required defaultValue={todaySD()} className={`${field} mt-1 w-full`} /></label>
          <label className="text-sm">Miles<input name="miles" required inputMode="decimal" placeholder="12.5" className={`${field} mt-1 w-full`} /></label>
          <label className="text-sm sm:col-span-2">Business purpose<input name="purpose" required placeholder="e.g. Quote visit, 123 Main St" className={`${field} mt-1 w-full`} /></label>
          <label className="text-sm sm:col-span-2">From<input name="start_address" placeholder="Starting address" className={`${field} mt-1 w-full`} /></label>
          <label className="text-sm sm:col-span-2">To<input name="end_address" placeholder="Destination" className={`${field} mt-1 w-full`} /></label>
          <label className="text-sm sm:col-span-4">Note<input name="note" placeholder="Optional" className={`${field} mt-1 w-full`} /></label>
        </div>
        <button className={btn}>Add trip</button>
      </form>
    </div>
  );
}
