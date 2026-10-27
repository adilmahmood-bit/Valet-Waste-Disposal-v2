import { db, must, type AddressRow, type CustomerRow, type PauseRow, type ShiftRow, type SubscriptionRow } from "./db";
import { addDays, pickupsNear } from "./schedule";
import { decryptGateCode } from "./crypto";

export type VisitRow = { id: string; address_id: string; date: string; type: "out" | "back"; status: string; note: string | null; completed_at: string };

export type Stop = {
  type: "out" | "back";
  // The evening bins go out (out) or the pickup day they come back (back).
  visitDate: string;
  pickupDate: string;
  address: AddressRow;
  customer: CustomerRow;
  sub: SubscriptionRow | null;
  gateCode: string | null;
  paused: boolean;
  visit: VisitRow | null;
};

export type RouteList = {
  date: string;
  out: Stop[];
  back: Stop[];
  shiftsApplied: ShiftRow[];
  notActiveYet: number;
};

// Who gets serviced on `date`: bins out tonight for tomorrow's pickup, and bins back today
// after today's pickup. Holiday shifts and pauses are applied.
export async function buildRoute(date: string): Promise<RouteList> {
  const addresses = must(
    await db().from("res_addresses").select("*, customer:res_customers(*)").eq("status", "active"),
  ) as (AddressRow & { customer: CustomerRow })[];
  const ids = addresses.map((a) => a.id);

  const [subs, shifts, pauses, visits, notActive] = await Promise.all([
    ids.length ? db().from("res_subscriptions").select("*").in("address_id", ids).then(must) : [],
    db().from("res_service_shifts").select("*").gte("date", addDays(date, -14)).lte("date", addDays(date, 14)).then(must),
    ids.length ? db().from("res_pauses").select("*").in("address_id", ids).lte("start_date", addDays(date, 1)).gte("end_date", date).then(must) : [],
    db().from("res_visits").select("*").eq("date", date).then(must),
    db().from("res_addresses").select("id", { count: "exact", head: true }).eq("status", "signed_up"),
  ]);

  const tomorrow = addDays(date, 1);
  const out: Stop[] = [];
  const back: Stop[] = [];

  for (const { customer, ...address } of addresses) {
    const sub = ((subs as SubscriptionRow[]).find((s) => s.address_id === address.id) ?? null);
    const pickups = pickupsNear(address.trash_day, address.zip, date, shifts as ShiftRow[]);
    const inService = (pickup: string) => {
      if (!sub?.start_date) return true;
      if (sub.plan === "one_time") return pickup === sub.start_date;
      return pickup >= sub.start_date;
    };
    const isPaused = (pickup: string) => (pauses as PauseRow[]).some((p) => p.address_id === address.id && p.start_date <= pickup && p.end_date >= pickup);
    const visitFor = (type: "out" | "back") => (visits as VisitRow[]).find((v) => v.address_id === address.id && v.type === type) ?? null;
    const base = { address, customer, sub, gateCode: decryptGateCode(address.gate_code_encrypted) };

    if (pickups.includes(tomorrow) && inService(tomorrow)) {
      out.push({ ...base, type: "out", visitDate: date, pickupDate: tomorrow, paused: isPaused(tomorrow), visit: visitFor("out") });
    }
    if (pickups.includes(date) && inService(date) && sub?.plan !== "push_out") {
      back.push({ ...base, type: "back", visitDate: date, pickupDate: date, paused: isPaused(date), visit: visitFor("back") });
    }
  }

  const byZip = (a: Stop, b: Stop) => a.address.zip.localeCompare(b.address.zip) || a.address.street.localeCompare(b.address.street);
  return {
    date,
    out: out.sort(byZip),
    back: back.sort(byZip),
    shiftsApplied: (shifts as ShiftRow[]).filter((s) => s.date <= tomorrow && s.date >= addDays(date, -7)),
    notActiveYet: notActive.count ?? 0,
  };
}

export const groupByZip = (stops: Stop[]) =>
  stops.reduce<Record<string, Stop[]>>((acc, s) => {
    (acc[s.address.zip] ??= []).push(s);
    return acc;
  }, {});

export const mapLink = (a: Pick<AddressRow, "street" | "city" | "zip">) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a.street}, ${a.city}, CA ${a.zip}`)}`;
