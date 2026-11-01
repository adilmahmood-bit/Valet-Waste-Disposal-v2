import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/residential/admin-auth";
import { buildRoute } from "@/lib/residential/routes";
import { loadCustomers, toCsv } from "@/lib/residential/admin-data";
import { todaySD } from "@/lib/residential/schedule";
import { accessFlagLabel, planById, propertyTypeLabel, sourceLabel } from "@/config/residential";

const csv = (name: string, body: string) =>
  new NextResponse(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"` } });

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return new NextResponse("Not logged in", { status: 401 });
  const p = req.nextUrl.searchParams;

  if (p.get("type") === "routes") {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(p.get("date") ?? "") ? p.get("date")! : todaySD();
    const r = await buildRoute(date);
    const rows = [...r.out, ...r.back].map((s) => [
      s.type === "out" ? "Bins out" : "Bins back",
      s.pickupDate,
      s.address.zip,
      s.address.street,
      s.customer.name,
      s.customer.mobile,
      s.address.bins,
      planById(s.sub?.plan ?? "")?.name ?? "",
      s.gateCode ?? "",
      s.address.access_flags.map(accessFlagLabel).join("; "),
      s.address.access_notes ?? "",
      s.paused ? "paused" : "",
      s.visit?.status ?? "",
    ]);
    return csv(`route-${date}.csv`, toCsv(["Type", "Pickup", "ZIP", "Street", "Name", "Mobile", "Bins", "Plan", "Gate code", "Access", "Notes", "Paused", "Visit status"], rows));
  }

  if (p.get("type") === "customers") {
    const lines = await loadCustomers({
      q: p.get("q") ?? undefined,
      zip: p.get("zip") ?? undefined,
      status: p.get("status") ?? undefined,
      source: p.get("source") ?? undefined,
      ref: p.get("ref") ?? undefined,
    });
    const rows = lines.map((l) => [
      l.customer.name,
      l.customer.mobile,
      l.customer.email,
      propertyTypeLabel(l.customer.property_type),
      l.street,
      l.city,
      l.zip,
      l.trash_day,
      l.bins,
      planById(l.sub?.plan ?? "")?.name ?? "",
      l.sub?.price ?? "",
      l.sub?.start_date ?? "",
      l.status,
      sourceLabel(l.customer.source),
      l.customer.referral_code ?? "",
      l.customer.created_at.slice(0, 10),
    ]);
    return csv(
      `residential-customers-${todaySD()}.csv`,
      toCsv(["Name", "Mobile", "Email", "Property type", "Street", "City", "ZIP", "Trash day", "Bins", "Plan", "Price", "Start", "Status", "Source", "Promo code", "Created"], rows),
    );
  }

  return new NextResponse("Unknown export type", { status: 400 });
}
