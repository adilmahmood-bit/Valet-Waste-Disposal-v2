import { db } from "./db";

// Sends through Resend when RESEND_API_KEY and EMAIL_FROM are set. Otherwise the email is
// only logged (server console + res_email_log), which is how the local demo runs.
export async function sendEmail(to: string, subject: string, body: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  let provider = "log";
  let status = "logged";
  let error: string | null = null;

  if (apiKey && from) {
    provider = "resend";
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, subject, text: body }),
      });
      status = res.ok ? "sent" : "failed";
      if (!res.ok) error = await res.text();
    } catch (e) {
      status = "failed";
      error = String(e);
    }
  } else {
    console.log(`[email:log] to=${to} subject=${subject}\n${body}`);
  }

  await db().from("res_email_log").insert({ to, subject, body, provider, status, error });
}
