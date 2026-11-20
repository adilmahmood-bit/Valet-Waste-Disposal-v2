// Stripe setup for the residential service, safe to re-run. Finds things by lookup key
// or metadata, creates what's missing, and never edits a price (Stripe prices can't change).
// To change a price, change config/residential.ts and re-run: it makes a new price and
// moves the lookup key over to it, so new sign-ups use the new price.
//   - one product per plan, each with one price (lookup key res_<plan id>)
//   - an "Extra can" product, charged per can above the plan's included cans
//   - the launch promo: a coupon and the customer-facing promotion code
//   - a customer portal with a login page, so customers can update their card or cancel
// Usage: node scripts/stripe-setup.mjs   (reads STRIPE_SECRET_KEY from .env.local)
// The plan numbers below must match config/residential.ts.

import { readFileSync } from "node:fs";
import Stripe from "stripe";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is missing from .env.local");
  process.exit(1);
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdoorstepdisposal.com";

// Mirrors config/residential.ts. Amounts in dollars.
const PLANS = [
  { id: "weekly", name: "Month-to-Month Term", amount: 59.99, recurring: true, desc: "Weekly trash can valet: cans to the curb and back. Month-to-month." },
  { id: "annual", name: "Annual Agreement", amount: 54.99, recurring: true, desc: "Weekly trash can valet: cans to the curb and back. 12-month agreement, billed monthly." },
  { id: "push_out", name: "Push-Out Only", amount: 35, recurring: true, desc: "Weekly: cans to the curb the evening before pickup." },
  { id: "one_time", name: "One-Time Round Trip", amount: 25, recurring: false, desc: "One visit: cans to the curb and back." },
];
const EXTRA_BIN = { id: "extra_bin", name: "Extra can", amount: 5, recurring: true, desc: "Each can above the plan's included cans, per month." };
// The one-time visit charges extra cans once, so it needs its own one-time price.
const EXTRA_BIN_ONCE = { id: "extra_bin_once", name: "Extra can (one visit)", amount: 5, recurring: false, desc: "Each can above the visit's included cans." };
const PROMO = { code: "FIRST50", amountOff: 10, maxRedemptions: 50, plans: ["weekly", "annual", "push_out"] };

const lookupKey = (id) => `res_${id}`;

async function product(p) {
  const found = await stripe.products.search({ query: `metadata['res_id']:'${p.id}'` });
  if (found.data[0]) return found.data[0];
  console.log(`+ product ${p.name}`);
  return stripe.products.create({ name: p.name, description: p.desc, metadata: { res_id: p.id } });
}

async function price(prod, p) {
  const key = lookupKey(p.id);
  const cents = Math.round(p.amount * 100);
  const existing = (await stripe.prices.list({ lookup_keys: [key], limit: 1 })).data[0];
  if (existing && existing.unit_amount === cents && existing.product === prod.id) return existing;
  console.log(`+ price ${key} $${p.amount}${p.recurring ? "/month" : ""}${existing ? " (replaces the old one)" : ""}`);
  const created = await stripe.prices.create({
    product: prod.id,
    currency: "usd",
    unit_amount: cents,
    lookup_key: key,
    transfer_lookup_key: true,
    ...(p.recurring ? { recurring: { interval: "month" } } : {}),
  });
  if (existing) await stripe.prices.update(existing.id, { active: false });
  return created;
}

const products = {};
for (const p of [...PLANS, EXTRA_BIN, EXTRA_BIN_ONCE]) {
  const prod = await product(p);
  products[p.id] = prod;
  await price(prod, p);
}

// Launch promo. The coupon only discounts the monthly plans, not extra cans or one-time visits.
let promo = (await stripe.promotionCodes.list({ code: PROMO.code, limit: 1 })).data[0];
if (!promo) {
  console.log(`+ coupon and promotion code ${PROMO.code}`);
  const coupon = await stripe.coupons.create({
    name: `${PROMO.code}: $${PROMO.amountOff} off per month`,
    amount_off: PROMO.amountOff * 100,
    currency: "usd",
    duration: "forever",
    applies_to: { products: PROMO.plans.map((id) => products[id].id) },
    metadata: { res_id: "launch_promo" },
  });
  promo = await stripe.promotionCodes.create({
    promotion: { type: "coupon", coupon: coupon.id },
    code: PROMO.code,
    max_redemptions: PROMO.maxRedemptions,
  });
}

// Customer portal with Stripe's login page (customers sign in with a code sent to their email).
const portals = await stripe.billingPortal.configurations.list({ limit: 100 });
let portal = portals.data.find((c) => c.metadata?.res_id === "residential" && c.active);
if (!portal) {
  console.log("+ customer portal");
  portal = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: "Valet Waste Disposal: manage your trash can valet billing",
      privacy_policy_url: `${SITE}/privacy`,
      terms_of_service_url: `${SITE}/residential/terms`,
    },
    features: {
      customer_update: { enabled: true, allowed_updates: ["email", "phone", "address"] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end", cancellation_reason: { enabled: true, options: ["too_expensive", "unused", "switched_service", "other"] } },
    },
    login_page: { enabled: true },
    metadata: { res_id: "residential" },
  });
}

console.log("\nDone.");
console.log(`Promotion code ${promo.code}: ${promo.times_redeemed}/${promo.max_redemptions ?? "∞"} used`);
console.log(`Customer portal login: ${portal.login_page.url}`);
console.log("Put that portal link in .env.local as NEXT_PUBLIC_STRIPE_PORTAL_URL.");
