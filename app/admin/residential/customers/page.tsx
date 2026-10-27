import { after } from "next/server";
import { requireAdmin } from "@/lib/residential/admin-auth";
import { loadCustomers, type CustomerFilters, type CustomerLine } from "@/lib/residential/admin-data";
import { db } from "@/lib/residential/db";
import { hubspotConfigured, hubspotRecordUrl, pullContacts } from "@/lib/residential/hubspot";
import { residential, planById, sourceLabel, propertyTypeLabel, accessFlagLabel } from "@/config/residential";
import { setAddressStatus, addPause, deletePause } from "../actions";
import { Badge, btn, btnGhost, card, field, SetupNotice } from "../ui";

const STATUSES = ["quote_needed", "signed_up", "active", "paused", "cancelled"];
const PULL_EVERY_MS = 15 * 60 * 1000;

// HubSpot is the master for contact details: refresh our copy in the background when stale.
async function pullIfStale() {
  if (!hubspotConfigured()) return;
  const { data } = await db().from("res_app_state").select("value").eq("key", "hubspot_last_pull").maybeSingle();
  const last = data?.value?.at ? Date.parse(data.value.at) : 0;
  if (Date.now() - last > PULL_EVERY_MS) after(() => pullContacts().catch((e) => console.error("[hubspot] pull", e)));
}

export default async function CustomersPage({ searchParams }: { searchParams: Promise<CustomerFilters> }) {
  await requireAdmin();
  const f = await searchParams;
  let rows: CustomerLine[];
  try {
    rows = await loadCustomers(f);
    await pullIfStale();
  } catch (e) {
    return <SetupNotice error={e} />;
  }
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Customers <span className="text-slate-500 font-medium">({rows.length})</span></h1>
        <a href={`/admin/residential/export?type=customers&${qs}`} className={btnGhost}>CSV</a>
      </div>

      <form className={`${card} p-4 flex flex-wrap gap-2 items-end`}>
        <input name="q" defaultValue={f.q} placeholder="Name, email, phone, street" className={`${field} flex-1 min-w-48`} aria-label="Search" />
        <select name="zip" defaultValue={f.zip ?? ""} className={field} aria-label="ZIP">
          <option value="">All ZIPs</option>
          {residential.serviceZips.map((z) => <option key={z}>{z}</option>)}
        </select>
        <select name="status" defaultValue={f.status ?? ""} className={field} aria-label="Status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <select name="source" defaultValue={f.source ?? ""} className={field} aria-label="Source">
          <option value="">All sources</option>
          {residential.sources.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <input name="ref" defaultValue={f.ref} placeholder="Referral code" className={`${field} w-36`} aria-label="Referral code" />
        <button className={btn}>Filter</button>
        <a href="?" className={btnGhost}>Clear</a>
      </form>

      <p className="text-xs text-slate-500">Edit names, phones and emails in HubSpot. They sync back here every 15 minutes, or from the Sync tab.</p>

      <ul className="space-y-3">
        {rows.map((r) => <Row key={r.id} r={r} />)}
        {rows.length === 0 && <li className={`${card} p-4 text-slate-500`}>No customers match.</li>}
      </ul>
    </div>
  );
}

function Row({ r }: { r: CustomerLine }) {
  const c = r.customer;
  return (
    <li className={`${card} p-4`}>
      <div className="grid gap-3 lg:grid-cols-[1.2fr_1.2fr_1fr_auto]">
        <div className="min-w-0">
          <p className="font-semibold">{c.name}</p>
          <p className="text-sm"><a href={`tel:${c.mobile}`} className="underline">{c.mobile}</a></p>
          <p className="text-sm text-slate-600 break-all">{c.email}</p>
          <p className="text-xs text-slate-500 mt-1">{propertyTypeLabel(c.property_type)}</p>
        </div>
        <div className="text-sm">
          <p className="font-medium">{r.street}, {r.zip}</p>
          <p>{r.trash_day} · {r.bins} bins · {planById(r.sub?.plan ?? "")?.name} ${r.sub?.price}</p>
          {r.sub?.start_date && <p className="text-slate-600">Starts {r.sub.start_date}</p>}
          {r.access_flags.length > 0 && <p className="text-slate-600">{r.access_flags.map(accessFlagLabel).join(", ")}</p>}
        </div>
        <div className="text-sm">
          <p>Source: {sourceLabel(c.source) || "-"}</p>
          {c.referral_code && <p>Ref: {c.referral_code}</p>}
          <p className="text-slate-500 text-xs">Since {c.created_at.slice(0, 10)}</p>
          <p className="mt-1 flex gap-3 text-xs">
            {c.hubspot_contact_id ? <a className="underline text-res-teal-dark" target="_blank" rel="noreferrer" href={hubspotRecordUrl("contact", c.hubspot_contact_id)}>HubSpot contact</a> : <span className="text-amber-700">Not in HubSpot yet</span>}
            {r.hubspot_deal_id && <a className="underline text-res-teal-dark" target="_blank" rel="noreferrer" href={hubspotRecordUrl("deal", r.hubspot_deal_id)}>Deal</a>}
          </p>
        </div>
        <form action={setAddressStatus} className="flex items-center gap-2 self-start">
          <Badge value={r.status} />
          <input type="hidden" name="address_id" value={r.id} />
          <select name="status" defaultValue={r.status} className={field} aria-label="Change status">
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          <button className={btnGhost}>Set</button>
        </form>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-slate-600">Pauses ({r.pauses.length}) and notes</summary>
        {r.access_notes && <p className="mt-2 text-slate-700">Notes: {r.access_notes}</p>}
        <ul className="mt-2 space-y-1">
          {r.pauses.map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              {p.start_date} to {p.end_date}
              <form action={deletePause}>
                <input type="hidden" name="id" value={p.id} />
                <button className="text-red-700 underline text-xs">Remove</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addPause} className="mt-2 flex flex-wrap items-center gap-2">
          <input type="hidden" name="address_id" value={r.id} />
          <input type="date" name="start_date" required className={field} aria-label="Pause start" />
          <span>to</span>
          <input type="date" name="end_date" required className={field} aria-label="Pause end" />
          <button className={btnGhost}>Add pause</button>
        </form>
      </details>
    </li>
  );
}
