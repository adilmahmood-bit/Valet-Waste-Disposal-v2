import { residential } from "@/config/residential";
import { requireAdmin } from "@/lib/residential/admin-auth";
import { db } from "@/lib/residential/db";
import { routificConfigured } from "@/lib/residential/routific";
import { recentOrders, syncRoutific, type DaySync, type SyncResult } from "@/lib/residential/routific-sync";
import { formatLong } from "@/lib/residential/schedule";
import { runRoutificSync } from "../actions";
import { btn, card, SetupNotice } from "../ui";

export const dynamic = "force-dynamic";

const when = (iso: string) => new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default async function RoutificPage() {
  await requireAdmin();
  let preview: SyncResult, orders: Awaited<ReturnType<typeof recentOrders>>, last: (SyncResult & { by?: string }) | null;
  try {
    [preview, orders, last] = await Promise.all([
      syncRoutific({ dryRun: true }),
      recentOrders(),
      db().from("res_app_state").select("value").eq("key", "routific_last_sync").maybeSingle().then((r) => (r.data?.value ?? null) as (SyncResult & { by?: string }) | null),
    ]);
  } catch (e) {
    return <SetupNotice error={e} />;
  }
  const pending = preview.days.reduce((n, d) => n + d.create.length + d.update.length + d.remove.length, 0);
  const { rollOutWindow } = residential.routific;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Routific</h1>
      {!routificConfigured() && (
        <p className="rounded-xl bg-amber-100 text-amber-950 px-4 py-3 text-sm">ROUTIFIC_API_TOKEN or ROUTIFIC_WORKSPACE_UUID isn&apos;t set, so nothing can be sent.</p>
      )}
      <p className="text-sm text-slate-600">
        One order per property per trash day, for the evening roll-out ({rollOutWindow.start}–{rollOutWindow.end}). Roll-ins aren&apos;t sent. This runs on its own every morning; use the button after changes you want in Routific right away.
      </p>

      <section className={`${card} p-4 space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{pending ? `${pending} changes waiting` : "Routific is up to date"}</h2>
          <form action={runRoutificSync}>
            <button className={btn} disabled={!routificConfigured()}>Send to Routific now</button>
          </form>
        </div>
        {preview.days.map((d) => (
          <DayPlan key={d.rollOutDate} d={d} />
        ))}
      </section>

      {last && (
        <section className={`${card} p-4`}>
          <h2 className="text-lg font-semibold">Last sync: {when(last.ranAt)}{last.by ? ` (${last.by})` : ""}</h2>
          {last.days.map((d) => (
            <p key={d.rollOutDate} className="mt-1 text-sm">
              {formatLong(d.rollOutDate)}: {d.create.length} created, {d.update.length} updated, {d.remove.length} removed, {d.keep.length} unchanged
              {d.errors.map((e) => (
                <span key={e} className="block text-red-700">{e}</span>
              ))}
            </p>
          ))}
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold">Orders in Routific</h2>
        {orders.length === 0 ? (
          <p className={`${card} mt-2 p-4 text-sm text-slate-500`}>None yet.</p>
        ) : (
          <div className={`${card} mt-2 overflow-x-auto`}>
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="p-3">Roll-out</th>
                  <th className="p-3">Address</th>
                  <th className="p-3">Routific #</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className={`border-t border-slate-100 ${o.deleted_at ? "text-slate-400 line-through" : ""}`}>
                    <td className="p-3 whitespace-nowrap">{o.delivery_date}</td>
                    <td className="p-3">{o.address ? `${o.address.street}, ${o.address.zip}` : o.customer_order_number}</td>
                    <td className="p-3 whitespace-nowrap">{o.routific_order_number ?? "—"}</td>
                    <td className="p-3">
                      {o.deleted_at ? "removed" : o.routific_status ?? "not sent"}
                      {o.last_error && <span className="block text-red-700 no-underline">{o.last_error}</span>}
                    </td>
                    <td className="p-3 whitespace-nowrap">{when(o.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function DayPlan({ d }: { d: DaySync }) {
  const groups = [
    { name: "Create", items: d.create, cls: "text-green-800" },
    { name: "Update", items: d.update, cls: "text-sky-800" },
    { name: "Remove", items: d.remove, cls: "text-red-700" },
    { name: "Already in Routific", items: d.keep, cls: "text-slate-500" },
  ].filter((g) => g.items.length);
  return (
    <div className="border-t border-slate-100 pt-3">
      <p className="font-semibold">
        Roll-out {formatLong(d.rollOutDate)} <span className="font-normal text-slate-500">for pickup {formatLong(d.pickupDate)}</span>
      </p>
      {groups.length === 0 && <p className="text-sm text-slate-500">No roll-outs due.</p>}
      {groups.map((g) => (
        <div key={g.name} className="mt-1 text-sm">
          <span className={`font-semibold ${g.cls}`}>{g.name} ({g.items.length}):</span>{" "}
          {g.items.map((i) => `${i.label}${i.detail ? ` [${i.detail}]` : ""}`).join("; ")}
        </div>
      ))}
    </div>
  );
}
