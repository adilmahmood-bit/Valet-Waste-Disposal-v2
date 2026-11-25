import { createHash } from "node:crypto";
import { accessFlagLabel, residential } from "@/config/residential";
import { db, must, type AddressRow } from "./db";
import { buildRoute, type Stop } from "./routes";
import { addDays, formatLong, todaySD } from "./schedule";
import {
  createOrders,
  deleteOrder,
  getOrder,
  listRoutes,
  publishRoutes,
  RoutificError,
  routificConfigured,
  scheduleOrders,
  updateOrder,
  type RoutificOrderInput,
} from "./routific";
import { decryptGateCode } from "./crypto";

// Keeps Routific in step with our schedule: two orders per property per trash day, the evening
// roll-out (kind "rollout", the night before) and the roll-in after pickup (kind "rollin", on
// pickup day). Our route builder (holidays, pauses, plan dates) decides who is due; this creates
// missing orders, updates changed ones and deletes ones no longer due. Safe to run any number of
// times. Never touches dates before today.

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
  routific_order_number: string | null;
  routific_status: string | null;
  payload_hash: string | null;
  created_at: string;
  manual: boolean;
};

type Kind = "rollout" | "rollin";

const DONE = ["delivered", "missed"];

// Driver-facing basics shared by both kinds of stop.
function stopBasics(stop: Stop) {
  const { address, customer, gateCode } = stop;
  const { stopSeconds } = residential.routific;
  // "5966 Baja Dr (front house)": the bracket note goes to the driver, not to the map lookup.
  const unit = address.street.match(/\(([^)]*)\)/)?.[1];
  const street = address.street.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  return {
    name: customer.name,
    cans: `${address.bins} ${address.bins === 1 ? "can" : "cans"}`,
    location: { address: `${street}, ${address.city}, CA ${address.zip}` },
    duration: stopSeconds.base + stopSeconds.perBin * address.bins,
    extra: [
      unit ? `Which one: ${unit}` : null,
      gateCode ? `Gate code: ${gateCode}` : null,
      address.access_flags.length ? `Access: ${address.access_flags.map(accessFlagLabel).join(", ")}` : null,
      address.access_notes ? `Notes: ${address.access_notes}` : null,
    ],
  };
}

export function orderFor(stop: Stop): RoutificOrderInput {
  const b = stopBasics(stop);
  const { rollOutWindow } = residential.routific;
  const lines = [
    `ROLL OUT ${b.cans} for trash pickup ${formatLong(stop.pickupDate)}.`,
    stop.sub?.plan === "push_out" ? "Roll-out only plan: we do NOT bring these back." : "Roll-in after pickup is a separate stop tomorrow.",
    ...b.extra,
  ];
  return {
    name: b.name,
    locations: [b.location],
    duration: b.duration,
    instructions: lines.filter(Boolean).join("\n"),
    timeWindows: [{ startTime: rollOutWindow.start, endTime: rollOutWindow.end }],
    customerOrderNumber: `${stop.address.id}:${stop.pickupDate}`,
    deliveryDate: stop.visitDate,
  };
}

// The roll-in on pickup day. Same external ID format as a roll-in added by hand on the dashboard,
// so the two can't both exist (the unique index on address, pickup date and kind).
export function rollInOrderFor(stop: Stop): RoutificOrderInput {
  const b = stopBasics(stop);
  const { rollInWindow } = residential.routific;
  const lines = [
    `ROLL IN ${b.cans}: bring them back from the curb to their spot after today's trash pickup.`,
    "If the cans haven't been emptied yet, mark this stop missed and note it.",
    ...b.extra,
  ];
  return {
    name: b.name,
    locations: [b.location],
    duration: b.duration,
    instructions: lines.filter(Boolean).join("\n"),
    timeWindows: [{ startTime: rollInWindow.start, endTime: rollInWindow.end }],
    customerOrderNumber: `${stop.address.id}:${stop.pickupDate}:rollin`,
    deliveryDate: stop.visitDate,
  };
}

