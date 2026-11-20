import Stripe from "stripe";
import { residential, isPromoCode, promoOn, type Plan } from "@/config/residential";

// Server-only Stripe client. Prices are looked up by the lookup keys that
// scripts/stripe-setup.mjs creates (res_<plan id>, res_extra_bin), so the catalog lives in Stripe
// and this file never hardcodes price IDs.
let client: Stripe | null = null;

export function stripe() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set in .env.local");
    client = new Stripe(key);
  }
  return client;
}

const priceCache = new Map<string, string>();

async function priceId(lookupKey: string) {
  const cached = priceCache.get(lookupKey);
  if (cached) return cached;
  const price = (await stripe().prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 })).data[0];
  if (!price) throw new Error(`No active Stripe price with lookup key ${lookupKey}. Run node scripts/stripe-setup.mjs.`);
  priceCache.set(lookupKey, price.id);
  return price.id;
}

async function promotionCodeId() {
  const code = (await stripe().promotionCodes.list({ code: residential.promo.label.toUpperCase(), active: true, limit: 1 })).data[0];
  return code?.id ?? null;
}

// One Stripe customer per local customer, stored on res_customers.stripe_customer_id.
export async function ensureStripeCustomer(c: {
  id: string;
  name: string;
  email: string;
  mobile: string;
  stripeCustomerId: string | null;
  address: { street: string; city: string; zip: string };
}) {
  const fields = {
    name: c.name,
    email: c.email,
    phone: c.mobile,
    address: { line1: c.address.street, city: c.address.city, state: "CA", postal_code: c.address.zip, country: "US" },
    metadata: { res_customer_id: c.id },
  };
  if (c.stripeCustomerId) {
    await stripe().customers.update(c.stripeCustomerId, fields);
    return c.stripeCustomerId;
  }
  const created = await stripe().customers.create(fields, { idempotencyKey: `res-customer-${c.id}` });
  return created.id;
}

const randomLetters = (n: number) =>
  Array.from({ length: n }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");

// Stripe Checkout for a residential sign-up: a subscription for monthly plans, a one-time
// payment for the round trip. The webhook (app/api/stripe/webhook) finishes the sign-up.
export async function createCheckout(o: {
  stripeCustomerId: string;
  plan: Plan;
  bins: number;
  referralCode: string;
  addressId: string;
  subscriptionRowId: string;
  origin: string;
  successQuery: URLSearchParams;
}) {
  const { plan } = o;
  const extraBins = Math.max(0, o.bins - plan.includedBins);
  const lineItems = [{ price: await priceId(`res_${plan.id}`), quantity: 1 }];
  // Must match planPrice() in config/residential.ts, which charges extra cans on every plan.
  if (extraBins > 0) {
    const key = plan.billing === "monthly" ? "res_extra_bin" : "res_extra_bin_once";
    lineItems.push({ price: await priceId(key), quantity: extraBins });
  }

  const promo = promoOn(plan) && isPromoCode(o.referralCode) ? await promotionCodeId() : null;
  const metadata = {
    res_address_id: o.addressId,
    res_subscription_id: o.subscriptionRowId,
    res_plan: plan.id,
    ...(plan.id === "annual" ? { commitment_months: "12" } : {}),
  };
  const success = new URLSearchParams(o.successQuery);
  success.set("paid", "1");
  // Leaving Checkout keeps the saved sign-up (no duplicate on retry); Adil follows up by text.
  const cancel = new URLSearchParams(o.successQuery);
  cancel.set("status", "unpaid");

  return stripe().checkout.sessions.create(
    {
      mode: plan.billing === "monthly" ? "subscription" : "payment",
      customer: o.stripeCustomerId,
      line_items: lineItems,
      ...(promo ? { discounts: [{ promotion_code: promo }] } : {}),
      client_reference_id: o.subscriptionRowId,
      metadata,
      ...(plan.billing === "monthly"
        ? { subscription_data: { metadata, description: `${plan.name}: ${o.bins} cans` } }
        : { payment_intent_data: { metadata, description: `${plan.name}: ${o.bins} cans` }, invoice_creation: { enabled: true } }),
      customer_update: { address: "auto", name: "auto" },
      integration_identifier: `res-signup-${randomLetters(8)}`,
      success_url: `${o.origin}/residential/thanks?${success}`,
      cancel_url: `${o.origin}/residential/thanks?${cancel}`,
    },
    { idempotencyKey: `res-checkout-${o.subscriptionRowId}` },
  );
}

// ---------- agreement clients (property managers, hosts) ----------

// The 1st of next month at midnight, San Diego time, as a Unix timestamp: client invoices
// go out on the 1st, with the first one prorated (per the service agreements).
export function nextFirstOfMonth(now = new Date()) {
  const sd = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const y = sd.getMonth() === 11 ? sd.getFullYear() + 1 : sd.getFullYear();
  const m = (sd.getMonth() + 1) % 12;
  // Midnight Pacific on the 1st: 08:00 UTC in winter, 07:00 UTC in summer.
  for (const h of [8, 7]) {
    const t = new Date(Date.UTC(y, m, 1, h));
    const local = t.toLocaleString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hour12: false });
    if (local === "0" || local === "24") return Math.floor(t.getTime() / 1000);
  }
  return Math.floor(Date.UTC(y, m, 1, 8) / 1000);
}

