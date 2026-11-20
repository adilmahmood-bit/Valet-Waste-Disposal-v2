import type Stripe from "stripe";
import { residential, money, planById } from "@/config/residential";
import { db, must } from "@/lib/residential/db";
import { startClientSubscription, stripe } from "@/lib/residential/stripe";
import { linesForAddresses } from "@/lib/residential/client-billing";
import { sendEmail } from "@/lib/residential/email";
import { addNote } from "@/lib/residential/hubspot";
import { addDays, formatLong } from "@/lib/residential/schedule";

// Stripe webhook for residential billing. Point a Stripe webhook endpoint at
// /api/stripe/webhook with the events handled below, and put its signing secret in
// STRIPE_WEBHOOK_SECRET. Locally: stripe listen --forward-to localhost:3000/api/stripe/webhook

type SubRow = { id: string; address_id: string; plan: string; price: number; status: string; start_date: string | null };

const dashboard = (path: string) => `https://dashboard.stripe.com/${process.env.STRIPE_SECRET_KEY?.includes("_test_") ? "test/" : ""}${path}`;

async function subRowFor(by: { rowId?: string | null; stripeSubscriptionId?: string | null }) {
  if (by.rowId) {
    return must(await db().from("res_subscriptions").select("*").eq("id", by.rowId).maybeSingle()) as SubRow | null;
  }
  if (by.stripeSubscriptionId) {
    return must(
      await db().from("res_subscriptions").select("*").eq("stripe_subscription_id", by.stripeSubscriptionId).maybeSingle(),
    ) as SubRow | null;
  }
  return null;
}

async function addressAndCustomer(addressId: string) {
  return must(
    await db().from("res_addresses").select("id, street, city, zip, bins, customer:res_customers(id, name, email, hubspot_contact_id)").eq("id", addressId).single(),
  ) as unknown as {
    id: string;
    street: string;
    city: string;
    zip: string;
    bins: number;
    customer: { id: string; name: string; email: string; hubspot_contact_id: string | null };
  };
}

// Checkout finished and the money is in (cards are paid at once; bank debits arrive later
// through checkout.session.async_payment_succeeded).
async function checkoutPaid(session: Stripe.Checkout.Session) {
  if (session.metadata?.res_kind === "client") return clientCheckoutPaid(session);
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") return;
  const row = await subRowFor({ rowId: session.client_reference_id });
  if (!row || row.status !== "pending_billing") return;

  const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
  const stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const status = session.mode === "subscription" ? "active" : "paid";
  must(
    await db()
      .from("res_subscriptions")
      .update({ status, stripe_subscription_id: stripeSubscriptionId, stripe_customer_id: stripeCustomerId })
      .eq("id", row.id),
  );

  const a = await addressAndCustomer(row.address_id);
  const plan = planById(row.plan);
  const full = `${a.street}, ${a.city} ${a.zip}`;
  const paid = money((session.amount_total ?? 0) / 100);
  const first = a.customer.name.split(" ")[0];
  const when = row.start_date
    ? `First service: cans out the evening of ${formatLong(addDays(row.start_date, -1))}, back after pickup on ${formatLong(row.start_date)}.\n`
    : "";
  const portal = residential.payments.portalUrl
    ? `To update your card or cancel, use ${residential.payments.portalUrl} and sign in with this email address.\n`
    : "";

  await sendEmail(
    a.customer.email,
    "You're signed up - Valet Waste Disposal",
    `Hi ${first},\n\nYou're signed up for ${plan?.name ?? row.plan} at ${full}, and your payment of ${paid} went through. Stripe emails your receipt separately.\n\n${when}Cans: ${a.bins}\n${portal}\nQuestions? Call or text ${residential.contact.phone}.\n\nValet Waste Disposal`,
  );
  await sendEmail(
    residential.notifyEmail,
    `Paid: ${full}`,
    `${a.customer.name} paid ${paid} for ${plan?.name ?? row.plan} (${a.bins} cans).${row.start_date ? ` First service ${row.start_date}.` : ""}\n\nStripe: ${dashboard(stripeSubscriptionId ? `subscriptions/${stripeSubscriptionId}` : `customers/${stripeCustomerId}`)}`,
    a.customer.email,
  );
  if (a.customer.hubspot_contact_id) {
    await addNote(a.customer.hubspot_contact_id, `Paid ${paid} by card for ${plan?.name ?? row.plan} at ${full} (Stripe ${stripeSubscriptionId ?? session.id}).`, `address:${a.id}`).catch(() => {});
  }
}

