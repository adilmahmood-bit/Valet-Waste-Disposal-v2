import { after, NextResponse, type NextRequest } from "next/server";
import { residential } from "@/config/residential";
import { hubspotConfigured, upsertContact, addNote, addTask } from "@/lib/residential/hubspot";
import { sendEmail } from "@/lib/residential/email";
import { isEmail, str } from "@/lib/residential/request";

// Apartment-community quote form on the homepage (components/QuoteForm.tsx). This replaced a
// HubSpot embedded form whose submissions HubSpot's spam filter silently dropped. Here:
// 1. Adil is emailed the lead before we answer the visitor, so nothing is lost if HubSpot fails.
// 2. The contact, a note with their message and a follow-up task are written through the CRM
//    API, which has no spam filter. Every write is logged in res_hubspot_log.
async function handle(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  // Honeypot: a hidden field people never see or fill. Bots that fill it get a fake success.
  if (str(body.website)) return NextResponse.json({ ok: true });

  const firstname = str(body.firstname, 60);
  const lastname = str(body.lastname, 60);
  const email = str(body.email, 200).toLowerCase();
  const phone = str(body.phone, 40);
  const address = str(body.address, 200);
  const message = str(body.message, 2000);
  if (!firstname || !isEmail(email) || !address) {
    return NextResponse.json({ error: "Please enter your first name, a valid email and the property address." }, { status: 400 });
  }

  const name = lastname ? `${firstname} ${lastname}` : firstname;
  const localRef = `quote:${crypto.randomUUID()}`;
  const details = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "-"}`,
    `Property address: ${address}`,
    `Message: ${message || "-"}`,
    `Page: ${str(body.pageUri, 500) || "-"}`,
  ].join("\n");

  await sendEmail(residential.notifyEmail, `Apartment quote request: ${name}`, `${name} requested a quote on the website.\n\n${details}`, email)
    .catch((e) => console.error(`[quote] email ${localRef}:`, e));

  after(async () => {
    if (!hubspotConfigured()) return;
    try {
      const contactId = await upsertContact(
        { email, name, firstname, lastname, mobile: phone, street: address, customerType: "Multifamily" },
        localRef,
      );
      if (message) await addNote(contactId, `Quote request message: ${message}`, localRef);
      await addTask(contactId, `Apartment quote request: follow up with ${name}`, details, localRef);
    } catch (e) {
      console.error(`[hubspot] ${localRef}:`, e);
    }
  });

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  try {
    return await handle(req);
  } catch (e) {
    console.error("[quote]", e);
    return NextResponse.json(
      { error: `Something went wrong on our end. Please call us at ${residential.contact.phone}.` },
      { status: 500 },
    );
  }
}
