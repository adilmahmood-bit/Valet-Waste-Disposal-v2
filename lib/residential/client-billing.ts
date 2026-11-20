import { db, must, type CustomerRow } from "./db";
import { createClientCheckout, ensureStripeCustomer, type ClientLine } from "./stripe";

// Stripe autopay for agreement clients (custom monthly rates per property, billed on the 1st).
// A property is "billed" once its res_subscriptions row has a stripe_subscription_id.
// A client can split properties into separately billed accounts (res_subscriptions.billing_group);
// each group gets its own checkout link and its own Stripe subscription. Null = main account.

type Row = {
  id: string;
  street: string;
  city: string;
  zip: string;
  trash_day: string;
  status: string;
  sub:
    | {
        id: string;
        price: number;
        plan: string;
        status: string;
        start_date: string | null;
        stripe_subscription_id: string | null;
        billing_group: string | null;
        first_month_charge: number | null;
      }[]
    | null;
};

async function propertiesOf(customerId: string) {
  return must(
    await db()
      .from("res_addresses")
      .select(
        "id, street, city, zip, trash_day, status, sub:res_subscriptions(id, price, plan, status, start_date, stripe_subscription_id, billing_group, first_month_charge)",
      )
      .eq("customer_id", customerId)
      .order("created_at"),
  ) as unknown as Row[];
}

const subOf = (r: Row) => r.sub?.[0] ?? null;
const groupOf = (r: Row) => subOf(r)?.billing_group ?? null;

const lineOf = (r: Row): ClientLine => {
  const s = subOf(r)!;
  return {
    addressId: r.id,
    street: r.street,
    city: r.city,
    zip: r.zip,
    trashDay: r.trash_day,
    monthly: Number(s.price),
    startDate: s.start_date,
    firstMonthCharge: s.first_month_charge == null ? null : Number(s.first_month_charge),
  };
};

// Active properties with a monthly rate that aren't on a Stripe subscription yet. With a group
// (null = main account), only that account's properties.
export async function unbilledLines(customerId: string, group?: string | null): Promise<ClientLine[]> {
  return (await propertiesOf(customerId))
    .filter((r) => r.status === "active" && Number(subOf(r)?.price) > 0 && !subOf(r)?.stripe_subscription_id)
    .filter((r) => group === undefined || groupOf(r) === group)
    .map(lineOf);
}

// The billing lines for specific properties (the ones a client's checkout covered).
export async function linesForAddresses(customerId: string, addressIds: string[]): Promise<ClientLine[]> {
  return (await propertiesOf(customerId)).filter((r) => addressIds.includes(r.id) && Number(subOf(r)?.price) > 0).map(lineOf);
}

// Makes (or reuses) the Stripe customer and returns a Checkout link for one billing account's
// unbilled properties. Without a group: the only account that needs one (an error if several do).
export async function clientCheckoutUrl(customerId: string, returnUrl: string, group?: string | null) {
  const c = must(await db().from("res_customers").select("*").eq("id", customerId).single()) as CustomerRow;
  const lines = await unbilledLines(customerId, group);
  if (group === undefined && new Set((await propertiesOf(customerId)).filter((r) => lines.some((l) => l.addressId === r.id)).map(groupOf)).size > 1) {
    throw new Error("This customer has separately billed accounts; make a link for each one.");
  }
  if (!lines.length) throw new Error("Nothing to set up: every active property is already on autopay, or none is active yet.");
  const props = await propertiesOf(customerId);
  const first = props.find((r) => r.id === lines[0].addressId)!;
  const stripeCustomerId = await ensureStripeCustomer({
    id: c.id,
    name: c.name,
    email: c.email,
    mobile: c.mobile,
    stripeCustomerId: c.stripe_customer_id,
    address: { street: first.street, city: first.city, zip: first.zip },
  });
  if (stripeCustomerId !== c.stripe_customer_id) must(await db().from("res_customers").update({ stripe_customer_id: stripeCustomerId }).eq("id", c.id));
  const session = await createClientCheckout({ customerId: c.id, stripeCustomerId, lines, returnUrl });
  if (!session.url) throw new Error("Stripe didn't return a checkout link.");
  return { url: session.url, lines, expiresAt: session.expires_at };
}

export type BillingAccount = {
  group: string | null;
  rows: { id: string; street: string; city: string; status: string; price: number; plan: string | null; billing: string | null; stripeSub: string | null }[];
  monthly: number;
  unbilled: number;
};

// A customer's properties split into their billing accounts (main account first).
export function accountsOf(props: Row[]): BillingAccount[] {
  const groups = [...new Set(props.map(groupOf))].sort((a, b) => (a === null ? -1 : b === null ? 1 : a.localeCompare(b)));
  return groups.map((group) => {
    const rows = props
      .filter((r) => groupOf(r) === group)
      .map((r) => {
        const s = subOf(r);
        return { id: r.id, street: r.street, city: r.city, status: r.status, price: s ? Number(s.price) : 0, plan: s?.plan ?? null, billing: s?.status ?? null, stripeSub: s?.stripe_subscription_id ?? null };
      });
    const active = rows.filter((r) => r.status === "active");
    return { group, rows, monthly: active.reduce((n, r) => n + r.price, 0), unbilled: active.filter((r) => r.price > 0 && !r.stripeSub).length };
  });
}

export async function billingAccounts(customerId: string) {
  return accountsOf(await propertiesOf(customerId));
}

// For the admin Billing page: every customer with properties, and where their billing stands.
export async function billingOverview() {
  const customers = must(
    await db().from("res_customers").select("id, name, email, stripe_customer_id").order("name"),
  ) as { id: string; name: string; email: string; stripe_customer_id: string | null }[];
  const out = [];
  for (const c of customers) {
    const props = await propertiesOf(c.id);
    if (!props.length) continue;
    const accounts = accountsOf(props);
    out.push({
      ...c,
      accounts,
      monthly: accounts.reduce((n, a) => n + a.monthly, 0),
    });
  }
  return out;
}
