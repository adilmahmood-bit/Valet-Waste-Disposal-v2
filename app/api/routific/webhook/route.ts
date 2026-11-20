import { NextResponse } from "next/server";
import { db } from "@/lib/residential/db";
import { handleRoutificEvent, verifySignature } from "@/lib/residential/routific-webhook";

// Routific webhook endpoint. Set up in plan.routific.com > Settings > Webhooks (Admin only),
// with the signing secret in ROUTIFIC_WEBHOOK_SECRET.

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.ROUTIFIC_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const raw = await req.text(); // the signature covers the exact bytes, so verify before parsing
  if (!verifySignature(raw, req.headers.get("x-routific-signature"), req.headers.get("x-routific-timestamp"), secret)) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  const topic = req.headers.get("x-routific-topic") ?? "";
  const eventId = req.headers.get("x-routific-event-id") ?? "";
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  // Claim the event id first; a retried delivery of something we already handled is a no-op.
  if (eventId) {
    const claim = await db().from("res_routific_events").insert({ event_id: eventId, topic });
    if (claim.error) {
      if (claim.error.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
      console.error("[routific:webhook] event log failed", claim.error.message);
    }
  }

  try {
    const result = await handleRoutificEvent(topic, body);
    console.log(`[routific:webhook] ${topic} ${eventId}: ${result}`);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[routific:webhook] ${topic} ${eventId} failed`, e);
    // Release the claim so Routific's retry gets processed.
    if (eventId) await db().from("res_routific_events").delete().eq("event_id", eventId);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
