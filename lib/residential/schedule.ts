// Date math for trash days. Dates are plain "YYYY-MM-DD" strings in San Diego time;
// arithmetic happens in UTC on those strings so DST never shifts a day.

const DAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function todaySD(now = new Date()) {
  return now.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

const toUTC = (d: string) => new Date(`${d}T00:00:00Z`);
const fromUTC = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(d: string, n: number) {
  const x = toUTC(d);
  x.setUTCDate(x.getUTCDate() + n);
  return fromUTC(x);
}

export const weekdayIndex = (d: string) => toUTC(d).getUTCDay();

// Weeks run Sunday to Saturday, so a Friday holiday shift lands on Saturday of the same week.
export const weekStart = (d: string) => addDays(d, -weekdayIndex(d));

export function formatLong(d: string) {
  return toUTC(d).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" });
}

export const dayName = (d: string) => DAY_NAMES[weekdayIndex(d)];

export const fullDayName = (trashDay: string) => DAY_NAMES[DAY_INDEX[trashDay]];

export type Shift = { date: string; zips: string[]; shift_days: number };

const shiftApplies = (s: Shift, zip: string) => s.zips.length === 0 || s.zips.includes(zip);

// The actual pickup date for one week, after any holiday shift for that ZIP.
export function effectivePickup(trashDay: string, zip: string, week: string, shifts: Shift[]) {
  const nominal = addDays(week, DAY_INDEX[trashDay]);
  let moved = 0;
  for (const s of shifts) {
    if (shiftApplies(s, zip) && weekStart(s.date) === week && nominal >= s.date) moved += s.shift_days;
  }
  return addDays(nominal, moved);
}

// Pickup dates near `date` (previous, current and next week), shift-aware.
export function pickupsNear(trashDay: string, zip: string, date: string, shifts: Shift[]) {
  const w = weekStart(date);
  return [-7, 0, 7].map((n) => effectivePickup(trashDay, zip, addDays(w, n), shifts));
}

// First pickup at least `leadDays` after `from`. Bins go out the evening before.
export function firstServiceDate(trashDay: string, leadDays: number, from = todaySD()) {
  let d = addDays(from, leadDays);
  while (weekdayIndex(d) !== DAY_INDEX[trashDay]) d = addDays(d, 1);
  return d;
}