const hashOf = (o: RoutificOrderInput) => createHash("sha256").update(JSON.stringify(o)).digest("hex");
const KIND_LABEL: Record<Kind, string> = { rollout: "Roll-out", rollin: "Roll-in" };
const label = (s: Stop, kind: Kind) => `${KIND_LABEL[kind]}: ${s.address.street}, ${s.address.zip} (${s.customer.name})`;
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 500);

// "HH:MM" now in San Diego.
const nowTimeSD = () =>
  new Date().toLocaleTimeString("en-GB", { timeZone: "America/Los_Angeles", hour: "2-digit", minute: "2-digit", hour12: false });

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

type DayOptions = { only?: Set<string>; remove?: boolean; kinds?: Kind[] };

// One day: that evening's roll-outs (for the next day's pickup) and that day's roll-ins (after
// its pickup). `only` limits it to some properties and `kinds` to one kind of stop (the
// dashboard's "push selected" sends roll-outs only); `remove: false` leaves orders that are no
// longer due alone. One-off stops added on the dashboard (manual) are never removed.
async function syncDay(date: string, dryRun: boolean, { only, remove = true, kinds = ["rollout", "rollin"] }: DayOptions = {}): Promise<DaySync> {
  const pickupDate = addDays(date, 1);
  const day: DaySync = { rollOutDate: date, pickupDate, create: [], update: [], remove: [], keep: [], errors: [] };
  const route = await buildRoute(date);
  const pick = (s: Stop) => !s.paused && (!only || only.has(s.address.id));

  if (kinds.includes("rollout")) {
    await syncKind(day, "rollout", pickupDate, date, route.out.filter((s) => s.pickupDate === pickupDate && pick(s)), dryRun, remove);
  }
  if (kinds.includes("rollin")) {
    // Today's roll-ins only while their window is still open; after it, a new stop would be stale.
    const open = date > todaySD() || nowTimeSD() < residential.routific.rollInWindow.end;
    if (open) await syncKind(day, "rollin", date, date, route.back.filter(pick), dryRun, remove);
  }
  return day;
}

