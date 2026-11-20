import Link from "next/link";
import { accessFlagLabel, planById, residential } from "@/config/residential";
import { PASSWORD_MIN, type PortalCustomer } from "@/lib/residential/portal-auth";
import { dateSD, shortDate, timeSD, type PortalProperty, type PortalService, type PortalVisit } from "@/lib/residential/portal-data";
import { addDays, formatLong } from "@/lib/residential/schedule";
import { signOutAction } from "./actions";
import PasswordSettings from "./PasswordSettings";
import AlertSettings from "./AlertSettings";

// The customer account page, shared by /account and the admin "View as customer" preview.

const ADDRESS_STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-green-100 text-green-800" },
  signed_up: { label: "Starting soon", cls: "bg-sky-100 text-sky-800" },
  quote_needed: { label: "Waiting on your price", cls: "bg-amber-100 text-amber-900" },
  paused: { label: "Paused", cls: "bg-slate-200 text-slate-700" },
  cancelled: { label: "Cancelled", cls: "bg-slate-200 text-slate-700" },
};

const VISIT_STATUS: Record<string, { label: string; cls: string }> = {
  done: { label: "Done", cls: "bg-green-100 text-green-800" },
  missed: { label: "Missed", cls: "bg-red-100 text-red-800" },
  skipped: { label: "Skipped", cls: "bg-slate-200 text-slate-700" },
  issue: { label: "Issue", cls: "bg-amber-100 text-amber-900" },
};

const money = (n: number) => (Number.isInteger(Number(n)) ? String(Number(n)) : Number(n).toFixed(2));

