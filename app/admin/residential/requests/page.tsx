import { requireAdmin } from "@/lib/residential/admin-auth";
import { decryptGateCode } from "@/lib/residential/crypto";
import { resolvePhotoUrls } from "@/lib/residential/photos";
import { openRequests, REQUEST_LABEL } from "@/lib/residential/portal-requests";
import { addDays, todaySD } from "@/lib/residential/schedule";
import { acceptPortalRequest, declinePortalRequest } from "../actions";
import { Badge, btn, btnGhost, card, field, SetupNotice } from "../ui";

export const dynamic = "force-dynamic";

const when = (iso: string) => new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// What customers asked for in the portal. Accepting applies it; nothing changes before that.
export default async function RequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const q = await searchParams;
  let rows: Awaited<ReturnType<typeof openRequests>>;
  let photos: Map<string, string>;
  try {
    rows = await openRequests();
    photos = await resolvePhotoUrls(rows.map((r) => r.photo_url));
  } catch (e) {
    return <SetupNotice error={e} />;
  }
  const open = rows.filter((r) => r.status === "open");
  const done = rows.filter((r) => r.status !== "open").slice(0, 20);
  const today = todaySD();

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Portal requests</h1>
        <p className="text-sm text-slate-600">Extra pickups, access changes, pauses and new properties customers asked for. Nothing changes until you accept.</p>
      </div>
      {q.msg && <p className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 text-sm" role="status">{q.msg}</p>}
      {q.err && <p className="rounded-xl bg-red-50 border border-red-200 text-red-900 px-4 py-3 text-sm" role="alert">{q.err}</p>}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Waiting on you ({open.length})</h2>
        {open.length === 0 && <p className={`${card} p-4 text-sm text-slate-500`}>Nothing waiting.</p>}
        {open.map((r) => {
          const d = r.details as Record<string, string | number | undefined>;
          const gate = typeof d.gate_code_encrypted === "string" ? decryptGateCode(d.gate_code_encrypted) : null;
          const photo = r.photo_url ? photos.get(r.photo_url) : undefined;
          return (
            <article key={r.id} className={`${card} p-4 space-y-3`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{REQUEST_LABEL[r.kind]} · {r.address ? `${r.address.street}, ${r.address.city}` : String(d.street ?? "")}</p>
                  <p className="text-sm text-slate-600">
                    {r.customer.name} · <a href={`tel:${r.customer.mobile}`} className="underline">{r.customer.mobile}</a> · {when(r.created_at)}
                  </p>
                </div>
                <Badge value="open" />
              </div>
              <dl className="text-sm grid gap-x-4 gap-y-1 sm:grid-cols-2">
                {Object.entries(d)
                  .filter(([k, v]) => k !== "gate_code_encrypted" && v !== "" && v != null)
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt className="inline text-slate-500">{k.replace(/_/g, " ")}: </dt>
                      <dd className="inline">{String(v)}</dd>
                    </div>
                  ))}
                {gate && (
                  <div>
                    <dt className="inline text-slate-500">new gate code: </dt>
                    <dd className="inline font-semibold">{gate}</dd>
                  </div>
                )}
              </dl>
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Photo from the customer" className="max-h-60 rounded-lg" />
              )}
              <div className="flex flex-wrap items-end gap-3">
                <form action={acceptPortalRequest} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  {r.kind === "overflow" && (
                    <>
                      <label className="text-xs font-semibold">
                        Day
                        <input type="date" name="date" min={today} defaultValue={d.when === "24h" ? today : addDays(today, 1)} className={`${field} block`} required />
                      </label>
                      <label className="text-xs font-semibold">
                        From
                        <input type="time" name="start" defaultValue="08:00" className={`${field} block`} required />
                      </label>
                      <label className="text-xs font-semibold">
                        To
                        <input type="time" name="end" defaultValue="18:00" className={`${field} block`} required />
                      </label>
                    </>
                  )}
                  <button className={btn}>{r.kind === "overflow" ? "Accept and add to Routific" : "Accept and apply"}</button>
                </form>
                <form action={declinePortalRequest} className="flex items-end gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <input name="note" placeholder="Reason (customer sees it)" className={field} />
                  <button className={btnGhost}>Decline</button>
                </form>
              </div>
            </article>
          );
        })}
      </section>

      {done.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Recently handled</h2>
          <ul className={`${card} mt-2 divide-y divide-slate-100 text-sm`}>
            {done.map((r) => (
              <li key={r.id} className="p-3 flex flex-wrap justify-between gap-2">
                <span>
                  {REQUEST_LABEL[r.kind]} · {r.address?.street ?? String((r.details as Record<string, unknown>).street ?? "")} · {r.customer.name}
                  {r.admin_note && <span className="block text-slate-500">{r.admin_note}</span>}
                </span>
                <span className="flex items-center gap-2 text-slate-500">
                  <Badge value={r.status} /> {r.decided_at ? when(r.decided_at) : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
