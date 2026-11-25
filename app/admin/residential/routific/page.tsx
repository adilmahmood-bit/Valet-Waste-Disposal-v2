import Link from "next/link";
import { residential } from "@/config/residential";
import { requireAdmin } from "@/lib/residential/admin-auth";
import { db, must } from "@/lib/residential/db";
import { collectorFor } from "@/lib/residential/holidays";
import { routificConfigured } from "@/lib/residential/routific";
import { recentOrders, syncRoutific, type SyncResult } from "@/lib/residential/routific-sync";
import { buildRoute, type Stop } from "@/lib/residential/routes";
import { addDays, formatLong, todaySD } from "@/lib/residential/schedule";
import { addOneOffStop, pushSelectedRollouts, removeSelectedOrders, runRoutificSync } from "../actions";
import { btn, btnGhost, card, field, SetupNotice } from "../ui";

export const dynamic = "force-dynamic";

const when = (iso: string) => new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const time = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" });

const KIND: Record<string, string> = { rollout: "Roll-out", rollin: "Roll-in", extra: "Extra pickup" };
const DONE = ["delivered", "missed"];

type Order = Awaited<ReturnType<typeof recentOrders>>[number];
type Property = { id: string; street: string; city: string; zip: string; status: string; customer: { name: string } };

// Dispatch: pick a day, push that evening's roll-outs to Routific (all or some), remove stops,
// and add one-off stops (extra pickups, roll-ins, extra roll-outs). The daily sync keeps
// regular roll-outs in step on its own; this is for doing it by hand or ahead of time.
export default async function RoutificPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const q = await searchParams;
  const today = todaySD();
  const date = q.date && /^\d{4}-\d{2}-\d{2}$/.test(q.date) ? q.date : today;
  const past = date < today;

  let stops: Stop[], orders: Order[], properties: Property[], preview: SyncResult, last: (SyncResult & { by?: string }) | null;
  try {
    [stops, orders, properties, preview, last] = await Promise.all([
      buildRoute(date).then((r) => r.out),
      recentOrders(),
      db()
        .from("res_addresses")
        .select("id, street, city, zip, status, customer:res_customers(name)")
        .in("status", ["active", "signed_up", "paused"])
        .order("street")
        .then(must) as Promise<Property[]>,
      syncRoutific({ dryRun: true }),
      db().from("res_app_state").select("value").eq("key", "routific_last_sync").maybeSingle().then((r) => (r.data?.value ?? null) as (SyncResult & { by?: string }) | null),
    ]);
  } catch (e) {
    return <SetupNotice error={e} />;
  }

  const dayOrders = orders.filter((o) => o.delivery_date === date && !o.deleted_at);
  // Roll-out orders for that evening, by property (the external ID starts with the address id).
  const rolloutByAddress = new Map(
    orders.filter((o) => o.kind === "rollout" && o.delivery_date === date && !o.deleted_at).map((o) => [o.customer_order_number.split(":")[0], o]),
  );
  const pending = preview.days.reduce((n, d) => n + d.create.length + d.update.length + d.remove.length, 0);
  const { rollOutWindow } = residential.routific;
  const ready = routificConfigured() && !past;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Routific dispatch</h1>
          <p className="text-sm text-slate-600">Evening of {formatLong(date)}{past ? " (past, view only)" : ""}</p>
        </div>
        <form className="flex items-center gap-2">
          <Link href={`?date=${addDays(date, -1)}`} className={btnGhost} aria-label="Previous day">←</Link>
          <input type="date" name="date" defaultValue={date} className={field} aria-label="Day" />
          <button className={btnGhost}>Go</button>
          <Link href={`?date=${addDays(date, 1)}`} className={btnGhost} aria-label="Next day">→</Link>
          {date !== today && <Link href="?" className="text-sm underline">Today</Link>}
        </form>
      </div>

      {!routificConfigured() && <p className="rounded-xl bg-amber-100 text-amber-950 px-4 py-3 text-sm">ROUTIFIC_API_TOKEN or ROUTIFIC_WORKSPACE_UUID isn&apos;t set, so nothing can be sent.</p>}
      {q.msg && <p className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 text-sm" role="status">{q.msg}</p>}
      {q.err && <p className="rounded-xl bg-red-50 border border-red-200 text-red-900 px-4 py-3 text-sm" role="alert">{q.err}</p>}

      {/* Roll-outs due that evening */}
      <section className={`${card} p-4`}>
        <h2 className="text-lg font-semibold">Roll-outs due ({stops.length})</h2>
        <p className="text-sm text-slate-600">
          Cans out this evening ({rollOutWindow.start}–{rollOutWindow.end}) for the next morning&apos;s pickup. Holidays and pauses are already applied.
          Roll-ins ({residential.routific.rollInWindow.start}–{residential.routific.rollInWindow.end} on pickup day) are sent by the sync automatically and listed with the day&apos;s other stops below.
        </p>
        {stops.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No roll-outs due this evening.</p>
        ) : (
          <form action={pushSelectedRollouts} className="mt-3">
            <input type="hidden" name="date" value={date} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="p-2 w-8"><span className="sr-only">Send</span></th>
                    <th className="p-2">Property</th>
                    <th className="p-2">Pickup</th>
                    <th className="p-2">Hauler</th>
                    <th className="p-2">In Routific</th>
                  </tr>
                </thead>
                <tbody>
                  {stops.map((s) => {
                    const o = rolloutByAddress.get(s.address.id);
                    const done = o && DONE.includes(o.routific_status ?? "");
                    const hauler = collectorFor(s.address.city);
                    return (
                      <tr key={s.address.id} className={`border-t border-slate-100 ${s.paused ? "text-slate-400" : ""}`}>
                        <td className="p-2">
                          <input
                            type="checkbox"
                            name="address_id"
                            value={s.address.id}
                            defaultChecked={!s.paused && (!o || o.routific_status === "not_scheduled")}
                            disabled={s.paused || !!done || !ready}
                            aria-label={`Send ${s.address.street}`}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="p-2">
                          <span className="font-medium">{s.address.street}</span>, {s.address.city} {s.address.zip}
                          <span className="block text-xs text-slate-500">{s.customer.name} · {s.address.bins} cans{s.paused ? " · paused" : ""}</span>
                        </td>
                        <td className="p-2 whitespace-nowrap">{formatLong(s.pickupDate)}</td>
                        <td className="p-2">
                          {hauler ? (
                            <a href={hauler.lookupUrl} target="_blank" rel="noopener noreferrer" className="underline">{hauler.name}</a>
                          ) : (
                            <span className="text-amber-800">Not in trash day guide</span>
                          )}
                        </td>
                        <td className="p-2">
                          {o ? (
                            <>
                              {o.routific_order_number ?? "sending"} · {o.routific_status?.replace("_", " ") ?? "—"}
                              {o.eta && !done && <span className="block text-xs text-slate-500">ETA {time(o.eta)}</span>}
                              {o.last_error && <span className="block text-xs text-red-700">{o.last_error}</span>}
                            </>
                          ) : (
                            <span className="text-slate-500">Not sent</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button className={btn} disabled={!ready}>Push ticked roll-outs to Routific</button>
              <span className="text-xs text-slate-500">Puts them on that day&apos;s route in Routific and publishes it to the driver. Already-sent ones are updated if their details changed.</span>
            </div>
          </form>
        )}
      </section>

      {/* Everything in Routific for that evening */}
      <section className={`${card} p-4`}>
        <h2 className="text-lg font-semibold">In Routific for {formatLong(date)} ({dayOrders.length})</h2>
        {dayOrders.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nothing sent for this day yet.</p>
        ) : (
          <form action={removeSelectedOrders} className="mt-3">
            <input type="hidden" name="date" value={date} />
            <ul className="divide-y divide-slate-100 text-sm">
              {dayOrders.map((o) => {
                const done = DONE.includes(o.routific_status ?? "");
                return (
                  <li key={o.id} className="py-2 flex items-start gap-3">
                    <input type="checkbox" name="order_id" value={o.id} disabled={done || past} aria-label={`Remove ${o.routific_order_number ?? ""}`} className="h-4 w-4 mt-1" />
                    <div className="min-w-0">
                      <p>
                        <span className="font-semibold">{KIND[o.kind] ?? o.kind}</span> · {o.address ? `${o.address.street}, ${o.address.zip}` : o.customer_order_number} ·{" "}
                        {o.routific_order_number ?? "sending"} · {o.routific_status?.replace("_", " ") ?? "—"}
                        {o.eta && !done && ` · ETA ${time(o.eta)}`}
                      </p>
                      {o.notes && <p className="text-slate-600">{o.notes}</p>}
                      {o.last_error && <p className="text-red-700">{o.last_error}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
            {!past && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button className={btnGhost}>Remove ticked from Routific</button>
                <span className="text-xs text-slate-500">
                  A removed roll-out comes back with the next daily sync unless that day is paused for the property.
                </span>
              </div>
            )}
          </form>
        )}
      </section>

      {/* One-off stops */}
      {!past && (
        <section className={`${card} p-4`}>
          <h2 className="text-lg font-semibold">Add a one-off stop</h2>
          <form action={addOneOffStop} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-semibold sm:col-span-2 lg:col-span-1">
              Property
              <select name="address_id" required className={`${field} mt-1 w-full`} defaultValue="">
                <option value="" disabled>Choose a property</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.street}, {p.city} ({p.customer.name}){p.status !== "active" ? ` [${p.status.replace("_", " ")}]` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Type
              <select name="kind" className={`${field} mt-1 w-full`} defaultValue="extra">
                <option value="extra">Extra trash pickup</option>
                <option value="rollin">Roll-in (cans back in)</option>
                <option value="rollout">Extra roll-out (cans out)</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Day
              <input type="date" name="date" defaultValue={date} min={today} required className={`${field} mt-1 w-full`} />
            </label>
            <label className="text-sm font-semibold">
              From
              <input type="time" name="start" defaultValue="08:00" required className={`${field} mt-1 w-full`} />
            </label>
            <label className="text-sm font-semibold">
              To
              <input type="time" name="end" defaultValue="18:00" required className={`${field} mt-1 w-full`} />
            </label>
            <label className="text-sm font-semibold sm:col-span-2 lg:col-span-3">
              Notes for the driver
              <input name="notes" placeholder="e.g. 12 bags by the garage, guest checkout" className={`${field} mt-1 w-full`} />
            </label>
            <div><button className={btn} disabled={!routificConfigured()}>Add to Routific</button></div>
          </form>
          <p className="mt-2 text-xs text-slate-500">
            Gate code, access and property notes go on the stop automatically. Completed roll-ins and roll-outs show in the client&apos;s portal with the driver&apos;s photo.
          </p>
        </section>
      )}

      {/* Automatic sync */}
      <section className={`${card} p-4 space-y-2`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Automatic sync</h2>
            <p className="text-sm text-slate-600">
              Runs about 7 AM and 2 PM for tonight and tomorrow night. {pending ? `${pending} changes waiting.` : "Up to date."}
            </p>
          </div>
          <form action={runRoutificSync}>
            <button className={btnGhost} disabled={!routificConfigured()}>Run it now</button>
          </form>
        </div>
        {last && (
          <p className="text-sm text-slate-600">
            Last run {when(last.ranAt)}{last.by ? ` (${last.by})` : ""}:{" "}
            {last.days.map((d) => `${formatLong(d.rollOutDate)}: ${d.create.length} created, ${d.update.length} updated, ${d.remove.length} removed`).join(" · ")}
            {last.days.flatMap((d) => d.errors).map((e) => (
              <span key={e} className="block text-red-700">{e}</span>
            ))}
          </p>
        )}
      </section>
    </div>
  );
}
