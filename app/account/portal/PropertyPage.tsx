import { accessFlagLabel, planById } from "@/config/residential";
import { collectorFor } from "@/lib/residential/holidays";
import type { PortalProperty, PortalService, PortalVisit } from "@/lib/residential/portal-data";
import { dateSD, shortDate, timeSD } from "@/lib/residential/portal-data";
import type { PortalRequest } from "@/lib/residential/portal-requests";
import { REQUEST_LABEL } from "@/lib/residential/portal-requests";
import { addDays, formatLong, todaySD } from "@/lib/residential/schedule";
import { AccessRequestForm, PauseRequestForm } from "./forms";
import { Card, P, Pill } from "./Shell";
import { STATUS, statusOf } from "./status";

const VISIT: Record<string, { label: string; color: string; bg: string }> = {
  done: { label: "Done", color: P.green, bg: "#dcfce7" },
  missed: { label: "Missed", color: P.red, bg: "#fee2e2" },
  skipped: { label: "Skipped", color: "#4b5563", bg: "#f3f4f6" },
  issue: { label: "Issue", color: P.amber, bg: "#fef3c7" },
};

export function PropertyPage({ p, requests, preview }: { p: PortalProperty; requests: PortalRequest[]; preview: boolean }) {
  const { address, sub } = p;
  const plan = sub ? planById(sub.plan) : undefined;
  const pushOut = sub?.plan === "push_out";
  const next = p.upcoming.find((u) => !u.paused);
  const hauler = collectorFor(address.city);
  const mine = requests.filter((r) => r.address_id === address.id);
  const today = todaySD();

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Pill {...STATUS[statusOf(p)]} />
        {plan && <Pill label={`${plan.name}${sub?.price ? `, $${Number(sub.price).toFixed(2)}/mo` : ""}`} color={P.navy} bg="#eef2f7" />}
      </div>

      {/* Next pickup */}
      {address.status !== "cancelled" && address.status !== "quote_needed" && (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: P.tealDark }}>Next pickup</p>
          {next ? (
            <>
              <p className="mt-1 text-lg">
                Cans out <strong>the evening of {formatLong(addDays(next.pickup, -1))}</strong>
              </p>
              <p className="text-lg">
                Pickup{pushOut ? "" : " and cans back"}: <strong>{formatLong(next.pickup)}</strong>
              </p>
              {next.shifted && <p className="mt-1 text-sm" style={{ color: P.muted }}>Moved one day later this week for {next.holidayName ?? "a holiday"}.</p>}
              {next.rolledOut ? (
                <p className="mt-3"><Pill label="Cans are out at the curb" color={P.green} bg="#dcfce7" /></p>
              ) : (
                (next.eta || next.trackingUrl) && (
                  <div className="mt-3 rounded-xl border p-3 flex flex-wrap items-center justify-between gap-3" style={{ borderColor: P.border }}>
                    {next.eta && (
                      <p>
                        <span className="text-sm block" style={{ color: P.muted }}>Expected roll-out</span>
                        <strong className="text-lg">around {timeSD(next.eta)}</strong>
                      </p>
                    )}
                    {next.trackingUrl && dateSD(new Date().toISOString()) === addDays(next.pickup, -1) && (
                      <a href={next.trackingUrl} target="_blank" rel="noopener noreferrer" className="rounded-full text-white font-semibold px-4 py-2 text-sm" style={{ backgroundColor: P.tealDark }}>
                        Track live
                      </a>
                    )}
                  </div>
                )
              )}
            </>
          ) : (
            <p className="mt-1">No upcoming pickups scheduled.</p>
          )}
          {p.pauses.length > 0 && (
            <p className="mt-2 text-sm">{p.pauses.map((x) => `Paused ${shortDate(x.start_date)} to ${shortDate(x.end_date)}`).join(". ")}.</p>
          )}
          {p.upcoming.length > 1 && (
            <p className="mt-2 text-sm" style={{ color: P.muted }}>
              After that: {p.upcoming.filter((u) => u !== next).map((u) => `${shortDate(u.pickup)}${u.paused ? " (paused)" : ""}`).join(" · ")}
            </p>
          )}
        </Card>
      )}

      {p.thisWeek && (
        <Card>
          <h2 className="font-semibold">This week</h2>
          <ServiceRow s={p.thisWeek} pushOut={pushOut} large />
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Access */}
        <Card>
          <h2 className="font-semibold">Access</h2>
          <dl className="mt-2 text-sm space-y-1">
            <div><dt className="inline" style={{ color: P.muted }}>Cans: </dt><dd className="inline">{address.bins}</dd></div>
            <div>
              <dt className="inline" style={{ color: P.muted }}>Gate code: </dt>
              <dd className="inline">{p.hasGateCode ? "on file" : "none"}</dd>
            </div>
            {address.access_flags.length > 0 && (
              <div><dt className="inline" style={{ color: P.muted }}>Notes: </dt><dd className="inline">{address.access_flags.map(accessFlagLabel).join(", ")}</dd></div>
            )}
            {address.access_notes && (
              <div><dt className="inline" style={{ color: P.muted }}>For the crew: </dt><dd className="inline">{address.access_notes}</dd></div>
            )}
          </dl>
          {!preview && address.status !== "cancelled" && (
            <div className="mt-3 space-y-2">
              <AccessRequestForm addressId={address.id} currentNotes={address.access_notes ?? ""} />
              <PauseRequestForm addressId={address.id} min={today} />
            </div>
          )}
        </Card>

        {/* City rules */}
        <Card>
          <h2 className="font-semibold">{address.city} curb rules</h2>
          {hauler ? (
            <>
              <p className="mt-1 text-xs" style={{ color: P.muted }}>
                Collected by {hauler.name} ·{" "}
                <a href={hauler.lookupUrl} target="_blank" rel="noopener noreferrer" className="underline">{hauler.lookupLabel}</a>
              </p>
              <dl className="mt-2 text-sm space-y-2">
                {hauler.rules.setOut && <Rule label="Out by" text={hauler.rules.setOut} />}
                {hauler.rules.bringIn && <Rule label="Back in" text={hauler.rules.bringIn} />}
                {hauler.rules.placement && <Rule label="Placement" text={hauler.rules.placement} />}
                {hauler.rules.holidays && <Rule label="Holidays" text={hauler.rules.holidays} />}
              </dl>
            </>
          ) : (
            <p className="mt-1 text-sm" style={{ color: P.muted }}>We follow your hauler&apos;s schedule and holidays for this address.</p>
          )}
        </Card>
      </div>

      {mine.length > 0 && (
        <Card>
          <h2 className="font-semibold">Your requests</h2>
          <ul className="mt-1 text-sm divide-y" style={{ borderColor: P.border }}>
            {mine.slice(0, 5).map((r) => (
              <li key={r.id} className="py-2 flex flex-wrap justify-between gap-2">
                <span>
                  {REQUEST_LABEL[r.kind]}
                  {r.status === "declined" && r.admin_note && <span className="block" style={{ color: P.muted }}>{r.admin_note}</span>}
                </span>
                <Pill
                  label={r.status === "open" ? "Waiting on us" : r.status === "accepted" ? "Done" : "Not done"}
                  color={r.status === "accepted" ? P.green : r.status === "open" ? P.navy : "#4b5563"}
                  bg={r.status === "accepted" ? "#dcfce7" : r.status === "open" ? "#e0eef7" : "#f3f4f6"}
                />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {p.history.length > 0 && (
        <Card>
          <h2 className="font-semibold">Past visits</h2>
          <div className="divide-y" style={{ borderColor: P.border }}>
            {p.history.map((s) => (
              <ServiceRow key={s.pickup} s={s} pushOut={pushOut} />
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

function Rule({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide" style={{ color: P.muted }}>{label}</dt>
      <dd>{text}</dd>
    </div>
  );
}

function ServiceRow({ s, pushOut, large }: { s: PortalService; pushOut: boolean; large?: boolean }) {
  return (
    <div className="py-3">
      <p className="text-sm font-semibold" style={{ color: P.muted }}>Trash day {shortDate(s.pickup)}</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <VisitBox label="Cans out" v={s.out} large={large} />
        {!pushOut && <VisitBox label="Cans back in" v={s.back} large={large} />}
      </div>
    </div>
  );
}

function VisitBox({ label, v, large }: { label: string; v: PortalVisit | null; large?: boolean }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: P.border }}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{label}</span>
        {v ? <Pill {...(VISIT[v.status] ?? { label: v.status, color: "#4b5563", bg: "#f3f4f6" })} /> : <span className="text-sm" style={{ color: P.muted }}>Not yet</span>}
      </div>
      {v && <p className="mt-1 text-sm" style={{ color: P.muted }}>{v.status === "done" ? `${shortDate(v.date)} at ${timeSD(v.completedAt)}` : shortDate(v.date)}</p>}
      {v?.note && <p className="mt-1 text-sm">{v.note}</p>}
      {v?.photoUrl && (
        <a href={v.photoUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={v.photoUrl} alt={`${label} photo`} loading="lazy" className={`w-full rounded-lg object-cover ${large ? "h-48" : "h-32"}`} />
        </a>
      )}
    </div>
  );
}
