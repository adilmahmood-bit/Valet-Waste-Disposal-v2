import { db, must } from "./db";
import { getRoute } from "./routific";
import { addDays, todaySD } from "./schedule";

// Business mileage log (Admin > Mileage), kept for tax and accounting.
// - Roll-outs: each completed Routific route is logged with Routific's planned driving distance
//   (start address -> stops -> end address).
// - Roll-ins: crew roll-ins aren't Routific routes, so each day of roll-ins is logged with an
//   estimate: the distance of the roll-out route(s) that served the same properties the night
//   before (same loop, driven again).
// - Manual: anything else Adil drives for the business.
// Typing actual (odometer) miles on any trip replaces the planned/estimated figure.

const KM_TO_MI = 0.621371;
const round1 = (n: number) => Math.round(n * 10) / 10;

export type MileageTrip = {
  id: string;
  date: string;
  kind: "rollout" | "rollin" | "manual";
  source: "routific" | "estimate" | "manual";
  route_uuid: string | null;
  purpose: string;
  start_address: string | null;
  end_address: string | null;
  stops: number | null;
  planned_miles: number | null;
  actual_miles: number | null;
  minutes: number | null;
  driver: string | null;
  note: string | null;
};

// The miles that count: actual (odometer) when entered, otherwise planned/estimated.
export const tripMiles = (t: Pick<MileageTrip, "actual_miles" | "planned_miles">) =>
  t.actual_miles != null ? Number(t.actual_miles) : t.planned_miles != null ? Number(t.planned_miles) : 0;

const cityList = (cities: string[]) => {
  const unique = [...new Set(cities.filter(Boolean))];
  return unique.length ? ` (${unique.join(", ")})` : "";
};

type RouteOrder = { kind: string; address: { city: string } | null };

// Logs (or refreshes) one Routific route once it's completed. Keeps any actual miles or note
// Adil typed. Returns false while the route isn't finished yet.
export async function recordRouteMileage(routeUuid: string) {
  const route = await getRoute(routeUuid);
  if (route.status !== "completed" || route.distanceInKilometers == null) return false;
  const orders = must(
    await db().from("res_routific_orders").select("kind, address:res_addresses(city)").eq("route_uuid", routeUuid).is("deleted_at", null),
  ) as unknown as RouteOrder[];
  const count = (k: string) => orders.filter((o) => o.kind === k).length;
  const parts = [
    count("rollout") && `${count("rollout")} roll-out${count("rollout") === 1 ? "" : "s"}`,
    count("rollin") && `${count("rollin")} roll-in${count("rollin") === 1 ? "" : "s"}`,
    count("extra") && `${count("extra")} extra pickup${count("extra") === 1 ? "" : "s"}`,
  ].filter(Boolean);
  const purpose = `Trash can valet route "${route.name}": ${parts.join(", ") || "stops"}${cityList(orders.map((o) => o.address?.city ?? ""))}`;
  must(
    await db()
      .from("res_mileage_trips")
      .upsert(
        {
          route_uuid: routeUuid,
          date: route.date,
          kind: "rollout",
          source: "routific",
          purpose,
          start_address: route.constraints?.startLocation?.address ?? null,
          end_address: route.constraints?.endLocation?.address ?? null,
          stops: orders.length || null,
          planned_miles: round1(route.distanceInKilometers * KM_TO_MI),
          minutes: route.workingTimeInSeconds != null ? Math.round(route.workingTimeInSeconds / 60) : null,
          driver: route.driver?.name ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "route_uuid" },
      ),
  );
  return true;
}

// Routes with delivered stops in the last few days that aren't in the log yet. Runs after each
// Routific webhook and on the daily sync, so a route shows up once its last stop is done.
export async function catchUpRouteMileage(days = 7) {
  const since = addDays(todaySD(), -days);
  const rows = must(
    await db().from("res_routific_orders").select("route_uuid").eq("routific_status", "delivered").gte("delivery_date", since).not("route_uuid", "is", null),
  ) as { route_uuid: string }[];
  const uuids = [...new Set(rows.map((r) => r.route_uuid))];
  if (!uuids.length) return 0;
  const logged = must(await db().from("res_mileage_trips").select("route_uuid").in("route_uuid", uuids)) as { route_uuid: string }[];
  let added = 0;
  for (const uuid of uuids.filter((u) => !logged.some((l) => l.route_uuid === u))) {
    try {
      if (await recordRouteMileage(uuid)) added++;
    } catch (e) {
      console.error("[mileage] route log failed", uuid, e);
    }
  }
  return added;
}

// One estimated trip per day of crew roll-ins: the same properties' roll-out route distance
// from the night before. Updates the stop count and estimate as more roll-ins are logged;
// never touches actual miles or notes.
export async function syncRollinTrips(days = 14) {
  const since = addDays(todaySD(), -days);
  const visits = must(
    await db()
      .from("res_visits")
      .select("date, address_id, address:res_addresses(city)")
      .eq("type", "back")
      .in("status", ["done", "issue"])
      // Roll-ins done as Routific stops are on that route's own mileage entry already.
      .neq("completed_by", "routific")
      .gte("date", since),
  ) as unknown as { date: string; address_id: string; address: { city: string } | null }[];
  const byDate = new Map<string, typeof visits>();
  for (const v of visits) byDate.set(v.date, [...(byDate.get(v.date) ?? []), v]);

  for (const [date, list] of byDate) {
    const addressIds = [...new Set(list.map((v) => v.address_id))];
    // The roll-out route(s) that put these properties' cans out for this pickup day.
    const orders = must(
      await db().from("res_routific_orders").select("route_uuid").eq("pickup_date", date).eq("kind", "rollout").in("address_id", addressIds).not("route_uuid", "is", null),
    ) as { route_uuid: string }[];
    const routeUuids = [...new Set(orders.map((o) => o.route_uuid))];
    const routes = routeUuids.length
      ? (must(await db().from("res_mileage_trips").select("planned_miles, start_address, end_address").in("route_uuid", routeUuids)) as Pick<
          MileageTrip,
          "planned_miles" | "start_address" | "end_address"
        >[])
      : [];
    const estimate = routes.length ? round1(routes.reduce((n, r) => n + Number(r.planned_miles ?? 0), 0)) : null;
    const fields = {
      purpose: `Trash can roll-in: ${addressIds.length} stop${addressIds.length === 1 ? "" : "s"}${cityList(list.map((v) => v.address?.city ?? ""))}`,
      stops: addressIds.length,
      planned_miles: estimate,
      start_address: routes[0]?.start_address ?? null,
      end_address: routes[0]?.end_address ?? null,
      updated_at: new Date().toISOString(),
    };
    const existing = must(await db().from("res_mileage_trips").select("id").eq("kind", "rollin").eq("date", date).maybeSingle()) as { id: string } | null;
    if (existing) must(await db().from("res_mileage_trips").update(fields).eq("id", existing.id));
    else must(await db().from("res_mileage_trips").insert({ ...fields, date, kind: "rollin", source: "estimate" }));
  }
}

export async function tripsForYear(year: number) {
  return must(
    await db().from("res_mileage_trips").select("*").gte("date", `${year}-01-01`).lte("date", `${year}-12-31`).order("date", { ascending: false }).order("kind"),
  ) as MileageTrip[];
}

// Adil's per-mile rate for the deduction estimate (from his accountant); null until set.
export async function mileageRate() {
  const row = must(await db().from("res_app_state").select("value").eq("key", "mileage_rate").maybeSingle()) as { value: { rate?: number } } | null;
  return row?.value?.rate ?? null;
}
