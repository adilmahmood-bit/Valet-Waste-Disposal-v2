import { db, must, type AddressRow, type PauseRow, type ShiftRow, type SubscriptionRow } from "./db";
import { resolvePhotoUrls } from "./photos";
import { addDays, effectivePickup, todaySD, weekStart } from "./schedule";

// Everything the customer portal (/account) shows, read from Supabase for one customer.
// Read-only: changes still go through Adil (call or text) or the admin tool.

export type PortalVisit = {
  type: "out" | "back";
  date: string;
  status: string; // done, missed, skipped, issue
  note: string | null;
  photoUrl: string | null;
  completedAt: string;
};

// One trash day: the evening the cans went out and the day they came back.
export type PortalService = {
  pickup: string;
  out: PortalVisit | null;
  back: PortalVisit | null;
};

export type UpcomingPickup = {
  pickup: string;
  shifted: boolean; // moved by a holiday
  paused: boolean;
};

export type PortalProperty = {
  address: AddressRow;
  sub: SubscriptionRow | null;
  hasGateCode: boolean;
  upcoming: UpcomingPickup[];
  thisWeek: PortalService | null; // the latest trash day, if it is today or yesterday
  history: PortalService[]; // newest first, earlier than thisWeek
  pauses: PauseRow[]; // current and future
};

const HISTORY_DAYS = 70;
const UPCOMING = 4;

export async function loadPortal(customerId: string): Promise<PortalProperty[]> {
  const addresses = must(
    await db().from("res_addresses").select("*").eq("customer_id", customerId).order("created_at"),
  ) as AddressRow[];
  if (!addresses.length) return [];
  const ids = addresses.map((a) => a.id);
  const today = todaySD();

  const [subs, pauses, shifts, visits] = await Promise.all([
    db().from("res_subscriptions").select("*").in("address_id", ids).order("created_at", { ascending: false }).then(must),
    db().from("res_pauses").select("*").in("address_id", ids).gte("end_date", today).order("start_date").then(must),
    db().from("res_service_shifts").select("*").gte("date", addDays(today, -HISTORY_DAYS - 7)).lte("date", addDays(today, 7 * (UPCOMING + 10))).then(must),
    db()
      .from("res_visits")
      .select("address_id, date, type, status, note, photo_url, completed_at")
      .in("address_id", ids)
      .gte("date", addDays(today, -HISTORY_DAYS))
      .order("date", { ascending: false })
      .then(must),
  ]);

  // Stored photos are private; swap in signed links that last an hour.
  const photoLinks = await resolvePhotoUrls((visits as { photo_url: string | null }[]).map((v) => v.photo_url));

  return addresses.map((address) => {
    const sub = (subs as SubscriptionRow[]).find((s) => s.address_id === address.id) ?? null;
    const myPauses = (pauses as PauseRow[]).filter((p) => p.address_id === address.id);
    const isPaused = (d: string) => myPauses.some((p) => p.start_date <= d && p.end_date >= d);

    // Next pickups from today on, after holiday shifts, inside the plan's dates.
    const upcoming: UpcomingPickup[] = [];
    const active = address.status === "active" || address.status === "paused" || address.status === "signed_up";
    if (active) {
      for (let w = 0; upcoming.length < UPCOMING && w < UPCOMING + 10; w++) {
        const week = addDays(weekStart(today), 7 * w);
        const pickup = effectivePickup(address.trash_day, address.zip, week, shifts as ShiftRow[]);
        const nominal = effectivePickup(address.trash_day, address.zip, week, []);
        if (pickup < today) continue;
        if (sub?.start_date && pickup < sub.start_date) continue;
        if (sub?.plan === "one_time" && sub.start_date && pickup !== sub.start_date) continue;
        upcoming.push({ pickup, shifted: pickup !== nominal, paused: address.status === "paused" || isPaused(pickup) });
      }
    }

    // Visits grouped by trash day: an "out" visit on date D is for the pickup on D + 1.
    const byPickup = new Map<string, PortalService>();
    for (const v of visits as (PortalVisit & { address_id: string; photo_url: string | null; completed_at: string })[]) {
      if (v.address_id !== address.id) continue;
      const pickup = v.type === "out" ? addDays(v.date, 1) : v.date;
      const entry = byPickup.get(pickup) ?? { pickup, out: null, back: null };
      entry[v.type] = { type: v.type, date: v.date, status: v.status, note: v.note, photoUrl: v.photo_url ? photoLinks.get(v.photo_url) ?? null : null, completedAt: v.completed_at };
      byPickup.set(pickup, entry);
    }
    const services = [...byPickup.values()].sort((a, b) => b.pickup.localeCompare(a.pickup));
    const latest = services[0];
    const current = latest && latest.pickup >= addDays(today, -1) ? latest : null;

    return {
      address,
      sub,
      hasGateCode: !!address.gate_code_encrypted,
      upcoming,
      thisWeek: current,
      history: current ? services.slice(1) : services,
      pauses: myPauses,
    };
  });
}

// "6:42 PM" in San Diego time.
export const timeSD = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" });

// "Tue, Nov 18" for a YYYY-MM-DD date.
export const shortDate = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" });
