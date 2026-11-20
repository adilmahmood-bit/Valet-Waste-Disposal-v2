import { createHash } from "node:crypto";
import { accessFlagLabel, residential } from "@/config/residential";
import { db, must } from "./db";
import { buildRoute, type Stop } from "./routes";
import { addDays, formatLong, todaySD } from "./schedule";
import { createOrders, deleteOrder, routificConfigured, updateOrder, type RoutificOrderInput } from "./routific";

// Keeps Routific in step with our schedule: one order per property per trash day, for the
// evening roll-out. Our route builder (holidays, pauses, plan dates) decides who is due;
// this creates missing orders, updates changed ones and deletes ones no longer due.
// Safe to run any number of times. Never touches dates before today.

export type SyncLine = { label: string; addressId: string; detail?: string };
export type DaySync = {
  rollOutDate: string;
  pickupDate: string;
  create: SyncLine[];
  update: SyncLine[];
  remove: SyncLine[];
  keep: SyncLine[];
  errors: string[];
};
export type SyncResult = { dryRun: boolean; days: DaySync[]; ranAt: string };

type OrderRow = {
  id: string;
  address_id: string;
  pickup_date: string;
  customer_order_number: string;
  order_uuid: string | null;
  routific_status: string | null;
  payload_hash: string | null;
  created_at: string;
};

const DONE = ["delivered", "missed"];

export function orderFor(stop: Stop): RoutificOrderInput {
  const { address, customer, sub, gateCode } = stop;
  const { rollOutWindow, stopSeconds } = residential.routific;
  const cans = `${address.bins} ${address.bins === 1 ? "can" : "cans"}`;
  const lines = [
    `ROLL OUT ${cans} for trash pickup ${formatLong(stop.pickupDate)}.`,
    sub?.plan === "push_out" ? "Roll-out only plan: we do NOT bring these back." : "Bring them back in after pickup (not a Routific stop).",
    gateCode ? `Gate code: ${gateCode}` : null,
    address.access_flags.length ? `Access: ${address.access_flags.map(accessFlagLabel).join(", ")}` : null,
    address.access_notes ? `Notes: ${address.access_notes}` : null,
  ];
  return {
    name: customer.name,
    locations: [{ address: `${address.street}, ${address.city}, CA ${address.zip}` }],
    duration: stopSeconds.base + stopSeconds.perBin * address.bins,
    instructions: lines.filter(Boolean).join("\n"),
    timeWindows: [{ startTime: rollOutWindow.start, endTime: rollOutWindow.end }],
    customerOrderNumber: `${address.id}:${stop.pickupDate}`,
    deliveryDate: stop.visitDate,
  };
}

const hashOf = (o: RoutificOrderInput) => createHash("sha256").update(JSON.stringify(o)).digest("hex");
const label = (s: Stop) => `${s.address.street}, ${s.address.zip} (${s.customer.name})`;
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 500);

export async function syncRoutific({ dryRun = false, from = todaySD() }: { dryRun?: boolean; from?: string } = {}): Promise<SyncResult> {
  if (!dryRun && !routificConfigured()) throw new Error("Routific isn't set up: ROUTIFIC_API_TOKEN and ROUTIFIC_WORKSPACE_UUID are needed.");
  const today = todaySD();
  const start = from < today ? today : from;
  const days: DaySync[] = [];
  for (let i = 0; i <= residential.routific.daysAhead; i++) {
    days.push(await syncDay(addDays(start, i), dryRun));
  }
  return { dryRun, days, ranAt: new Date().toISOString() };
}