async function syncKind(day: DaySync, kind: Kind, pickupDate: string, deliveryDate: string, due: Stop[], dryRun: boolean, remove: boolean) {
  const build = kind === "rollout" ? orderFor : rollInOrderFor;
  const rows = must(
    await db().from("res_routific_orders").select("*").eq("pickup_date", pickupDate).eq("kind", kind).is("deleted_at", null),
  ) as OrderRow[];
  const rowFor = new Map(rows.map((r) => [r.address_id, r]));
  const dueIds = new Set(due.map((s) => s.address.id));

  // Our row only says what we sent. If the order was deleted in Routific since, matching on the
  // row alone would report it as "already there" forever, so check each due one still exists
  // (and pick up its current status). A missing one is created again below.
  const gone = new Set<string>();
  for (const stop of due) {
    const row = rowFor.get(stop.address.id);
    if (!row?.order_uuid || DONE.includes(row.routific_status ?? "") || (row.manual && kind === "rollin")) continue;
    try {
      const remote = await getOrder(row.order_uuid);
      if (remote.status && remote.status !== row.routific_status) {
        row.routific_status = remote.status;
        if (!dryRun) await db().from("res_routific_orders").update({ routific_status: remote.status, updated_at: new Date().toISOString() }).eq("id", row.id);
      }
    } catch (e) {
      // Any other failure (network, Routific down): carry on with what we have.
      if (e instanceof RoutificError && e.status === 404) gone.add(row.id);
    }
  }

  // Work out what to do.
  const toCreate: { stop: Stop; order: RoutificOrderInput; row?: OrderRow }[] = [];
  const toUpdate: { stop: Stop; order: RoutificOrderInput; row: OrderRow }[] = [];
  for (const stop of due) {
    const order = build(stop);
    const row = rowFor.get(stop.address.id);
    const line = { label: label(stop, kind), addressId: stop.address.id };
    if (row && !row.order_uuid && Date.now() - new Date(row.created_at).getTime() < 120_000) {
      // Another sync claimed it moments ago and is still talking to Routific.
      day.keep.push({ ...line, detail: "being created" });
    } else if (row?.manual && kind === "rollin") {
      // A roll-in already added by hand (its own window and notes): leave it as it is.
      day.keep.push({ ...line, detail: "added by hand" });
    } else if (!row || !row.order_uuid || gone.has(row.id)) {
      toCreate.push({ stop, order, row });
      day.create.push({ ...line, detail: !row ? undefined : gone.has(row.id) ? `${row.routific_order_number ?? "order"} was missing in Routific` : "retry" });
    } else if (DONE.includes(row.routific_status ?? "")) {
      day.keep.push({ ...line, detail: row.routific_status ?? undefined });
    } else if (row.payload_hash !== hashOf(order)) {
      toUpdate.push({ stop, order, row });
      day.update.push(line);
    } else {
      day.keep.push(line);
    }
  }
  // Stops added by hand on the dashboard (manual) are never removed by the sync.
  const toRemove = remove ? rows.filter((r) => !dueIds.has(r.address_id) && !r.manual) : [];
  for (const r of toRemove) {
    const done = DONE.includes(r.routific_status ?? "");
    (done ? day.keep : day.remove).push({
      label: `${KIND_LABEL[kind]}: ${r.customer_order_number}`,
      addressId: r.address_id,
      detail: done ? `${r.routific_status}, no longer due` : undefined,
    });
  }
  if (dryRun) return;

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
      .insert({ address_id: stop.address.id, kind, pickup_date: pickupDate, delivery_date: deliveryDate, customer_order_number: order.customerOrderNumber })
      .select("id")
      .maybeSingle();
    if (ins.error) {
      day.errors.push(`${label(stop, kind)}: skipped, another sync is creating it (${ins.error.message})`);
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
      day.errors.push(`Creating ${claimed.length} ${KIND_LABEL[kind].toLowerCase()} orders failed: ${msg(e)}`);
      await db().from("res_routific_orders").update({ last_error: msg(e), updated_at: new Date().toISOString() }).in("id", claimed.map((c) => c.rowId));
    }
  }

  for (const { stop, order, row } of toUpdate) {
    try {
      await updateOrder(row.order_uuid!, order);
      await db().from("res_routific_orders").update({ payload_hash: hashOf(order), last_error: null, updated_at: new Date().toISOString() }).eq("id", row.id);
    } catch (e) {
      day.errors.push(`Updating ${label(stop, kind)} failed: ${msg(e)}`);
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
}

// For the admin page: orders we know about from yesterday on.
export async function recentOrders() {
  return must(
    await db()
      .from("res_routific_orders")
      .select("id, kind, notes, pickup_date, delivery_date, customer_order_number, order_uuid, routific_order_number, routific_status, eta, last_error, deleted_at, updated_at, address:res_addresses(street, zip)")
      .gte("pickup_date", addDays(todaySD(), -1))
      .order("pickup_date")
      .order("created_at"),
  ) as unknown as {
    id: string;
    kind: string;
    notes: string | null;
    eta: string | null;
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

// ---------- dispatch dashboard ----------

// Sends the chosen properties' roll-outs for one evening (creating or updating), and nothing else.
export async function pushRollouts(rollOutDate: string, addressIds: string[]) {
  if (!routificConfigured()) throw new Error("Routific isn't set up.");
  if (rollOutDate < todaySD()) throw new Error("That date has passed.");
  const day = await syncDay(rollOutDate, false, { only: new Set(addressIds), remove: false, kinds: ["rollout"] });
  const routing = await routeAndPublish(rollOutDate, addressIds);
  return { ...day, routing };
}

// Creating an order only puts it in Routific's "unscheduled" list; the driver sees nothing until
// it is on a route and the route is published. This does both for the chosen roll-outs: schedules
// the ones not on a route yet onto that day's routes, then publishes the day. Returns notes for
// the dashboard (problems start with "!").
async function routeAndPublish(date: string, addressIds: string[]): Promise<string[]> {
  const notes: string[] = [];
  const rows = must(
    await db()
      .from("res_routific_orders")
      .select("id, order_uuid, routific_order_number, routific_status")
      .eq("kind", "rollout")
      .eq("delivery_date", date)
      .in("address_id", addressIds)
      .is("deleted_at", null),
  ) as { id: string; order_uuid: string | null; routific_order_number: string | null; routific_status: string | null }[];
  const live = rows.filter((r) => r.order_uuid && !DONE.includes(r.routific_status ?? ""));
  if (!live.length) return notes;

  try {
    const unscheduled: typeof live = [];
    for (const r of live) {
      const o = await getOrder(r.order_uuid!).catch(() => null);
      if (o && !o.isScheduled && !DONE.includes(o.status)) unscheduled.push(r);
    }
    const routes = await listRoutes(date);
    if (unscheduled.length) {
      if (!routes.length) {
        notes.push(`! There's no route in Routific for ${formatLong(date)}, so ${unscheduled.map((r) => r.routific_order_number).join(", ")} can't go on one. Create a route for that day in Routific (with a driver), then push again.`);
        return notes;
      }
      // Routific refuses the whole request if any route is locked; drop those and try the rest.
      let open = routes;
      let res: Awaited<ReturnType<typeof scheduleOrders>> | null = null;
      while (!res) {
        if (!open.length) {
          const names = routes.map((r) => `"${r.name}"`).join(", ");
          notes.push(`! The ${formatLong(date)} route${routes.length > 1 ? "s" : ""} in Routific (${names}) ${routes.length > 1 ? "are" : "is"} locked, so Routific won't add stops. A route is locked once it's published or under way: add the stop to it in Routific and publish again, or unlock it there and push again.`);
          return notes;
        }
        try {
          res = await scheduleOrders(date, unscheduled.map((r) => r.order_uuid!), open.map((r) => r.uuid));
        } catch (e) {
          if (!(e instanceof RoutificError && e.status === 400 && e.body.includes("ROUTE_LOCKED"))) throw e;
          const locked = String((JSON.parse(e.body) as { params?: { uuids?: string | string[] } }).params?.uuids ?? "");
          const next = open.filter((r) => !locked.includes(r.uuid));
          open = next.length < open.length ? next : [];
        }
      }
      if (res.status !== "finished") {
        notes.push(`! Routific couldn't put the stops on a route (${res.status}${res.error ? `: ${res.error}` : ""}).`);
        return notes;
      }
      const onRoute = new Set((res.actionSummary?.scheduledOrders ?? []).map((o) => o.uuid));
      for (const r of unscheduled) {
        if (onRoute.has(r.order_uuid!)) {
          await db().from("res_routific_orders").update({ routific_status: "scheduled", updated_at: new Date().toISOString() }).eq("id", r.id);
        }
      }
      const left = unscheduled.filter((r) => !onRoute.has(r.order_uuid!));
      notes.push(`Put ${onRoute.size} on the route.`);
      if (left.length) notes.push(`! Routific left ${left.map((r) => r.routific_order_number).join(", ")} off the route; open ${formatLong(date)} in Routific to place it by hand.`);
    }
    try {
      const pub = await publishRoutes(date);
      const bad = (pub.actionSummary?.routes ?? []).filter((r) => r.actionStatus !== "finished" && r.actionStatus !== "skipped");
      if (pub.status === "finished") notes.push("Route published to the driver app.");
      else notes.push(`! Publishing the route ${pub.status}${pub.error ? `: ${pub.error}` : ""}${bad.length ? ` (${bad.map((r) => r.error ?? r.actionStatus).join("; ")})` : ""}.`);
    } catch (e) {
      // 400 PUBLISH_FAILED: nothing changed since the last publish.
      if (e instanceof RoutificError && e.status === 400 && e.body.includes("PUBLISH_FAILED")) notes.push("Route was already published.");
      else throw e;
    }
  } catch (e) {
    notes.push(`! Routing in Routific failed: ${msg(e)}`);
  }
  return notes;
}

// Removes orders from Routific (and marks them removed here). Completed ones can't be removed.
export async function removeOrders(rowIds: string[]) {
  const rows = must(
    await db().from("res_routific_orders").select("id, order_uuid, routific_status, customer_order_number").in("id", rowIds).is("deleted_at", null),
  ) as { id: string; order_uuid: string | null; routific_status: string | null; customer_order_number: string }[];
  const errors: string[] = [];
  for (const r of rows) {
    if (DONE.includes(r.routific_status ?? "")) {
      errors.push(`${r.customer_order_number}: already ${r.routific_status}, Routific won't remove it`);
      continue;
    }
    try {
      if (r.order_uuid) await deleteOrder(r.order_uuid);
      await db().from("res_routific_orders").update({ deleted_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() }).eq("id", r.id);
    } catch (e) {
      errors.push(`${r.customer_order_number}: ${msg(e)}`);
    }
  }
  return errors;
}

export type OneOffKind = "extra" | "rollin" | "rollout";

const ONE_OFF_LABEL: Record<OneOffKind, string> = {
  extra: "EXTRA TRASH PICKUP. Haul away the bagged trash and photo it.",
  rollin: "ROLL IN: bring the cans back from the curb to their spot.",
  rollout: "EXTRA ROLL OUT: put the cans out at the curb.",
};

// A one-off stop for a client's property on any day: an extra trash pickup, a roll-in, or an
// extra roll-out. An extra roll-out is stored like a regular roll-out for the next day's pickup.
export async function addOneOff(o: { addressId: string; date: string; kind: OneOffKind; start: string; end: string; notes: string | null }) {
  if (!routificConfigured()) throw new Error("Routific isn't set up.");
  if (o.date < todaySD()) throw new Error("That date has passed.");
  const a = must(
    await db().from("res_addresses").select("*, customer:res_customers(name)").eq("id", o.addressId).single(),
  ) as AddressRow & { customer: { name: string } };
  const gateCode = decryptGateCode(a.gate_code_encrypted);
  const unit = a.street.match(/\(([^)]*)\)/)?.[1];
  const street = a.street.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  const { stopSeconds } = residential.routific;
  const pickupDate = o.kind === "rollout" ? addDays(o.date, 1) : o.date;
  const order: RoutificOrderInput = {
    name: a.customer.name,
    locations: [{ address: `${street}, ${a.city}, CA ${a.zip}` }],
    duration: o.kind === "extra" ? 600 : stopSeconds.base + stopSeconds.perBin * a.bins,
    instructions: [
      ONE_OFF_LABEL[o.kind],
      unit ? `Which one: ${unit}` : null,
      o.notes ? `Notes: ${o.notes}` : null,
      gateCode ? `Gate code: ${gateCode}` : null,
      a.access_flags.length ? `Access: ${a.access_flags.map(accessFlagLabel).join(", ")}` : null,
      a.access_notes ? `Property notes: ${a.access_notes}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    timeWindows: [{ startTime: o.start, endTime: o.end }],
    customerOrderNumber: o.kind === "rollout" ? `${a.id}:${pickupDate}` : `${a.id}:${o.date}:${o.kind}`,
    deliveryDate: o.date,
  };

  const ins = await db()
    .from("res_routific_orders")
    .insert({ address_id: a.id, kind: o.kind, notes: o.notes, manual: true, pickup_date: pickupDate, delivery_date: o.date, customer_order_number: order.customerOrderNumber })
    .select("id")
    .single();
  if (ins.error) {
    throw new Error(ins.error.code === "23505" ? "That property already has this kind of stop in Routific for that day." : ins.error.message);
  }
  const rowId = (ins.data as { id: string }).id;
  try {
    const [created] = await createOrders([order]);
    await db()
      .from("res_routific_orders")
      .update({ order_uuid: created.uuid, routific_order_number: created.routificOrderNumber, routific_status: created.status, payload_hash: hashOf(order), updated_at: new Date().toISOString() })
      .eq("id", rowId);
    return created.routificOrderNumber;
  } catch (e) {
    await db().from("res_routific_orders").delete().eq("id", rowId);
    throw e;
  }
}