// An agreement client finished the autopay checkout: start their monthly subscription on the
// bank account or card they just saved, and link it to every property in it. Stripe emails
// them the receipt; we only alert Adil. Runs on checkout completion and again when a bank
// payment clears (in case the bank account wasn't usable yet the first time).
async function clientCheckoutPaid(session: Stripe.Checkout.Session) {
  const customerId = session.metadata?.res_customer_id;
  const addressIds = (session.metadata?.res_address_ids ?? "").split(",").filter(Boolean);
  if (!customerId || !addressIds.length) return;
  let stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
  const stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  if (session.mode === "subscription") {
    // Links made before 2026-11-21 (subscription-mode checkout).
    if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") return;
  } else {
    const billed = must(
      await db().from("res_subscriptions").select("id").in("address_id", addressIds).not("stripe_subscription_id", "is", null),
    ) as { id: string }[];
    if (billed.length) return;
    const sub = await startClientSubscription(session, await linesForAddresses(customerId, addressIds));
    if (!sub) return;
    stripeSubscriptionId = sub.id;
  }
  const clearing = session.mode === "payment" && session.payment_status !== "paid";
  must(await db().from("res_customers").update({ stripe_customer_id: stripeCustomerId }).eq("id", customerId));
  must(
    await db()
      .from("res_subscriptions")
      .update({ status: "active", stripe_subscription_id: stripeSubscriptionId, stripe_customer_id: stripeCustomerId, stripe_checkout_session_id: session.id })
      .in("address_id", addressIds),
  );
  const c = must(await db().from("res_customers").select("name, email").eq("id", customerId).single()) as { name: string; email: string };
  await sendEmail(
    residential.notifyEmail,
    `Autopay set up: ${c.name}`,
    `${c.name} set up autopay for ${addressIds.length} ${addressIds.length === 1 ? "property" : "properties"} and ${clearing ? "made a bank payment of" : "paid"} ${money((session.amount_total ?? 0) / 100)} for this month (from each first service day)${clearing ? ", which clears in a few business days" : ""}. Stripe charges them on the 1st from now on.\n\nStripe: ${dashboard(stripeSubscriptionId ? `subscriptions/${stripeSubscriptionId}` : `customers/${stripeCustomerId}`)}`,
    c.email,
  );
}

// All local rows on one Stripe subscription (a client's subscription covers several properties).
async function subRowsFor(stripeSubscriptionId: string | null) {
  if (!stripeSubscriptionId) return [] as SubRow[];
  return must(await db().from("res_subscriptions").select("*").eq("stripe_subscription_id", stripeSubscriptionId)) as SubRow[];
}

async function subscriptionChanged(sub: Stripe.Subscription) {
  const rows = await subRowsFor(sub.id);
  if (!rows.length) return;
  // Client subscriptions sit in "trialing" until the 1st (this month is paid up front), which is active here.
  const status = sub.status === "trialing" ? "active" : sub.status;
  must(await db().from("res_subscriptions").update({ status }).eq("stripe_subscription_id", sub.id));
  if (sub.status === "canceled" && rows.some((r) => r.status !== "canceled")) {
    must(await db().from("res_addresses").update({ status: "cancelled" }).in("id", rows.map((r) => r.address_id)));
    const a = await addressAndCustomer(rows[0].address_id);
    const where = rows.length === 1 ? `${a.street}, ${a.city} ${a.zip}` : `${rows.length} properties`;
    await sendEmail(
      residential.notifyEmail,
      `Cancelled: ${where} (${a.customer.name})`,
      `${a.customer.name}'s Stripe subscription ended, so ${rows.length === 1 ? "the address is" : "those addresses are"} now cancelled and off the route.\n\n${dashboard(`subscriptions/${sub.id}`)}`,
      a.customer.email,
    );
  }
}

