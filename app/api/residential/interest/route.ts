import { after, NextResponse, type NextRequest } from "next/server";
import { residential } from "@/config/residential";
import { hubspotConfigured, upsertContact, addNote, addTask, submitForm } from "@/lib/residential/hubspot";
import { sendEmail } from "@/lib/residential/email";
import { SOURCE_COOKIE, REFERRAL_COOKIE, cleanCode, normalizeSource } from "@/lib/residential/tracking";
import { formContext, isEmail, str } from "@/lib/residential/request";

// "I'm interested" form (components/residential/InterestForm.tsx). Goes to HubSpot only: a
// contact, a note with where the cans are kept, and a follow-up task. Adil also gets an email
// with everything, so a lead isn't lost if a HubSpot write fails.
async function handle(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const firstname = str(body.firstname, 60);
  const lastname = str(body.lastname, 60);
  const email = str(body.email, 200).toLowerCase();
  const city = str(body.city, 80);
  const state = str(body.state, 40);
  const phone = str(body.phone, 40);
  const canLocation = str(body.canLocation, 300);
  const zip = str(body.zip, 10).replace(/\D/g, "").slice(0, 5);
  if (!firstname || !lastname || !isEmail(email) || !city || !state) {
    return NextResponse.json({ error: "Please enter your first and last name, a valid email, your city and state." }, { status: 400 });
  }

  // Optional: what they picked or typed, else what the flyer or referral link they came from set.
  const source = normalizeSource(str(body.source, 60) || req.cookies.get(SOURCE_COOKIE)?.value);
  const referralCode = cleanCode(str(body.referralCode, 40) || req.cookies.get(REFERRAL_COOKIE)?.value);
  const name = `${firstname} ${lastname}`;
  const localRef = `interest:${crypto.randomUUID()}`;
  const ctx = formContext(req, body.pageUri, "Residential interest");
  const details = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "-"}`,
    `City: ${city}, ${state}${zip ? ` ${zip}` : ""}`,
    `Trash cans kept: ${canLocation || "-"}`,
    `Source: ${source || "-"}${referralCode ? `, referral code ${referralCode}` : ""}`,
  ].join("\n");

  after(async () => {
    if (hubspotConfigured()) {
      try {
        const contactId = await upsertContact(
          { email, name, firstname, lastname, mobile: phone, city, state, zip, source, referralCode },
          localRef,
        );
        if (canLocation) await addNote(contactId, `Where the trash cans are kept: ${canLocation}`, localRef);
        await addTask(contactId, `Residential lead: follow up with ${name}`, details, localRef);
      } catch (e) {
        console.error(`[hubspot] ${localRef}:`, e);
      }
    }
    await submitForm("interest", { email, firstname, lastname, mobilephone: phone, city, state, zip }, ctx, localRef);
    await sendEmail(residential.notifyEmail, `Residential lead: ${name} (${city})`, `${name} filled out the Get started form.\n\n${details}`, email);
  });

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  try {
    return await handle(req);
  } catch (e) {
    console.error("[residential:interest]", e);
    return NextResponse.json(
      { error: `Something went wrong on our end. Please call or text ${residential.contact.phone}.` },
      { status: 500 },
    );
  }
}
