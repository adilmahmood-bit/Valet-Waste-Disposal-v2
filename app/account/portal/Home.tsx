import Link from "next/link";
import { IconChevronRight, IconGift, IconTrashX } from "@tabler/icons-react";
import type { PortalProperty } from "@/lib/residential/portal-data";
import { timeSD } from "@/lib/residential/portal-data";
import type { PortalRequest } from "@/lib/residential/portal-requests";
import { REQUEST_LABEL } from "@/lib/residential/portal-requests";
import { Card, P, Pill } from "./Shell";
import { latestPhotoOf, photoTime, STATUS, statusOf, timelineOf } from "./status";

const money = (n: number) => (Number.isInteger(Number(n)) ? `$${Number(n)}` : `$${Number(n).toFixed(2)}`);

export function Home({
  first,
  properties,
  requests,
  overflowRate,
}: {
  first: string;
  properties: PortalProperty[];
  requests: PortalRequest[];
  overflowRate: { firstCan: number; perBag: number } | null;
}) {
  const statuses = properties.map(statusOf);
  const live = statuses.filter((s) => !["cancelled", "quote"].includes(s));
  const count = (k: string) => statuses.filter((s) => s === k).length;
  const chips = [
    `${properties.length} ${properties.length === 1 ? "property" : "properties"}`,
    count("out") ? `${count("out")} out at curb` : null,
    count("in") ? `${count("in")} back in` : null,
    count("scheduled") ? `${count("scheduled")} scheduled` : null,
    count("starting") ? `${count("starting")} starting soon` : null,
    count("paused") ? `${count("paused")} paused` : null,
    count("issue") ? `${count("issue")} need attention` : null,
  ].filter((c): c is string => !!c);
  const pending = requests.filter((r) => r.status === "open");

  return (
    <>
      <div>
        <h1 className="font-bold text-2xl sm:text-3xl" style={{ color: P.navy }}>Hi {first}</h1>
        <p className="mt-1 text-sm sm:text-base">
          {live.length
            ? `${properties.length === 1 ? "Your property is" : live.length === properties.length ? (properties.length === 2 ? "Both properties are" : `All ${properties.length} properties are`) : `${live.length} of ${properties.length} properties are`} on your plan. Your cans are handled.`
            : "Your properties will show here once service starts."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((c) => (
            <span key={c} className="rounded-full bg-white border px-3 py-1 text-xs font-semibold" style={{ borderColor: P.border, color: P.navy }}>
              {c}
            </span>
          ))}
        </div>
      </div>

      {pending.length > 0 && (
        <Card>
          <p className="font-semibold text-sm">Waiting on us ({pending.length})</p>
          <ul className="mt-1 text-sm space-y-0.5" style={{ color: P.muted }}>
            {pending.map((r) => (
              <li key={r.id}>{REQUEST_LABEL[r.kind]} · sent {new Date(r.created_at).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric" })}</li>
            ))}
          </ul>
        </Card>
      )}

      {overflowRate && (
        <Link href="?tab=overflow" className="w-full text-left rounded-2xl p-4 text-white flex items-center gap-3" style={{ background: `linear-gradient(120deg, ${P.teal}, ${P.navy})` }}>
          <IconTrashX size={30} className="shrink-0" />
          <span className="flex-1">
            <span className="block font-semibold">Need extra trash removed?</span>
            <span className="block text-sm opacity-90">
              Big checkout? We&apos;ll haul the extra. {money(overflowRate.firstCan)} for the first 95-gallon can, then {money(overflowRate.perBag)} a bag.
            </span>
          </span>
          <IconChevronRight size={22} />
        </Link>
      )}

      <Link href="?tab=refer" className="rounded-2xl border bg-white px-4 py-3 flex items-center gap-3" style={{ borderColor: P.border }}>
        <IconGift size={24} className="shrink-0" style={{ color: P.accent }} />
        <span className="flex-1 text-sm">
          <span className="font-semibold">Know another host or a neighbor?</span> Share your link and we&apos;ll take good care of them too.
        </span>
        <IconChevronRight size={18} style={{ color: P.muted }} />
      </Link>

      {properties.length === 0 ? (
        <Card>
          <p className="font-semibold">No properties on this account yet.</p>
          <p className="mt-1 text-sm" style={{ color: P.muted }}>
            Add one from the <Link href="?tab=add" className="underline">Add property</Link> tab, or call or text us.
          </p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((p, i) => {
            const st = STATUS[statuses[i]];
            const photo = latestPhotoOf(p);
            const next = p.upcoming.find((u) => !u.paused);
            return (
              <Link
                key={p.address.id}
                href={`?p=${p.address.id}`}
                className="bg-white rounded-2xl border flex flex-col gap-3 hover:shadow-md transition"
                style={{ borderColor: P.border }}
              >
                <div className="px-4 pt-4 flex items-start gap-1">
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold truncate">{p.address.street}</span>
                    <span className="block text-xs" style={{ color: P.muted }}>
                      {p.address.city} · Trash day {p.address.trash_day}
                    </span>
                  </span>
                  <IconChevronRight size={18} style={{ color: P.muted }} />
                </div>
                <div className="px-4 flex flex-wrap gap-1.5">
                  <Pill {...st} />
                  {next?.shifted && <Pill label={`Holiday: ${next.holidayName ?? "moved a day"}`} color={P.accent} bg="#fdf1ea" />}
                  {pending.some((r) => r.address_id === p.address.id) && <Pill label="Request pending" color={P.navy} bg="#eef2f7" />}
                </div>
                <div className="px-4 text-xs">{timelineOf(p)}</div>
                {next?.eta && !next.rolledOut && (
                  <div className="px-4 -mt-1 text-xs font-semibold" style={{ color: P.tealDark }}>
                    Expected out around {timeSD(next.eta)}
                  </div>
                )}
                <div className="px-4 pb-4 mt-auto flex items-center gap-3">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.url} alt={`${photo.label} at ${p.address.street}`} loading="lazy" className="w-28 aspect-[8/5] shrink-0 rounded-lg object-cover border" style={{ borderColor: P.border }} />
                  ) : (
                    <div className="w-28 shrink-0 aspect-[8/5] rounded-lg flex items-center justify-center text-[10px] text-center px-1 bg-gray-100" style={{ color: P.muted }}>
                      First photo after service
                    </div>
                  )}
                  <div className="text-[11px] leading-snug" style={{ color: P.muted }}>
                    {photo ? (
                      <>
                        {photo.label}
                        <br />
                        {photoTime(photo.at)}
                      </>
                    ) : (
                      "Photos appear after each visit."
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
