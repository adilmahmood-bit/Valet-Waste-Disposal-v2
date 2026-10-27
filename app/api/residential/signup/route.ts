import { after, NextResponse, type NextRequest } from "next/server";
import {
  residential,
  planById,
  planPrice,
  isServiceZip,
  quoteRequiredFlags,
  accessFlagLabel,
  propertyTypeLabel,
  sourceLabel,
} from "@/config/residential";
import { db, must, type CustomerRow } from "@/lib/residential/db";
import { encryptGateCode } from "@/lib/residential/crypto";
import { firstServiceDate, addDays, formatLong, fullDayName } from "@/lib/residential/schedule";
import { syncCustomer, addNote, addTask, submitForm } from "@/lib/residential/hubspot";
import { sendEmail } from "@/lib/residential/email";
import { cleanCode, normalizeSource } from "@/lib/residential/tracking";
import { clientIp, formContext, isEmail, splitName, str } from "@/lib/residential/request";

const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

async function handle(req: NextRequest) {
  const b = await req.json().catch(() => ({}));

  const street = str(b.street);
  const city = str(b.city, 80) || "San Diego";
  const zip = str(b.zip, 10).replace(/\D/g, "").slice(0, 5);
  const trashDay = str(b.trashDay, 3);
  const bins = Number(b.bins);
  const accessFlags: string[] = Array.isArray(b.accessFlags)
    ? b.accessFlags.filter((f: unknown) => residential.accessFlags.some((a) => a.id === f))
    : [];
  const gateCode = str(b.gateCode, 60);
  const accessNotes = str(b.accessNotes, 1000);
  const propertyType = str(b.propertyType, 40);
  const plan = planById(str(b.plan, 20));
  const name = str(b.name, 120);
  const mobile = str(b.mobile, 40);
  const email = str(b.email, 200).toLowerCase();
  const source = normalizeSource(str(b.source, 40));
  const referralCode = cleanCode(str(b.referralCode, 40));

  if (!street || zip.length !== 5) return bad("Please enter your street address and ZIP.");
  if (!isServiceZip(zip)) return bad(`We don't serve ${zip} yet. Please join the waitlist.`);
  if (!(residential.serviceDays as string[]).includes(trashDay)) return bad("Please choose your trash day.");
  if (!Number.isInteger(bins) || bins < residential.bins.min || bins > residential.bins.max) return bad("Please choose your number of bins.");
  if (!residential.propertyTypes.some((p) => p.id === propertyType)) return bad("Please choose a property type.");
  if (!plan || !plan.enabled) return bad("Please choose a plan.");
  if (!name || !mobile || !isEmail(email)) return bad("Please enter your name, mobile number and a valid email.");
  if (b.termsAccepted !== true) return bad("Please accept the Residential Service Terms.");
  if (b.termsVersion !== residential.terms.version) return bad("The terms have changed. Please reload the page and review them again.");

  const needsQuote = quoteRequiredFlags(accessFlags);
  const status = needsQuote.length ? "quote_needed" : "signed_up";
  const price = planPrice(plan, bins);
  const startDate = status === "signed_up" ? firstServiceDate(trashDay, residential.startLeadDays) : null;

  // One customer per email; a host adding a second property reuses it. First-touch source wins.
  const existing = must(await db().from("res_customers").select("*").eq("email", email).maybeSingle()) as CustomerRow | null;
  let customerId: string;
  if (existing) {
    customerId = existing.id;
    must(
      await db()
        .from("res_customers")
        .update({ name, mobile, property_type: propertyType, source: existing.source ?? (source || null), referral_code: existing.referral_code ?? (referralCode || null) })
        .eq("id", customerId),
    );
  } else {
    const row = must(
      await db()
        .from("res_customers")
        .insert({ name, mobile, email, property_type: propertyType, source: source || null, referral_code: referralCode || null })
        .select("id")
        .single(),
    ) as { id: string };
    customerId = row.id;
  }

  const address = must(
    await db()
      .from("res_addresses")
      .insert({
        customer_id: customerId,
        street,
        city,
        zip,
        trash_day: trashDay,
        bins,
        access_flags: accessFlags,
        access_notes: accessNotes || null,
        gate_code_encrypted: gateCode ? encryptGateCode(gateCode) : null,
        status,
      })
      .select("id")
      .single(),
  ) as { id: string };

  must(await db().from("res_subscriptions").insert({ address_id: address.id, plan: plan.id, price, start_date: startDate }));

  const reason = needsQuote.map((f) => f.label).join(", ");
  if (needsQuote.length) {
    must(await db().from("res_quote_requests").insert({ address_id: address.id, reason, plan: plan.id }));
  }

  // The e-sign record.
  const acceptance = must(
    await db()
      .from("res_terms_acceptances")
      .insert({
        customer_id: customerId,
        address_id: address.id,
        terms_version: residential.terms.version,
        ip: clientIp(req),
        user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
      })
      .select("accepted_at")
      .single(),
  ) as { accepted_at: string };

  const ip = clientIp(req);
  const ctx = formContext(req, b.pageUri, needsQuote.length ? "Residential quote request" : "Residential sign-up");
  const full = `${street}, ${city} ${zip}`;
  const priceText = `$${price}${plan.billing === "monthly" ? "/month" : " one time"}`;
  const summary = [
    `Name: ${name}`,
    `Mobile: ${mobile}`,
    `Email: ${email}`,
    `Address: ${full}`,
    `Trash day: ${fullDayName(trashDay)}`,
    `Bins: ${bins}`,
    `Plan: ${plan.name} (${priceText})`,
    `Property type: ${propertyTypeLabel(propertyType)}`,
    `Access: ${accessFlags.map(accessFlagLabel).join(", ") || "none"}`,
    `Notes: ${accessNotes || "-"}`,
    `Source: ${sourceLabel(source) || "-"}${referralCode ? `, referral code ${referralCode}` : ""}`,
  ].join("\n");

  after(async () => {
    const contactId = await syncCustomer(customerId);
    if (contactId) {
      await addNote(
        contactId,
        `Accepted Residential Service Terms ${residential.terms.version} at ${acceptance.accepted_at} for ${full}. IP ${ip ?? "unknown"}.`,
        `address:${address.id}`,
      ).catch(() => {});
      if (needsQuote.length) {
        await addTask(contactId, `Residential quote: ${full}`, `Text a custom price. Reason: ${reason}.\n\n${summary}`, `address:${address.id}`).catch(() => {});
      }
    }
    await submitForm(
      needsQuote.length ? "quote" : "signup",
      { email, ...splitName(name), mobilephone: mobile, zip },
      ctx,
      `address:${address.id}`,
    );

    const first = name.split(" ")[0];
    await sendEmail(
      email,
      needsQuote.length ? "We got your request - Valet Waste Disposal" : "You're signed up - Valet Waste Disposal",
      needsQuote.length
        ? `Hi ${first},\n\nThanks for your request for ${full}. We'll look at your access notes and text you a custom price. Your service starts once you approve it.\n\nQuestions? Call or text ${residential.contact.phone}.\n\nValet Waste Disposal`
        : `Hi ${first},\n\nYou're signed up for ${plan.name} at ${full}.\n\nFirst service: bins out the evening of ${formatLong(addDays(startDate!, -1))}, back after pickup on ${formatLong(startDate!)}.\nPrice: ${priceText} for ${bins} bins.\n${residential.payments.enabled ? "" : `We'll text you to set up billing before your first visit.\n`}\nQuestions? Call or text ${residential.contact.phone}.\n\nValet Waste Disposal`,
    );
    await sendEmail(
      residential.notifyEmail,
      `${needsQuote.length ? "Quote needed" : "New residential sign-up"}: ${full}`,
      `${needsQuote.length ? `Quote needed (${reason}).` : `First service ${startDate}.`}\n\n${summary}`,
      email,
    );
  });

  return NextResponse.json({ ok: true, status, startDate });
}

export async function POST(req: NextRequest) {
  try {
    return await handle(req);
  } catch (e) {
    console.error("[residential:signup]", e);
    return NextResponse.json(
      { error: `Something went wrong on our end. Please call or text ${residential.contact.phone}.` },
      { status: 500 },
    );
  }
}
