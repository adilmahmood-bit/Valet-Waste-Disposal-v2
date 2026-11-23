import { isAdmin } from "@/lib/residential/admin-auth";
import { tripMiles, tripsForYear } from "@/lib/residential/mileage";

export const dynamic = "force-dynamic";

const KIND = { rollout: "Roll-out route", rollin: "Roll-ins", manual: "Other business trip" } as const;
const SOURCE = { routific: "Routific planned route distance", estimate: "Estimate from matching roll-out route", manual: "Entered by hand" } as const;
const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // Quote everything; neutralize leading formula characters so spreadsheets don't run them.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

// The year's mileage log as CSV for the accountant (Admin > Mileage > Download CSV).
export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Sign in to the ops site first.", { status: 401 });
  const y = new URL(req.url).searchParams.get("year") ?? "";
  const year = /^\d{4}$/.test(y) ? Number(y) : new Date().getFullYear();
  const trips = (await tripsForYear(year)).reverse(); // oldest first
  const daily = new URL(req.url).searchParams.get("view") === "daily";
  if (daily) {
    // One row per day: total miles, and the trips that make it up.
    const dates = [...new Set(trips.map((t) => t.date))];
    const rows = [
      ["Date", "Trips", "Roll-out miles", "Roll-in miles", "Other miles", "Total miles", "Business purpose"],
      ...dates.map((date) => {
        const list = trips.filter((t) => t.date === date);
        const sum = (k?: string) => list.filter((t) => !k || t.kind === k).reduce((n, t) => n + tripMiles(t), 0).toFixed(1);
        return [date, list.length, sum("rollout"), sum("rollin"), sum("manual"), sum(), list.map((t) => t.purpose).join(" | ")];
      }),
      [],
      ["Total", trips.length, "", "", "", trips.reduce((n, t) => n + tripMiles(t), 0).toFixed(1)],
    ];
    return csvResponse(rows, `doorstep-disposal-mileage-${year}-daily.csv`);
  }
  const rows = [
    ["Date", "Type", "Business purpose", "Starting point", "Destination", "Stops", "Miles", "How miles were measured", "Planned miles", "Driver", "Note"],
    ...trips.map((t) => [
      t.date,
      KIND[t.kind],
      t.purpose,
      t.start_address,
      t.end_address ?? t.start_address,
      t.stops,
      tripMiles(t).toFixed(1),
      t.actual_miles != null ? "Actual (odometer)" : SOURCE[t.source],
      t.planned_miles,
      t.driver,
      t.note,
    ]),
    [],
    ["Total", "", "", "", "", "", trips.reduce((n, t) => n + tripMiles(t), 0).toFixed(1)],
  ];
  return csvResponse(rows, `doorstep-disposal-mileage-${year}.csv`);
}

function csvResponse(rows: unknown[][], filename: string) {
  const csv = rows.map((r) => r.map(cell).join(",")).join("\r\n");
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