// The Stripe payment-method settings that offer bank debit (ACH), so client checkouts can
// pay by bank. Stripe keeps several settings groups; the default one may have ACH off.
async function bankDebitConfig() {
  const configs = (await stripe().paymentMethodConfigurations.list({ limit: 20 })).data;
  const ach = (c: (typeof configs)[number]) => c.active && c.us_bank_account?.available;
  return (configs.find((c) => ach(c) && c.is_default) ?? configs.find(ach))?.id ?? null;
}

export type ClientLine = { addressId: string; street: string; city: string; monthly: number; startDate: string | null };

// This month's share for each property, counted from its first service day (or today if it has
// none) to the end of the month. A property starting next month or later owes nothing yet.
export function firstMonthCharges(lines: ClientLine[], now = new Date()) {
  const today = now.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }); // YYYY-MM-DD
  const [y, m] = today.split("-").map(Number);
  const monthStart = `${today.slice(0, 7)}-01`;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const monthName = new Date(Date.UTC(y, m - 1, 15)).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  return lines.flatMap((l) => {
    let from = l.startDate ?? today;
    if (from.slice(0, 7) > today.slice(0, 7)) return [];
    if (from < monthStart) from = monthStart;
    const day = Number(from.slice(8, 10));
    const days = daysInMonth - day + 1;
    const cents = Math.round((l.monthly * 100 * days) / daysInMonth);
    return cents > 0 ? [{ line: l, cents, label: `${monthName} ${day}–${daysInMonth} (${days} days): ${l.street}, ${l.city}` }] : [];
  });
}

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

