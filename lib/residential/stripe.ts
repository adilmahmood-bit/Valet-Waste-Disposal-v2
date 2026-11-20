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

export type ClientLine = { addressId: string; street: string; city: string; monthly: number };

// Stripe Checkout for an agreement client: one subscription, one line per active property at
// its agreed monthly rate. They add a card or bank account and pay the prorated part of this
// month now; after that Stripe charges automatically on the 1st. The webhook links it back.
export async function createClientCheckout(o: {
  customerId: string;
  stripeCustomerId: string;
  lines: ClientLine[];
  returnUrl: string;
}) {
  if (!o.lines.length) throw new Error("No active properties with a monthly rate to bill.");
  const metadata = { res_kind: "client", res_customer_id: o.customerId, res_address_ids: o.lines.map((l) => l.addressId).join(",") };
  return stripe().checkout.sessions.create({
    mode: "subscription",
    customer: o.stripeCustomerId,
    client_reference_id: o.customerId,
    line_items: o.lines.map((l) => ({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(l.monthly * 100),
        recurring: { interval: "month" as const },
        product_data: { name: `Weekly trash can valet: ${l.street}, ${l.city}` },
      },
    })),
    subscription_data: {
      billing_cycle_anchor: nextFirstOfMonth(),
      proration_behavior: "create_prorations",
      description: `Trash can valet, ${o.lines.length} ${o.lines.length === 1 ? "property" : "properties"}`,
      metadata,
    },
    metadata,
    customer_update: { address: "auto", name: "auto" },
    success_url: `${o.returnUrl}${o.returnUrl.includes("?") ? "&" : "?"}autopay=done`,
    cancel_url: o.returnUrl,
  });
}
