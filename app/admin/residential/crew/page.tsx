import Link from "next/link";
import { accessFlagLabel } from "@/config/residential";
import { requireAdmin } from "@/lib/residential/admin-auth";
import { db, must } from "@/lib/residential/db";
import { resolvePhotoUrls } from "@/lib/residential/photos";
import { buildRoute, mapLink } from "@/lib/residential/routes";
import { addDays, formatLong, todaySD } from "@/lib/residential/schedule";
import { card, SetupNotice } from "../ui";
import RollInForm from "./RollInForm";

export const dynamic = "force-dynamic";

// Roll-ins for one day, on a phone. Roll-outs are driven from the Routific app; roll-ins
// aren't in Routific, so the crew records them here, with a photo.
export default async function CrewPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const q = (await searchParams).date;
  const date = q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : todaySD();

  let stops: Awaited<ReturnType<typeof buildRoute>>["back"];
  let outTimes: Map<string, string>;
  let photos: Map<string, string>;
  try {
    stops = (await buildRoute(date)).back.filter((s) => !s.paused);
    const ids = stops.map((s) => s.address.id);
    const outs = ids.length
      ? (must(await db().from("res_visits").select("address_id, completed_at").eq("type", "out").eq("date", addDays(date, -1)).in("address_id", ids)) as { address_id: string; completed_at: string }[])
      : [];
    outTimes = new Map(outs.map((o) => [o.address_id, o.completed_at]));
    photos = await resolvePhotoUrls(stops.map((s) => s.visit?.photo_url ?? null));
  } catch (e) {
    return <SetupNotice error={e} />;
  }

  // Same order as last night's roll-outs (close to the Routific route); not-yet-out stops last.
  const sorted = [...stops].sort((a, b) => {
    const x = outTimes.get(a.address.id) ?? "~";
    const y = outTimes.get(b.address.id) ?? "~";
    return x.localeCompare(y) || a.address.zip.localeCompare(b.address.zip);
  });
  const left = sorted.filter((s) => !s.visit).length;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold">Roll-ins</h1>
        <div className="text-sm flex gap-3">
          <Link href={`?date=${addDays(date, -1)}`} className="underline">← Prev</Link>
          <Link href={`?date=${addDays(date, 1)}`} className="underline">Next →</Link>
        </div>
      </div>
      <p className="text-slate-600">
        {formatLong(date)} · {sorted.length ? `${left} of ${sorted.length} left` : "No roll-ins today"}
      </p>

      {sorted.map((s, i) => {
        const photo = s.visit?.photo_url ? photos.get(s.visit.photo_url) : undefined;
        return (
          <section key={s.address.id} className={`${card} p-4 ${s.visit ? "opacity-70" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">#{i + 1}</p>
                <a href={mapLink(s.address)} target="_blank" rel="noopener noreferrer" className="font-semibold text-lg underline decoration-slate-300">
                  {s.address.street}
                </a>
                <p className="text-sm text-slate-600">
                  {s.address.city} {s.address.zip} · {s.customer.name} · {s.address.bins} {s.address.bins === 1 ? "can" : "cans"}
                </p>
              </div>
              {s.visit && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.visit.status === "done" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"}`}>
                  {s.visit.status === "done" ? "Back in" : s.visit.status}
                </span>
              )}
            </div>
            {(s.gateCode || s.address.access_flags.length > 0 || s.address.access_notes) && (
              <div className="mt-2 text-sm rounded-lg bg-slate-50 p-2 space-y-0.5">
                {s.gateCode && <p><strong>Gate code:</strong> {s.gateCode}</p>}
                {s.address.access_flags.length > 0 && <p>{s.address.access_flags.map(accessFlagLabel).join(", ")}</p>}
                {s.address.access_notes && <p>{s.address.access_notes}</p>}
              </div>
            )}
            {!outTimes.has(s.address.id) && <p className="mt-2 text-sm text-amber-800">No roll-out recorded last night.</p>}
            {s.visit?.note && <p className="mt-2 text-sm">Note: {s.visit.note}</p>}
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Cans back in" className="mt-2 w-full h-40 object-cover rounded-lg" />
            )}
            {!s.visit && <RollInForm addressId={s.address.id} date={date} />}
          </section>
        );
      })}
    </div>
  );
}