// Stripe Checkout for an agreement client. The page is a plain payment for this month's share
// (counted from each property's first service day, not from the day they pay) that also saves
// their bank account or card. After they pay, the webhook calls startClientSubscription, which
// charges the full monthly rate on the 1st from then on. (A subscription-mode Checkout would
// show the gap until the 1st as "X days free", which isn't the deal.) If nothing is owed this
// month, the page only saves the payment method.
export async function createClientCheckout(o: {
  customerId: string;
  stripeCustomerId: string;
  lines: ClientLine[];
  returnUrl: string;
}) {
  if (!o.lines.length) throw new Error("No active properties with a monthly rate to bill.");
  const anchor = nextFirstOfMonth();
  const metadata = {
    res_kind: "client",
    res_customer_id: o.customerId,
    res_address_ids: o.lines.map((l) => l.addressId).join(","),
    res_anchor: String(anchor),
  };
  const monthly = o.lines.reduce((n, l) => n + Math.round(l.monthly * 100), 0);
  const first = new Date(anchor * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "America/Los_Angeles" });
  const what = `${o.lines.length} ${o.lines.length === 1 ? "property" : "properties"}`;
  const description = `Trash can valet, ${what}`;
  const charges = firstMonthCharges(o.lines);
  const pmConfig = await bankDebitConfig();
  const common = {
    ...(pmConfig ? { payment_method_configuration: pmConfig } : {}),
    customer: o.stripeCustomerId,
    client_reference_id: o.customerId,
    metadata,
    customer_update: { address: "auto" as const, name: "auto" as const },
    custom_text: {
      submit: { message: `Autopay: ${usd(monthly)} a month for ${what} is charged on the 1st of each month to the bank account or card you use here, starting ${first}.` },
    },
    success_url: `${o.returnUrl}${o.returnUrl.includes("?") ? "&" : "?"}autopay=done`,
    cancel_url: o.returnUrl,
  };
  if (!charges.length) {
    return stripe().checkout.sessions.create({ ...common, mode: "setup", currency: "usd", setup_intent_data: { description, metadata } });
  }
  return stripe().checkout.sessions.create({
    ...common,
    mode: "payment",
    line_items: charges.map((c) => ({
      quantity: 1,
      price_data: { currency: "usd", unit_amount: c.cents, product_data: { name: `Trash can valet, ${c.label}` } },
    })),
    payment_intent_data: { setup_future_usage: "off_session", description, metadata },
    invoice_creation: { enabled: true, invoice_data: { description, metadata } },
  });
}

// After a client's checkout: put the saved bank account or card on a monthly subscription, one
// item per property at its rate, first charged on the 1st (the anchor saved on the checkout).
// Returns null while the payment method isn't usable yet (a bank account still being verified);
// the webhook tries again when the payment clears.
export async function startClientSubscription(session: Stripe.Checkout.Session, lines: ClientLine[]) {
  const customer = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!customer || !lines.length) return null;
  const intentId = (x: string | { id: string } | null) => (typeof x === "string" ? x : x?.id ?? null);
  const setupId = intentId(session.setup_intent);
  const paymentId = intentId(session.payment_intent);
  const intent = setupId ? await stripe().setupIntents.retrieve(setupId) : paymentId ? await stripe().paymentIntents.retrieve(paymentId) : null;
  const pmId = intentId(intent?.payment_method ?? null);
  if (!pmId) return null;
  const pm = await stripe().paymentMethods.retrieve(pmId);
  if (intentId(pm.customer) !== customer) return null;

  await stripe().customers.update(customer, { invoice_settings: { default_payment_method: pmId } });
  const items = [];
  for (const l of lines) {
    const product = await stripe().products.create(
      { name: `Weekly trash can valet: ${l.street}, ${l.city}`, metadata: { res_address_id: l.addressId } },
      { idempotencyKey: `res-product-${session.id}-${l.addressId}` },
    );
    items.push({ quantity: 1, price_data: { currency: "usd", product: product.id, unit_amount: Math.round(l.monthly * 100), recurring: { interval: "month" as const } } });
  }
  // Normally the 1st after the link was made. If that's already passed (paid late), start now
  // and prorate the rest of this month instead.
  const anchor = Number(session.metadata?.res_anchor);
  const onTime = anchor > Math.floor(Date.now() / 1000) + 60;
  return stripe().subscriptions.create(
    {
      customer,
      items,
      default_payment_method: pmId,
      billing_cycle_anchor: onTime ? anchor : nextFirstOfMonth(),
      proration_behavior: onTime ? "none" : "create_prorations",
      description: `Trash can valet, ${lines.length} ${lines.length === 1 ? "property" : "properties"}`,
      metadata: { res_kind: "client", res_customer_id: session.metadata?.res_customer_id ?? "", res_address_ids: lines.map((l) => l.addressId).join(",") },
    },
    { idempotencyKey: `res-clientsub-${session.id}` },
  );
}
