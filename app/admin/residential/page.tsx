import { requireAdmin } from "@/lib/residential/admin-auth";
import { buildRoute, groupByZip, mapLink, type RouteList, type Stop } from "@/lib/residential/routes";
import { addDays, formatLong, todaySD } from "@/lib/residential/schedule";
import { accessFlagLabel, planById } from "@/config/residential";
import { markVisit } from "./actions";
import { Badge, btn, btnGhost, card, field, SetupNotice } from "./ui";

export default async function RoutesPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requireAdmin();
  const { date: raw } = await searchParams;
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : todaySD();

  let route: RouteList;
  try {
    route = await buildRoute(date);
  } catch (e) {
    return <SetupNotice error={e} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Route list</h1>
          <p className="text-slate-600">{formatLong(date)}</p>
        </div>
        <form className="flex flex-wrap items-center gap-2">
          <a href={`?date=${addDays(date, -1)}`} className={btnGhost}>← Prev</a>
          <input type="date" name="date" defaultValue={date} className={field} aria-label="Route date" />
          <button className={btn}>Show</button>
          <a href={`?date=${addDays(date, 1)}`} className={btnGhost}>Next →</a>
          <a href={`/admin/residential/export?type=routes&date=${date}`} className={btnGhost}>CSV</a>
        </form>
      </div>

      {route.shiftsApplied.length > 0 && (
        <p className="rounded-xl bg-amber-100 text-amber-950 px-4 py-3 text-sm">
          Holiday shift this week:{" "}
          {route.shiftsApplied.map((s) => `${s.date} +${s.shift_days} day${s.shift_days === 1 ? "" : "s"} (${s.zips.length ? s.zips.join(", ") : "all ZIPs"})`).join("; ")}
        </p>
      )}
      {route.notActiveYet > 0 && (
        <p className="text-sm text-slate-600">
          {route.notActiveYet} signed-up {route.notActiveYet === 1 ? "address isn't" : "addresses aren't"} active yet and not on the route.{" "}
          <a href="/admin/residential/customers?status=signed_up" className="font-semibold text-res-teal-dark underline">Review</a>
        </p>
      )}

      <Section title={`Bins out tonight`} subtitle={`For pickup ${formatLong(addDays(date, 1))}`} stops={route.out} />
      <Section title="Bins back today" subtitle={`After pickup ${formatLong(date)}`} stops={route.back} />
    </div>
  );
}

function Section({ title, subtitle, stops }: { title: string; subtitle: string; stops: Stop[] }) {
  const groups = Object.entries(groupByZip(stops));
  return (
    <section>
      <h2 className="text-xl font-bold">
        {title} <span className="text-slate-500 font-medium">({stops.length})</span>
      </h2>
      <p className="text-sm text-slate-600">{subtitle}</p>
      {stops.length === 0 && <p className={`${card} mt-3 p-4 text-slate-500`}>No stops.</p>}
      {groups.map(([zip, list]) => (
        <div key={zip} className="mt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">ZIP {zip} · {list.length}</h3>
          <ul className="mt-2 space-y-2">
            {list.map((s) => (
              <StopRow key={`${s.type}-${s.address.id}`} stop={s} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function StopRow({ stop: s }: { stop: Stop }) {
  const a = s.address;
  return (
    <li className={`${card} p-4 grid gap-3 md:grid-cols-[1fr_auto] ${s.paused ? "opacity-60" : ""}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <a href={mapLink(a)} target="_blank" rel="noreferrer" className="font-semibold underline decoration-res-teal underline-offset-4">
            {a.street}
          </a>
          <span className="text-sm text-slate-600">{a.bins} bins</span>
          <span className="text-sm text-slate-600">{planById(s.sub?.plan ?? "")?.name ?? ""}</span>
          {s.paused && <Badge value="paused" />}
          {s.visit && <Badge value={s.visit.status} />}
        </div>
        <p className="text-sm text-slate-700 mt-0.5">
          {s.customer.name} · <a href={`tel:${s.customer.mobile}`} className="underline">{s.customer.mobile}</a>
        </p>
        {(a.access_flags.length > 0 || a.access_notes || s.gateCode) && (
          <p className="text-sm mt-1">
            {s.gateCode && <span className="mr-3 font-semibold">Gate: {s.gateCode}</span>}
            {a.access_flags.filter((f) => f !== "gate_code").map(accessFlagLabel).join(", ")}
            {a.access_notes && <span className="block text-slate-600">{a.access_notes}</span>}
          </p>
        )}
        {s.visit?.note && <p className="text-sm text-slate-500 mt-1">Note: {s.visit.note}</p>}
      </div>
      <form action={markVisit} className="flex flex-wrap items-center gap-2 print:hidden">
        <input type="hidden" name="address_id" value={a.id} />
        <input type="hidden" name="date" value={s.visitDate} />
        <input type="hidden" name="type" value={s.type} />
        <select name="status" defaultValue={s.visit?.status ?? (s.paused ? "skipped" : "done")} className={field} aria-label="Visit status">
          <option value="done">Done</option>
          <option value="missed">Missed</option>
          <option value="skipped">Skipped (paused)</option>
          <option value="issue">Issue</option>
        </select>
        <input name="note" placeholder="Note" defaultValue={s.visit?.note ?? ""} className={`${field} w-40`} aria-label="Visit note" />
        <button className={btn}>{s.visit ? "Update" : "Save"}</button>
      </form>
    </li>
  );
}
