import { planById, residential } from "@/config/residential";
import type { PortalCustomer } from "@/lib/residential/portal-auth";
import { PASSWORD_MIN } from "@/lib/residential/portal-auth";
import type { PortalProperty } from "@/lib/residential/portal-data";
import type { PortalRequest, TeamMember } from "@/lib/residential/portal-requests";
import AlertSettings from "../AlertSettings";
import PasswordSettings from "../PasswordSettings";
import { signOutAction, startAutopay } from "../actions";
import { AddPropertyForm, CopyLink, OverflowForm, RemoveTeamButton, TeamForm } from "./forms";
import { Card, P, Pill } from "./Shell";

const money = (n: number) => `$${Number(n).toFixed(2).replace(/\.00$/, "")}`;
const date = (iso: string) => new Date(iso).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric" });

function PreviewNote() {
  return <p className="text-sm rounded-xl border border-dashed px-3 py-2" style={{ borderColor: P.border, color: P.muted }}>Preview: forms are hidden here.</p>;
}

export function OverflowTab({ customer, properties, requests, initial, preview }: { customer: PortalCustomer; properties: PortalProperty[]; requests: PortalRequest[]; initial?: string; preview: boolean }) {
  const firstCan = Number(customer.overflow_first_can);
  const perBag = Number(customer.overflow_per_bag);
  const usable = properties.filter((p) => ["active", "paused"].includes(p.address.status));
  const past = requests.filter((r) => r.kind === "overflow");
  return (
    <>
      <Card>
        <h2 className="font-semibold text-lg">Extra trash pickup</h2>
        <p className="mt-1 text-sm" style={{ color: P.muted }}>
          Guests left more than the cans hold? We&apos;ll haul it away, usually the same day, any day of the week, and send you a photo. {money(firstCan)} for the first full
          95-gallon can (about seven 13-gallon bags), then {money(perBag)} a bag. Pickups at more than one of your properties on the same day count as one visit.
        </p>
        <div className="mt-4">
          {preview ? (
            <PreviewNote />
          ) : usable.length ? (
            <OverflowForm properties={usable.map((p) => ({ id: p.address.id, label: `${p.address.street}, ${p.address.city}` }))} firstCan={firstCan} perBag={perBag} initial={initial} />
          ) : (
            <p className="text-sm">Extra pickups open up once service starts at one of your properties.</p>
          )}
        </div>
      </Card>
      {past.length > 0 && (
        <Card>
          <h2 className="font-semibold">Your extra pickups</h2>
          <ul className="mt-1 text-sm divide-y" style={{ borderColor: P.border }}>
            {past.map((r) => {
              const d = r.details as Record<string, string | number>;
              const where = properties.find((p) => p.address.id === r.address_id)?.address.street ?? "";
              return (
                <li key={r.id} className="py-2 flex flex-wrap justify-between gap-2">
                  <span>{where} · {d.bags} bags · {date(r.created_at)}{r.admin_note && r.status !== "open" ? <span className="block" style={{ color: P.muted }}>{r.admin_note}</span> : null}</span>
                  <Pill
                    label={r.status === "open" ? "Waiting on us" : r.status === "accepted" ? "Scheduled" : "Not done"}
                    color={r.status === "declined" ? "#4b5563" : r.status === "accepted" ? P.green : P.navy}
                    bg={r.status === "declined" ? "#f3f4f6" : r.status === "accepted" ? "#dcfce7" : "#e0eef7"}
                  />
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </>
  );
}

export function AddTab({ preview }: { preview: boolean }) {
  return (
    <Card>
      <h2 className="font-semibold text-lg">Add a property</h2>
      <p className="mt-1 text-sm" style={{ color: P.muted }}>
        Tell us about the address. We&apos;ll check it, confirm the price and your first service day by text, and it shows up here.
      </p>
      <div className="mt-4">{preview ? <PreviewNote /> : <AddPropertyForm />}</div>
    </Card>
  );
}

export function ReferTab({ link, referrals }: { link: string | null; referrals: { name: string; since: string; active: boolean }[] }) {
  return (
    <>
      <Card>
        <h2 className="font-semibold text-lg">Refer a friend</h2>
        <p className="mt-1 text-sm" style={{ color: P.muted }}>
          Know another host, a property owner or a neighbor who&apos;d like their cans handled? Send them your link. When they sign up with it, they show up below so we
          know you sent them.
        </p>
        <div className="mt-4">{link ? <CopyLink url={link} /> : <p className="text-sm">Your link will appear here.</p>}</div>
      </Card>
      <Card>
        <h2 className="font-semibold">People you&apos;ve referred</h2>
        {referrals.length === 0 ? (
          <p className="mt-1 text-sm" style={{ color: P.muted }}>No one yet.</p>
        ) : (
          <ul className="mt-1 text-sm divide-y" style={{ borderColor: P.border }}>
            {referrals.map((r) => (
              <li key={`${r.name}${r.since}`} className="py-2 flex justify-between gap-2">
                <span>{r.name} · signed up {date(r.since)}</span>
                <Pill label={r.active ? "Service started" : "Signed up"} color={r.active ? P.green : P.navy} bg={r.active ? "#dcfce7" : "#e0eef7"} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

const stripeSubOf = (p: PortalProperty) => (p.sub as (PortalProperty["sub"] & { stripe_subscription_id?: string | null }) | null)?.stripe_subscription_id ?? null;

export function BillingTab({ customer, properties, autopay, preview }: { customer: PortalCustomer; properties: PortalProperty[]; autopay?: string; preview: boolean }) {
  const { payments, contact } = residential;
  const billed = properties.filter((p) => p.address.status === "active" && p.sub?.price);
  const total = billed.reduce((n, p) => n + Number(p.sub!.price), 0);
  const unbilled = billed.filter((p) => !stripeSubOf(p));
  const onAutopay = billed.filter((p) => stripeSubOf(p));
  const unbilledTotal = unbilled.reduce((n, p) => n + Number(p.sub!.price), 0);
  return (
    <>
      <Card>
        <h2 className="font-semibold text-lg">Your plan</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left" style={{ color: P.muted }}>
              <tr><th className="py-1 pr-2">Property</th><th className="py-1 pr-2">Plan</th><th className="py-1 text-right">Monthly</th></tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.address.id} className="border-t" style={{ borderColor: P.border }}>
                  <td className="py-2 pr-2">{p.address.street}<span className="block text-xs" style={{ color: P.muted }}>{p.address.status === "active" ? p.address.city : p.address.status.replace("_", " ")}</span></td>
                  <td className="py-2 pr-2">{p.sub ? planById(p.sub.plan)?.name ?? p.sub.plan : "—"}</td>
                  <td className="py-2 text-right">{p.sub?.price ? money(Number(p.sub.price)) : "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-semibold" style={{ borderColor: P.border }}>
                <td className="py-2" colSpan={2}>Monthly total (active properties)</td>
                <td className="py-2 text-right">{money(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
      {autopay === "done" && (
        <p className="rounded-xl bg-green-50 border border-green-200 text-green-900 px-4 py-3 text-sm" role="status">
          Thanks, autopay is set up. Stripe emails your receipt. It can take a minute to show below.
        </p>
      )}
      {autopay === "error" && (
        <p className="rounded-xl bg-red-50 border border-red-200 text-red-900 px-4 py-3 text-sm" role="alert">
          We couldn&apos;t open the payment page. Please try again, or call or text us at {contact.phone}.
        </p>
      )}
      {unbilled.length > 0 && (
        <Card>
          <h2 className="font-semibold">Set up autopay</h2>
          <p className="mt-1 text-sm">
            Add a card or bank account once for {unbilled.length === 1 ? unbilled[0].address.street : `${unbilled.length} properties`} ({money(unbilledTotal)}/month). You&apos;ll pay
            for the rest of this month now, then it&apos;s charged automatically on the 1st of each month. Payments are handled securely by Stripe.
          </p>
          {preview ? (
            <p className="mt-2 text-sm" style={{ color: P.muted }}>Preview: the button is hidden here.</p>
          ) : (
            <form action={startAutopay} className="mt-3">
              <button className="rounded-full text-white font-semibold px-5 py-2.5" style={{ backgroundColor: P.tealDark }}>Set up autopay</button>
            </form>
          )}
        </Card>
      )}
      <Card>
        <h2 className="font-semibold">Payments</h2>
        {onAutopay.length > 0 ? (
          <p className="mt-1 text-sm">
            {onAutopay.length === billed.length ? "Your properties are" : `${onAutopay.length} of your properties are`} on autopay, charged on the 1st of each month. Stripe emails each receipt.
            {payments.portalUrl && customer.stripe_customer_id && (
              <>
                {" "}Update your card or see past invoices in <a href={payments.portalUrl} className="underline font-semibold" style={{ color: P.tealDark }}>billing settings</a> (sign in with this same email).
              </>
            )}
          </p>
        ) : (
          <p className="mt-1 text-sm">For billing questions, call or text us at {contact.phone}.</p>
        )}
      </Card>
    </>
  );
}

export function AlertsTab({ customer, team, preview }: { customer: PortalCustomer; team: TeamMember[]; preview: boolean }) {
  return (
    <>
      {preview ? (
        <Card>
          <p className="text-sm">Email alerts: cans out {customer.alert_out ? "on" : "off"}, cans back in {customer.alert_back ? "on" : "off"}. Password: {customer.password_set_at ? "set" : "not set (signs in with email links)"}.</p>
        </Card>
      ) : (
        <AlertSettings alertOut={customer.alert_out} alertBack={customer.alert_back} live={residential.notifications.visitEmails} />
      )}
      <Card>
        <h2 className="text-lg font-bold">Your team</h2>
        <p className="mt-1 text-sm" style={{ color: P.muted }}>Add cleaners or co-hosts. They get the same visit emails you choose above. They don&apos;t get access to this account.</p>
        <ul className="mt-3 divide-y text-sm" style={{ borderColor: P.border }}>
          {team.length === 0 && <li className="py-2" style={{ color: P.muted }}>No one added yet.</li>}
          {team.map((m) => (
            <li key={m.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
              <span>
                <span className="font-semibold">{m.name}</span>
                <span className="block" style={{ color: P.muted }}>{[m.email, m.phone].filter(Boolean).join(" · ")}</span>
              </span>
              {!preview && <RemoveTeamButton id={m.id} name={m.name} />}
            </li>
          ))}
        </ul>
        {!preview && <div className="mt-3"><TeamForm /></div>}
      </Card>
      {!preview && <PasswordSettings email={customer.email} hasPassword={!!customer.password_set_at} minLength={PASSWORD_MIN} />}
      {!preview && (
        <form action={signOutAction}>
          <button className="text-sm font-semibold underline underline-offset-2" style={{ color: P.tealDark }}>Sign out</button>
        </form>
      )}
    </>
  );
}
