import { after, NextResponse, type NextRequest } from "next/server";
import { residential } from "@/config/residential";
import { db, must } from "@/lib/residential/db";
import { syncWaitlist, submitForm } from "@/lib/residential/hubspot";
import { sendEmail } from "@/lib/residential/email";
import { SOURCE_COOKIE, REFERRAL_COOKIE, cleanCode, normalizeSource } from "@/lib/residential/tracking";
import { formContext, isEmail, splitName, str } from "@/lib/residential/request";

async function handle(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = str(body.name, 120);
  const email = str(body.email, 200).toLowerCase();
  const zip = str(body.zip, 10).replace(/\D/g, "").slice(0, 5);
  if (!name || !isEmail(email) || zip.length !== 5) {
    return NextResponse.json({ error: "Please enter your name, a valid email and a 5-digit ZIP." }, { status: 400 });
  }

  const row = must(
    await db()
      .from("res_waitlist")
      .insert({
        name,
        email,
        zip,
        mobile: str(body.mobile, 40) || null,
        address: str(body.address, 200) || null,
        source: normalizeSource(req.cookies.get(SOURCE_COOKIE)?.value) || null,
        referral_code: cleanCode(req.cookies.get(REFERRAL_COOKIE)?.value) || null,
      })
      .select("id")
      .single(),
  ) as { id: string };

  const ctx = formContext(req, body.pageUri, "Residential waitlist");
  after(async () => {
    await syncWaitlist(row.id);
    await submitForm("waitlist", { email, ...splitName(name), mobilephone: str(body.mobile, 40), zip }, ctx, `waitlist:${row.id}`);
    await sendEmail(
      residential.notifyEmail,
      `Residential waitlist: ${zip}`,
      `${name} joined the waitlist.\nZIP: ${zip}\nEmail: ${email}\nMobile: ${str(body.mobile, 40) || "-"}\nAddress: ${str(body.address, 200) || "-"}`,
      email,
    );
  });

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  try {
    return await handle(req);
  } catch (e) {
    console.error("[residential:waitlist]", e);
    return NextResponse.json(
      { error: `Something went wrong on our end. Please call or text ${residential.contact.phone}.` },
      { status: 500 },
    );
  }
}