const invoiceSubscriptionId = (inv: Stripe.Invoice) => {
  const s = inv.parent?.subscription_details?.subscription;
  return typeof s === "string" ? s : s?.id ?? null;
};

async function invoicePaymentFailed(inv: Stripe.Invoice) {
  const row = (await subRowsFor(invoiceSubscriptionId(inv)))[0] ?? null;
  const who = inv.customer_name || inv.customer_email || "A customer";
  await sendEmail(
    residential.notifyEmail,
    `Payment failed: ${who}`,
    `A ${money((inv.amount_due ?? 0) / 100)} payment failed. Stripe retries it and emails the customer automatically.${row ? "" : " (No matching sign-up found on the site.)"}\n\n${dashboard(`invoices/${inv.id}`)}`,
  );
}

// Disputes, refunds and fraud warnings only need a person to look, so they become an alert.
async function moneyAlert(subject: string, detail: string, path: string) {
  await sendEmail(residential.notifyEmail, subject, `${detail}\n\n${dashboard(path)}`);
}

async function handle(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return checkoutPaid(event.data.object);
    case "checkout.session.async_payment_failed":
      return event.data.object.metadata?.res_kind === "client"
        ? moneyAlert("Client bank payment failed", "A client's bank payment for this month failed. Their autopay is set up, but this month's charge didn't go through; check the bank account with them.", `checkout/sessions/${event.data.object.id}`)
        : moneyAlert("Sign-up payment failed", "A bank payment from Checkout failed, so the sign-up is still unpaid.", `checkout/sessions/${event.data.object.id}`);
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return subscriptionChanged(event.data.object);
    case "invoice.paid": {
      const rows = await subRowsFor(invoiceSubscriptionId(event.data.object));
      const late = rows.filter((r) => r.status === "past_due").map((r) => r.id);
      if (late.length) must(await db().from("res_subscriptions").update({ status: "active" }).in("id", late));
      return;
    }
    case "invoice.payment_failed":
      return invoicePaymentFailed(event.data.object);
    case "charge.dispute.created":
      return moneyAlert("Dispute opened", `A customer disputed a ${money(event.data.object.amount / 100)} charge. Respond in Stripe before the deadline.`, `disputes/${event.data.object.id}`);
    case "charge.refunded":
      return moneyAlert("Refund issued", `${money(event.data.object.amount_refunded / 100)} was refunded.`, `payments/${event.data.object.payment_intent}`);
    case "radar.early_fraud_warning.created":
      return moneyAlert("Fraud warning", "Stripe flagged a charge as likely fraud. Consider refunding it before it becomes a dispute.", `radar/early_fraud_warnings/${event.data.object.id}`);
  }
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret) return new Response("Webhook not configured: STRIPE_WEBHOOK_SECRET is missing", { status: 500 });
  if (!signature) return new Response("Missing Stripe-Signature header", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(await req.text(), signature, secret);
  } catch (e) {
    return new Response(`Webhook signature check failed: ${(e as Error).message}`, { status: 400 });
  }

  // Skip events already handled (Stripe can deliver the same event more than once).
  const seen = await db().from("res_stripe_events").select("id").eq("id", event.id).maybeSingle();
  if (seen.data) return Response.json({ received: true, duplicate: true });

  try {
    await handle(event);
  } catch (e) {
    console.error("[stripe:webhook]", event.type, event.id, e);
    // A 500 makes Stripe retry later.
    return new Response("Handler failed", { status: 500 });
  }
  await db().from("res_stripe_events").insert({ id: event.id, type: event.type });
  return Response.json({ received: true });
}