async function syncDay(rollOutDate: string, dryRun: boolean): Promise<DaySync> {
  const pickupDate = addDays(rollOutDate, 1);
  const day: DaySync = { rollOutDate, pickupDate, create: [], update: [], remove: [], keep: [], errors: [] };

  const route = await buildRoute(rollOutDate);
  const due = route.out.filter((s) => !s.paused && s.pickupDate === pickupDate);
  const rows = must(
    await db().from("res_routific_orders").select("*").eq("pickup_date", pickupDate).is("deleted_at", null),
  ) as OrderRow[];
  const rowFor = new Map(rows.map((r) => [r.address_id, r]));
  const dueIds = new Set(due.map((s) => s.address.id));

  // Work out what to do.
  const toCreate: { stop: Stop; order: RoutificOrderInput; row?: OrderRow }[] = [];
  const toUpdate: { stop: Stop; order: RoutificOrderInput; row: OrderRow }[] = [];
  for (const stop of due) {
    const order = orderFor(stop);
    const row = rowFor.get(stop.address.id);
    if (row && !row.order_uuid && Date.now() - new Date(row.created_at).getTime() < 120_000) {
      // Another sync claimed it moments ago and is still talking to Routific.
      day.keep.push({ label: label(stop), addressId: stop.address.id, detail: "being created" });
    } else if (!row || !row.order_uuid) {
      toCreate.push({ stop, order, row });
      day.create.push({ label: label(stop), addressId: stop.address.id, detail: row ? "retry" : undefined });
    } else if (DONE.includes(row.routific_status ?? "")) {
      day.keep.push({ label: label(stop), addressId: stop.address.id, detail: row.routific_status ?? undefined });
    } else if (row.payload_hash !== hashOf(order)) {
      toUpdate.push({ stop, order, row });
      day.update.push({ label: label(stop), addressId: stop.address.id });
    } else {
      day.keep.push({ label: label(stop), addressId: stop.address.id });
    }
  }
  const toRemove = rows.filter((r) => !dueIds.has(r.address_id));
  for (const r of toRemove) {
    const done = DONE.includes(r.routific_status ?? "");
    (done ? day.keep : day.remove).push({ label: r.customer_order_number, addressId: r.address_id, detail: done ? `${r.routific_status}, no longer due` : undefined });
  }
  if (dryRun) return day;

  // Create: claim a row first (the unique index stops a second sync running at the same time),
  // then send every new order in one request and match the replies by customerOrderNumber.
  const claimed: { order: RoutificOrderInput; rowId: string }[] = [];
  for (const { stop, order, row } of toCreate) {
    if (row) {
      claimed.push({ order, rowId: row.id });
      continue;
    }
    const ins = await db()
      .from("res_routific_orders")
      .insert({ address_id: stop.address.id, pickup_date: pickupDate, delivery_date: rollOutDate, customer_order_number: order.customerOrderNumber })
      .select("id")
      .maybeSingle();
    if (ins.error) {
      day.errors.push(`${label(stop)}: skipped, another sync is creating it (${ins.error.message})`);
      continue;
    }
    claimed.push({ order, rowId: (ins.data as { id: string }).id });
  }
  if (claimed.length) {
    try {
      const created = await createOrders(claimed.map((c) => c.order));
      const byNumber = new Map(created.map((o) => [o.customerOrderNumber, o]));
      for (const c of claimed) {
        const o = byNumber.get(c.order.customerOrderNumber);
        const update = o
          ? { order_uuid: o.uuid, routific_order_number: o.routificOrderNumber, routific_status: o.status, payload_hash: hashOf(c.order), last_error: null }
          : { last_error: "Routific didn't return this order" };
        if (!o) day.errors.push(`${c.order.customerOrderNumber}: Routific didn't return this order`);
        await db().from("res_routific_orders").update({ ...update, updated_at: new Date().toISOString() }).eq("id", c.rowId);
      }
    } catch (e) {
      day.errors.push(`Creating ${claimed.length} orders failed: ${msg(e)}`);
      await db().from("res_routific_orders").update({ last_error: msg(e), updated_at: new Date().toISOString() }).in("id", claimed.map((c) => c.rowId));
    }
  }

  for (const { stop, order, row } of toUpdate) {
    try {
      await updateOrder(row.order_uuid!, order);
      await db().from("res_routific_orders").update({ payload_hash: hashOf(order), last_error: null, updated_at: new Date().toISOString() }).eq("id", row.id);
    } catch (e) {
      day.errors.push(`Updating ${label(stop)} failed: ${msg(e)}`);
      await db().from("res_routific_orders").update({ last_error: msg(e), updated_at: new Date().toISOString() }).eq("id", row.id);
    }
  }

  for (const r of toRemove) {
    if (DONE.includes(r.routific_status ?? "")) continue;
    try {
      if (r.order_uuid) await deleteOrder(r.order_uuid);
      await db().from("res_routific_orders").update({ deleted_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() }).eq("id", r.id);
    } catch (e) {
      day.errors.push(`Removing ${r.customer_order_number} failed: ${msg(e)}`);
      await db().from("res_routific_orders").update({ last_error: msg(e), updated_at: new Date().toISOString() }).eq("id", r.id);
    }
  }
  return day;
}

// For the admin page: orders we know about from yesterday on.
export async function recentOrders() {
  return must(
    await db()
      .from("res_routific_orders")
      .select("id, pickup_date, delivery_date, customer_order_number, order_uuid, routific_order_number, routific_status, last_error, deleted_at, updated_at, address:res_addresses(street, zip)")
      .gte("pickup_date", addDays(todaySD(), -1))
      .order("pickup_date")
      .order("created_at"),
  ) as unknown as {
    id: string;
    pickup_date: string;
    delivery_date: string;
    customer_order_number: string;
    order_uuid: string | null;
    routific_order_number: string | null;
    routific_status: string | null;
    last_error: string | null;
    deleted_at: string | null;
    updated_at: string;
    address: { street: string; zip: string } | null;
  }[];
}
