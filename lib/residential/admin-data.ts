import { db, must, type AddressRow, type CustomerRow, type PauseRow, type SubscriptionRow } from "./db";

export type CustomerFilters = { q?: string; zip?: string; status?: string; source?: string; ref?: string };

export type CustomerLine = AddressRow & {
  customer: CustomerRow;
  sub: SubscriptionRow | null;
  pauses: PauseRow[];
};

// One line per service address, with its customer, plan and pauses.
export async function loadCustomers(f: CustomerFilters): Promise<CustomerLine[]> {
  let query = db().from("res_addresses").select("*, customer:res_customers!inner(*)").order("created_at", { ascending: false });
  if (f.zip) query = query.eq("zip", f.zip);
  if (f.status) query = query.eq("status", f.status);
  if (f.source) query = query.eq("customer.source", f.source);
  if (f.ref) query = query.ilike("customer.referral_code", f.ref);
  const rows = must(await query) as (AddressRow & { customer: CustomerRow })[];

  const ids = rows.map((r) => r.id);
  const [subs, pauses] = ids.length
    ? await Promise.all([
        db().from("res_subscriptions").select("*").in("address_id", ids).then(must),
        db().from("res_pauses").select("*").in("address_id", ids).order("start_date").then(must),
      ])
    : [[], []];

  const q = f.q?.trim().toLowerCase();
  return rows
    .filter((r) => !q || [r.customer.name, r.customer.email, r.customer.mobile, r.street].some((v) => v?.toLowerCase().includes(q)))
    .map((r) => ({
      ...r,
      sub: (subs as SubscriptionRow[]).find((s) => s.address_id === r.id) ?? null,
      pauses: (pauses as PauseRow[]).filter((p) => p.address_id === r.id),
    }));
}

// Escape one CSV cell.
// Text that starts with = + - @ (or a tab/return) would run as a formula in Excel or Sheets, and
// names and notes come from public forms, so it gets a leading ' (shown as plain text).
// Plain numbers (including negatives) are left alone.
export const csvCell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (header: string[], rows: unknown[][]) => [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
