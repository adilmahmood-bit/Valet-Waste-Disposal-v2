// Holiday dates for the trash holiday schedule on /residential/trash-day. Computed for the current
// year in San Diego time, so the page updates itself each January (the page revalidates daily).
import type { Holiday } from "./trashDay";

export const currentYear = () =>
  Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", year: "numeric" }).format(new Date()));

// The day someone last checked the trash day data (trashDay.ts, trashDayLookup.ts) against the
// cities' and haulers' own pages. Change it whenever you re-check or edit that data.
export const TRASH_DAY_CHECKED = "2026-11-23";

// "Last updated" date for trash day content (ISO): the last check, or January 1 once the year
// rolls over, since the holiday dates on the pages are recalculated for the new year then.
export const trashDayUpdated = () => {
  const jan1 = `${currentYear()}-01-01`;
  return jan1 > TRASH_DAY_CHECKED ? jan1 : TRASH_DAY_CHECKED;
};
// nth weekday (0 = Sunday) of a month; n = -1 for the last one.
function nthWeekday(year: number, month: number, weekday: number, n: number) {
  if (n > 0) {
    const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
    return new Date(Date.UTC(year, month, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7));
  }
  const last = new Date(Date.UTC(year, month + 1, 0));
  return new Date(Date.UTC(year, month, last.getUTCDate() - ((last.getUTCDay() - weekday + 7) % 7)));
}

export function holidayDate(h: Holiday, year: number): Date {
  switch (h) {
    case "newYears": return new Date(Date.UTC(year, 0, 1));
    case "mlk": return nthWeekday(year, 0, 1, 3);
    case "presidents": return nthWeekday(year, 1, 1, 3);
    case "memorial": return nthWeekday(year, 4, 1, -1);
    case "independence": return new Date(Date.UTC(year, 6, 4));
    case "labor": return nthWeekday(year, 8, 1, 1);
    case "veterans": return new Date(Date.UTC(year, 10, 11));
    case "thanksgiving": return nthWeekday(year, 10, 4, 4);
    case "christmas": return new Date(Date.UTC(year, 11, 25));
  }
}

export const formatHolidayDate = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" }).format(d);

export const isWeekend = (d: Date) => d.getUTCDay() === 0 || d.getUTCDay() === 6;

// "A, B and C"
export const joinNames = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
