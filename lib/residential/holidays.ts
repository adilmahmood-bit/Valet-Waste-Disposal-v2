import { holidayDate } from "@/components/residential/holidayDates";
import { holidayNames, trashCollectors, type Holiday, type TrashCollector } from "@/components/residential/trashDay";
import type { Shift } from "./schedule";

// Holiday weeks worked out from the trash-day guide (components/residential/trashDay.ts), so
// every city follows its own hauler: City of San Diego, EDCO, Republic, WM. A holiday on a
// weekday moves that day's pickup and the rest of the week one day later; weekend holidays
// don't move pickup (the rule WM and Republic state, and how the guide reads for the others).
// res_service_shifts stays for one-off changes on top of these.

const slug = (city: string) => city.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// The hauler for an address's city, or null when the guide doesn't cover that city yet.
export function collectorFor(city: string): TrashCollector | null {
  return trashCollectors[slug(city)] ?? null;
}

export type HolidayShift = Shift & { holiday: Holiday; name: string };

const cache = new Map<string, HolidayShift[]>();

// Every weekday holiday the city's hauler observes, last year through next year.
export function cityHolidayShifts(city: string, year = new Date().getUTCFullYear()): HolidayShift[] {
  const key = `${slug(city)}:${year}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = collectorFor(city);
  const out: HolidayShift[] = [];
  if (c) {
    for (const y of [year - 1, year, year + 1]) {
      for (const h of c.holidaysObserved) {
        const d = holidayDate(h, y);
        const dow = d.getUTCDay();
        if (dow === 0 || dow === 6) continue;
        out.push({ date: d.toISOString().slice(0, 10), zips: [], shift_days: 1, holiday: h, name: holidayNames[h] });
      }
    }
  }
  cache.set(key, out);
  return out;
}

// The holiday that moves a pickup, if any: the latest observed weekday holiday in the same
// Sunday-to-Saturday week, on or before the nominal pickup day.
export function holidayMoving(city: string, nominalPickup: string, weekStartDate: string): HolidayShift | null {
  const year = Number(nominalPickup.slice(0, 4));
  return (
    cityHolidayShifts(city, year)
      .filter((s) => s.date >= weekStartDate && s.date <= nominalPickup)
      .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
  );
}
