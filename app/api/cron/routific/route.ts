import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/residential/db";
import { syncRoutific } from "@/lib/residential/routific-sync";
import { fillMissingPhotos } from "@/lib/residential/routific-webhook";

// Called on a schedule (Supabase pg_cron + pg_net) to keep Routific in step with tonight's
// and tomorrow night's roll-outs. Needs "Authorization: Bearer <CRON_SECRET>".
// Add ?dry=1 to see what would change without touching Routific, and ?from=YYYY-MM-DD to
// start at a later roll-out date.

export const dynamic = "force-dynamic";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || !given) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const params = new URL(req.url).searchParams;
  const dryRun = params.get("dry") === "1";
  // Optional ?from=YYYY-MM-DD to sync a later roll-out date (never earlier than today).
  const from = params.get("from");
  if (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) return NextResponse.json({ error: "from must be YYYY-MM-DD" }, { status: 400 });
  try {
    const result = await syncRoutific({ dryRun, from: from ?? undefined });
    if (!dryRun) {
      // Proof photos that reached Routific after their stop was marked done.
      const photos = await fillMissingPhotos().catch((e) => (console.error("[cron:routific] photo catch-up failed", e), 0));
      if (photos) console.log(`[cron:routific] added ${photos} late proof photos`);
    }
    if (!dryRun) await db().from("res_app_state").upsert({ key: "routific_last_sync", value: { ...result, by: "daily schedule" }, updated_at: new Date().toISOString() });
    const count = (k: "create" | "update" | "remove" | "keep") => result.days.reduce((n, d) => n + d[k].length, 0);
    const errors = result.days.flatMap((d) => d.errors);
    console.log(`[cron:routific] dry=${dryRun} create=${count("create")} update=${count("update")} remove=${count("remove")} errors=${errors.length}`);
    return NextResponse.json(result, { status: errors.length ? 207 : 200 });
  } catch (e) {
    console.error("[cron:routific] failed", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
