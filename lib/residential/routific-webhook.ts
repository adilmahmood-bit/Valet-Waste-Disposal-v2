import { createHmac, timingSafeEqual } from "node:crypto";
import { db, must } from "./db";
import { saveVisitPhoto } from "./photos";
import { getOrder, getPhoto } from "./routific";
import { notifyVisit } from "./visit-notify";

// Routific webhooks (api-docs.routific.com/reference/routific-webhooks):
// - order.status_updated: a driver marked a roll-out delivered or missed. We record the "out"
//   visit, copy the proof-of-delivery photo into our own storage, and notify.
// - route.published / route.eta_updated: arrival estimates for each stop.
// - route.unpublished: the route was pulled back, so its estimates no longer hold.

const MAX_AGE_MS = 5 * 60 * 1000;

// HMAC-SHA256 of the raw body with the signing secret, hex, sent as "v0=<sig>[,<previous sig>]".
export function verifySignature(rawBody: string, header: string | null, timestamp: string | null, secret: string) {
  if (!header?.startsWith("v0=")) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"));
  const ok = header
    .slice(3)
    .split(",")
    .map((s) => s.trim().replace(/^v0=/, ""))
    .some((sig) => {
      const given = Buffer.from(sig);
      return given.length === expected.length && timingSafeEqual(given, expected);
    });
  if (!ok) return false;
  const at = timestamp ? new Date(timestamp).getTime() : NaN;
  return Number.isFinite(at) && Date.now() - at <= MAX_AGE_MS;
}

type OrderRow = { id: string; address_id: string; delivery_date: string; routific_status: string | null; kind: string };

async function orderRow(uuid: string) {
  return must(
    await db().from("res_routific_orders").select("id, address_id, delivery_date, routific_status, kind").eq("order_uuid", uuid).maybeSingle(),
  ) as OrderRow | null;
}

type StatusEvent = {
  data: {
    order: { uuid: string; status: string; deliveryTime?: string | null; deliveryNotes?: string | null; deliveryMissedReason?: string | null };
    route?: { uuid?: string };
  };
};

async function onOrderStatus(body: StatusEvent) {
  const o = body.data?.order;
  if (!o?.uuid) return "no order in payload";
  const row = await orderRow(o.uuid);
  if (!row) return `order ${o.uuid} isn't one of ours`;

  const status = o.status === "delivered" ? "done" : o.status === "missed" ? "missed" : null;
  must(
    await db()
      .from("res_routific_orders")
      .update({ routific_status: o.status, route_uuid: body.data.route?.uuid ?? null, updated_at: new Date().toISOString() })
      .eq("id", row.id),
  );
  if (!status) return `status ${o.status} recorded`;

  // Extra trash pickups aren't roll-outs or roll-ins: record the status, and flag a miss.
  if (row.kind === "extra") {
    if (status === "missed") await notifyVisit(row.address_id, "out", "missed", `Extra trash pickup: ${o.deliveryMissedReason ?? "no reason given"}`);
    return `extra pickup ${status}`;
  }
  const type = row.kind === "rollin" ? "back" : "out";

  const note = [o.deliveryNotes, o.deliveryMissedReason].filter(Boolean).join(" · ") || null;
  const visit = {
    address_id: row.address_id,
    date: row.delivery_date,
    type,
    status,
    note,
    completed_by: "routific",
    completed_at: o.deliveryTime ?? new Date().toISOString(),
  };
  must(await db().from("res_visits").upsert(visit, { onConflict: "address_id,date,type" }));

  // Copy the first proof-of-delivery photo into our bucket. A photo problem doesn't fail
  // the webhook: the visit is already recorded.
  if (status === "done") {
    try {
      const full = await getOrder(o.uuid);
      const ref = full.proofOfDelivery?.photos?.[0];
      if (ref) {
        const photo = await getPhoto(o.uuid, ref);
        const url = await saveVisitPhoto(`${row.address_id}/${row.delivery_date}-${type}-${photo.photoUuid}.jpg`, photo.bytes, photo.contentType);
        must(
          await db().from("res_visits").update({ photo_url: url }).eq("address_id", row.address_id).eq("date", row.delivery_date).eq("type", type),
        );
      }
    } catch (e) {
      console.error("[routific:webhook] photo copy failed", e);
    }
  }

  await notifyVisit(row.address_id, type, status, note);
  return `visit ${status}`;
}

type TimelineEvent = {
  data: {
    route: { uuid: string };
    timeline?: { type: string; plannedArrivalTime?: string | null; actualArrivalTime?: string | null; orders?: { uuid: string; status?: string }[] }[];
  };
};

async function onRouteTimeline(body: TimelineEvent, published: boolean) {
  const route = body.data?.route;
  if (!route?.uuid) return "no route in payload";
  let n = 0;
  for (const stop of body.data.timeline ?? []) {
    if (stop.type !== "delivering_stop") continue;
    for (const o of stop.orders ?? []) {
      const row = await orderRow(o.uuid);
      if (!row) continue;
      const done = row.routific_status === "delivered" || row.routific_status === "missed";
      const update: Record<string, string | null> = {
        route_uuid: route.uuid,
        eta: stop.actualArrivalTime ?? stop.plannedArrivalTime ?? null,
        updated_at: new Date().toISOString(),
      };
      if (!done && o.status) update.routific_status = o.status.replace(" ", "_");
      // The tracking link is on the order itself, not in the webhook.
      if (published) {
        try {
          update.tracking_url = (await getOrder(o.uuid)).deliveryTracking?.shortUrl ?? null;
        } catch (e) {
          console.error("[routific:webhook] tracking link fetch failed", e);
        }
      }
      must(await db().from("res_routific_orders").update(update).eq("id", row.id));
      n++;
    }
  }
  return `${n} orders updated`;
}

async function onRouteUnpublished(body: { route?: { uuid?: string }; data?: { route?: { uuid?: string } } }) {
  const uuid = body.route?.uuid ?? body.data?.route?.uuid;
  if (!uuid) return "no route in payload";
  must(
    await db()
      .from("res_routific_orders")
      .update({ eta: null, tracking_url: null, updated_at: new Date().toISOString() })
      .eq("route_uuid", uuid)
      .not("routific_status", "in", "(delivered,missed)"),
  );
  return "estimates cleared";
}

export async function handleRoutificEvent(topic: string, body: unknown) {
  switch (topic) {
    case "order.status_updated":
      return onOrderStatus(body as StatusEvent);
    case "route.published":
      return onRouteTimeline(body as TimelineEvent, true);
    case "route.eta_updated":
      return onRouteTimeline(body as TimelineEvent, false);
    case "route.unpublished":
      return onRouteUnpublished(body as { route?: { uuid?: string } });
    default:
      return `ignored ${topic}`;
  }
}