function Badge({ meta }: { meta: { label: string; cls: string } }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${meta.cls}`}>{meta.label}</span>;
}

export function AccountView({ customer, properties, preview = false }: { customer: PortalCustomer; properties: PortalProperty[]; preview?: boolean }) {
  const { payments, contact } = residential;
  const first = customer.name.split(" ")[0];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold">Hi {first}</h1>
          <p className="mt-1 text-slate-600 break-all">{customer.email}</p>
        </div>
        {!preview && (
          <form action={signOutAction}>
            <button className="text-sm font-semibold text-res-teal-dark underline underline-offset-2 whitespace-nowrap">Sign out</button>
          </form>
        )}
      </div>

      {properties.length === 0 && (
        <section className="rounded-2xl bg-white border border-slate-200 p-5">
          <p className="font-semibold">No properties on this account yet.</p>
          <p className="mt-1 text-slate-700">
            If you just signed up, it can take a moment to show here. Otherwise, call or text us at {contact.phone}.
          </p>
        </section>
      )}

      {properties.map((p) => (
        <PropertyCard key={p.address.id} p={p} />
      ))}

      {customer.overflow_first_can != null && customer.overflow_per_bag != null && (
        <section className="rounded-2xl bg-white border border-slate-200 p-5">
          <h2 className="text-lg font-bold">Extra trash pickup</h2>
          <p className="mt-2 text-slate-700">
            Guests left more than the cans hold? We&apos;ll haul it away, usually the same day, any day of the week, and send you a photo when it&apos;s done.
          </p>
          <p className="mt-2 font-semibold">
            ${money(customer.overflow_first_can)} for the first full can (about seven 13-gallon bags), then ${money(customer.overflow_per_bag)} per extra bag.
          </p>
          <p className="mt-1 text-sm text-slate-600">Bags must be tied. Pickups at more than one of your properties on the same day count as one visit.</p>
          <a
            href={`sms:${contact.phoneHref}`}
            className="mt-4 inline-block rounded-full bg-res-teal-dark hover:bg-res-teal text-white font-semibold px-5 py-2.5"
          >
            Text us the address and a photo
          </a>
        </section>
      )}

      {preview ? (
        <section className="rounded-2xl bg-white border border-dashed border-slate-300 p-5 text-sm text-slate-600">
          Email alerts: {customer.alert_out ? "cans out on" : "cans out off"}, {customer.alert_back ? "cans back in on" : "cans back in off"}.
          Password: {customer.password_set_at ? "set" : "not set (signs in with email links)"}.
        </section>
      ) : (
        <>
          <AlertSettings alertOut={customer.alert_out} alertBack={customer.alert_back} live={residential.notifications.visitEmails} />
          <PasswordSettings email={customer.email} hasPassword={!!customer.password_set_at} minLength={PASSWORD_MIN} />
        </>
      )}

      <section className="rounded-2xl bg-white border border-slate-200 p-5">
        <h2 className="text-lg font-bold">Billing</h2>
        {payments.enabled && payments.portalUrl ? (
          <p className="mt-2 text-slate-700">
            Update your card, see receipts or cancel in{" "}
            <a href={payments.portalUrl} className="font-semibold text-res-teal-dark underline">billing settings</a>. Sign in there
            with this same email.
          </p>
        ) : (
          <p className="mt-2 text-slate-700">For billing questions, call or text us at {contact.phone}.</p>
        )}
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 p-5">
        <h2 className="text-lg font-bold">Need a change?</h2>
        <p className="mt-2 text-slate-700">
          To pause for a trip, update a gate code or change your cans, call or text us at{" "}
          <a href={`tel:${contact.phoneHref}`} className="font-semibold text-res-teal-dark whitespace-nowrap">{contact.phone}</a>.
        </p>
        <Link
          href="/residential/signup/full?add=1"
          className="mt-4 inline-block rounded-full border-2 border-res-navy px-5 py-2.5 font-semibold hover:bg-res-navy hover:text-white"
        >
          Add another property
        </Link>
      </section>
    </div>
  );
}

function PropertyCard({ p }: { p: PortalProperty }) {
  const { address, sub } = p;
  const plan = sub ? planById(sub.plan) : undefined;
  const pushOut = sub?.plan === "push_out";
  const next = p.upcoming.find((u) => !u.paused);
  const status = ADDRESS_STATUS[address.status] ?? { label: address.status, cls: "bg-slate-200 text-slate-700" };

  return (
    <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold">{address.street}</h2>
            <p className="text-slate-600">
              {address.city} {address.zip}
            </p>
          </div>
          <Badge meta={status} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Fact label="Trash day" value={`${address.trash_day}, cans out the evening before`} />
          <Fact label="Cans" value={String(address.bins)} />
          {plan && <Fact label="Plan" value={sub?.price ? `${plan.name}, $${Number(sub.price).toFixed(2)}` : plan.name} />}
          <Fact
            label="Access"
            value={[...address.access_flags.filter((f) => !(p.hasGateCode && f === "gate_code")).map(accessFlagLabel), p.hasGateCode ? "Gate code on file" : null].filter(Boolean).join(", ") || "None noted"}
          />
          {address.access_notes && <Fact label="Notes for the crew" value={address.access_notes} wide />}
        </dl>
      </div>

      {address.status === "quote_needed" ? (
        <div className="p-5 text-slate-700">We&apos;re looking at your access notes and will text you a custom price. Your service starts once you approve it.</div>
      ) : address.status === "cancelled" ? (
        <div className="p-5 text-slate-700">Service at this address is cancelled.</div>
      ) : (
        <div className="p-5 bg-res-mist/60">
          <p className="text-xs font-semibold uppercase tracking-wide text-res-teal-dark">Next pickup</p>
          {next ? (
            <>
              <p className="mt-1 text-lg">
                Cans out <strong>the evening of {formatLong(addDays(next.pickup, -1))}</strong>
              </p>
              <p className="text-lg">
                Pickup{pushOut ? "" : " and cans back"}: <strong>{formatLong(next.pickup)}</strong>
              </p>
              {next.shifted && <p className="mt-1 text-sm text-slate-600">Moved one day later this week{next.holidayName ? ` for ${next.holidayName}` : " for a holiday"}.</p>}
              {next.rolledOut ? (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-100 text-green-800 px-3 py-1 text-sm font-semibold">Cans are out at the curb</p>
              ) : (
                (next.eta || next.trackingUrl) && (
                  <div className="mt-3 rounded-xl bg-white border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3">
                    {next.eta && (
                      <p>
                        <span className="text-sm text-slate-500 block">Expected roll-out</span>
                        <strong className="text-lg">around {timeSD(next.eta)}</strong>
                        {dateSD(next.eta) !== addDays(next.pickup, -1) && <span className="text-sm text-slate-600"> ({shortDate(dateSD(next.eta))})</span>}
                      </p>
                    )}
                    {next.trackingUrl && dateSD(new Date().toISOString()) === addDays(next.pickup, -1) && (
                      <a
                        href={next.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-res-teal-dark hover:bg-res-teal text-white font-semibold px-4 py-2 text-sm"
                      >
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
            <p className="mt-2 text-sm text-slate-700">
              {p.pauses.map((x) => `Paused ${shortDate(x.start_date)} to ${shortDate(x.end_date)}`).join(". ")}.
            </p>
          )}
          {p.upcoming.length > 1 && (
            <p className="mt-2 text-sm text-slate-600">
              After that:{" "}
              {p.upcoming
                .filter((u) => u !== next)
                .map((u) => `${shortDate(u.pickup)}${u.paused ? " (paused)" : ""}`)
                .join(" · ")}
            </p>
          )}
        </div>
      )}

      {p.thisWeek && (
        <div className="p-5 border-t border-slate-100">
          <h3 className="font-bold">This week</h3>
          <ServiceRow s={p.thisWeek} pushOut={pushOut} large />
        </div>
      )}

      {p.history.length > 0 && (
        <details className="border-t border-slate-100 group">
          <summary className="p-5 cursor-pointer font-bold list-none flex items-center justify-between">
            Past visits
            <span className="text-sm font-semibold text-res-teal-dark group-open:hidden">Show {p.history.length}</span>
            <span className="text-sm font-semibold text-res-teal-dark hidden group-open:inline">Hide</span>
          </summary>
          <div className="px-5 pb-5 divide-y divide-slate-100">
            {p.history.map((s) => (
              <ServiceRow key={s.pickup} s={s} pushOut={pushOut} />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

function Fact({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function ServiceRow({ s, pushOut, large }: { s: PortalService; pushOut: boolean; large?: boolean }) {
  return (
    <div className="py-3">
      <p className="text-sm font-semibold text-slate-600">Trash day {shortDate(s.pickup)}</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <VisitBox label="Cans out" v={s.out} large={large} />
        {!pushOut && <VisitBox label="Cans back in" v={s.back} large={large} />}
      </div>
    </div>
  );
}

function VisitBox({ label, v, large }: { label: string; v: PortalVisit | null; large?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{label}</span>
        {v ? <Badge meta={VISIT_STATUS[v.status] ?? { label: v.status, cls: "bg-slate-200 text-slate-700" }} /> : <span className="text-sm text-slate-500">Not yet</span>}
      </div>
      {v && <p className="mt-1 text-sm text-slate-600">{v.status === "done" ? `${shortDate(v.date)} at ${timeSD(v.completedAt)}` : shortDate(v.date)}</p>}
      {v?.note && <p className="mt-1 text-sm text-slate-700">{v.note}</p>}
      {v?.photoUrl && (
        <a href={v.photoUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={v.photoUrl} alt={`${label} photo`} loading="lazy" className={`w-full rounded-lg object-cover ${large ? "h-48" : "h-32"}`} />
        </a>
      )}
    </div>
  );
}
