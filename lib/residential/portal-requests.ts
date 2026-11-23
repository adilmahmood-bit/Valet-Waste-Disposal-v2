import { randomBytes } from "node:crypto";
import { residential } from "@/config/residential";
import { SITE } from "@/lib/blog";
import { encryptGateCode } from "./crypto";
import { db, must, type AddressRow, type CustomerRow } from "./db";
import { sendEmail } from "./email";
import { saveVisitPhoto } from "./photos";
import { addOneOff, syncRoutific } from "./routific-sync";

// Requests customers make in the portal. Nothing changes routes until Adil accepts one in
// the admin Requests tab; then it's applied (extra pickup -> Routific stop, access -> the
// property, pause -> res_pauses, new property -> a signed-up address).

export type RequestKind = "overflow" | "access" | "pause" | "add_property";
export type PortalRequest = {
  id: string;
  customer_id: string;
  address_id: string | null;
  kind: RequestKind;
  details: Record<string, unknown>;
  photo_url: string | null;
  status: "open" | "accepted" | "declined";
  admin_note: string | null;
  created_at: string;
  decided_at: string | null;
};

export const REQUEST_LABEL: Record<RequestKind, string> = {
  overflow: "Extra trash pickup",
  access: "Access change",
  pause: "Pause",
  add_property: "New property",
};

// Bags of 13 gallons; the first full can (7 bags) is the minimum.
export function overflowEstimate(c: { overflow_first_can: number | null; overflow_per_bag: number | null }, bags: number) {
  if (c.overflow_first_can == null || c.overflow_per_bag == null) return null;
  return Number(c.overflow_first_can) + Math.max(0, bags - 7) * Number(c.overflow_per_bag);
}

async function ownAddress(customerId: string, addressId: string) {
  return must(
    await db().from("res_addresses").select("*").eq("id", addressId).eq("customer_id", customerId).maybeSingle(),
  ) as AddressRow | null;
}

export async function createRequest(
  customer: Pick<CustomerRow, "id" | "name" | "email">,
  kind: RequestKind,
  addressId: string | null,
  details: Record<string, unknown>,
  photo?: { bytes: Buffer; type: string } | null,
) {
  let address: AddressRow | null = null;
  if (addressId) {
    address = await ownAddress(customer.id, addressId);
    if (!address) throw new Error("That property isn't on your account.");
  }
  const clean = { ...details };
  // Gate codes are stored encrypted, like on the property itself.
  if (typeof clean.gate_code === "string" && clean.gate_code) {
    clean.gate_code_encrypted = encryptGateCode(clean.gate_code);
    delete clean.gate_code;
  }
  let photoUrl: string | null = null;
  if (photo) photoUrl = await saveVisitPhoto(`requests/${customer.id}/${Date.now()}-${randomBytes(3).toString("hex")}.jpg`, photo.bytes, photo.type);

  must(await db().from("res_portal_requests").insert({ customer_id: customer.id, address_id: addressId, kind, details: clean, photo_url: photoUrl }));

  const where = address ? `${address.street}, ${address.city}` : String(details.street ?? "");
  const lines = Object.entries(details)
    .filter(([k, v]) => v !== "" && v != null && k !== "gate_code")
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`);
  if (details.gate_code) lines.push("gate code: (new code given, see admin)");
  await sendEmail(
    residential.notifyEmail,
    `Portal request: ${REQUEST_LABEL[kind]} at ${where} (${customer.name})`,
    [`${customer.name} (${customer.email}) asked for: ${REQUEST_LABEL[kind]}`, where, "", ...lines, "", `Review it: ${SITE}/admin/residential/requests`].join("\n"),
  );
}

export async function customerRequests(customerId: string) {
  return must(
    await db().from("res_portal_requests").select("*").eq("customer_id", customerId).order("created_at", { ascending: false }).limit(30),
  ) as PortalRequest[];
}

export async function openRequests() {
  return must(
    await db()
      .from("res_portal_requests")
      .select("*, customer:res_customers(name, email, mobile), address:res_addresses(street, city, zip)")
      .order("status")
      .order("created_at", { ascending: false })
      .limit(100),
  ) as (PortalRequest & { customer: { name: string; email: string; mobile: string }; address: { street: string; city: string; zip: string } | null })[];
}

async function decide(id: string, status: "accepted" | "declined", note: string | null) {
  must(await db().from("res_portal_requests").update({ status, admin_note: note, decided_at: new Date().toISOString() }).eq("id", id).eq("status", "open"));
}

// Applies an open request. `stop` is needed for extra pickups: the day and window Adil picked.
export async function acceptRequest(id: string, stop?: { date: string; start: string; end: string }) {
  const r = must(await db().from("res_portal_requests").select("*").eq("id", id).single()) as PortalRequest;
  if (r.status !== "open") throw new Error("That request was already handled.");
  if (r.kind === "overflow" && (!r.address_id || !stop)) throw new Error("Pick a day and time window for the pickup.");
  // Claim it first (open -> accepted in one update), so a double-click or a second tab can't
  // apply it twice (two Routific stops, or the property added twice). Reopened if applying fails.
  const claimed = must(
    await db().from("res_portal_requests").update({ status: "accepted", decided_at: new Date().toISOString() }).eq("id", id).eq("status", "open").select("id"),
  ) as { id: string }[];
  if (!claimed.length) throw new Error("That request was already handled.");
  try {
    await applyRequest(r, stop);
  } catch (e) {
    await db().from("res_portal_requests").update({ status: "open", decided_at: null }).eq("id", id);
    throw e;
  }
}

async function applyRequest(r: PortalRequest, stop?: { date: string; start: string; end: string }) {
  const id = r.id;
  const d = r.details as Record<string, string | number | undefined>;
  let note: string | null = null;

  if (r.kind === "overflow") {
    if (!r.address_id || !stop) throw new Error("Pick a day and time window for the pickup.");
    const num = await addOneOff({
      addressId: r.address_id,
      date: stop.date,
      kind: "extra",
      start: stop.start,
      end: stop.end,
      notes: [`${d.bags ?? "?"} bags`, d.notes ? String(d.notes) : null].filter(Boolean).join(". "),
    });
    note = `Scheduled as ${num} on ${stop.date}`;
  } else if (r.kind === "access") {
    if (!r.address_id) throw new Error("No property on this request.");
    const update: Record<string, string | null> = {};
    if (typeof d.access_notes === "string") update.access_notes = d.access_notes || null;
    if (typeof d.gate_code_encrypted === "string") update.gate_code_encrypted = d.gate_code_encrypted;
    if (Object.keys(update).length) must(await db().from("res_addresses").update(update).eq("id", r.address_id));
  } else if (r.kind === "pause") {
    if (!r.address_id || !d.start_date || !d.end_date) throw new Error("The pause dates are missing.");
    must(await db().from("res_pauses").insert({ address_id: r.address_id, start_date: d.start_date, end_date: d.end_date }));
  } else if (r.kind === "add_property") {
    const ins = must(
      await db()
        .from("res_addresses")
        .insert({
          customer_id: r.customer_id,
          street: String(d.street ?? ""),
          city: String(d.city ?? "San Diego"),
          zip: String(d.zip ?? ""),
          trash_day: String(d.trash_day ?? "Mon"),
          bins: Number(d.bins ?? 3),
          access_notes: d.access_notes ? String(d.access_notes) : null,
          gate_code_encrypted: typeof d.gate_code_encrypted === "string" ? d.gate_code_encrypted : null,
          status: "signed_up",
        })
        .select("id")
        .single(),
    ) as { id: string };
    // Same plan and price as the customer's other properties, until Adil sets otherwise.
    const prev = must(
      await db().from("res_subscriptions").select("plan, price, address:res_addresses!inner(customer_id)").eq("address.customer_id", r.customer_id).limit(1),
    ) as { plan: string; price: number }[];
    must(
      await db().from("res_subscriptions").insert({ address_id: ins.id, plan: prev[0]?.plan ?? "weekly", price: prev[0]?.price ?? 0, status: "pending_billing" }),
    );
    note = "Added as signed up. Set a start date and make it active on the Customers tab.";
  }

  if (note) must(await db().from("res_portal_requests").update({ admin_note: note }).eq("id", id));
  // Access changes and pauses can change tonight's Routific orders.
  if (r.kind === "access" || r.kind === "pause") {
    try {
      await syncRoutific();
    } catch (e) {
      console.error("[requests] Routific sync after accept failed", e);
    }
  }
}

export async function declineRequest(id: string, note: string | null) {
  await decide(id, "declined", note);
}

// ---------- team ----------

export type TeamMember = { id: string; name: string; email: string | null; phone: string | null };

export async function teamFor(customerId: string) {
  return must(await db().from("res_team_members").select("id, name, email, phone").eq("customer_id", customerId).order("created_at")) as TeamMember[];
}

export async function addTeamMember(customerId: string, m: { name: string; email: string | null; phone: string | null }) {
  const count = (await db().from("res_team_members").select("id", { count: "exact", head: true }).eq("customer_id", customerId)).count ?? 0;
  if (count >= 10) throw new Error("You can add up to 10 people.");
  must(await db().from("res_team_members").insert({ customer_id: customerId, ...m }));
}

export async function removeTeamMember(customerId: string, id: string) {
  must(await db().from("res_team_members").delete().eq("id", id).eq("customer_id", customerId));
}

// ---------- referrals ----------

// The customer's own code for /r?ref=<code>, made on first use: first name plus 4 characters.
export async function referralCodeFor(c: Pick<CustomerRow, "id" | "name"> & { my_referral_code?: string | null }) {
  if (c.my_referral_code) return c.my_referral_code;
  const base = (c.name.split(" ")[0] || "friend").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "friend";
  for (let i = 0; i < 5; i++) {
    const code = `${base}-${randomBytes(2).toString("hex")}`;
    const res = await db().from("res_customers").update({ my_referral_code: code }).eq("id", c.id).is("my_referral_code", null).select("my_referral_code");
    if (!res.error && res.data?.length) return code;
    if (!res.error) {
      const now = must(await db().from("res_customers").select("my_referral_code").eq("id", c.id).single()) as { my_referral_code: string | null };
      if (now.my_referral_code) return now.my_referral_code;
    }
  }
  throw new Error("Couldn't make a referral code.");
}

// People who signed up with this code. First name and status only.
export async function referralsFor(code: string) {
  const rows = must(
    await db().from("res_customers").select("name, created_at, addresses:res_addresses(status)").eq("referral_code", code).order("created_at", { ascending: false }),
  ) as { name: string; created_at: string; addresses: { status: string }[] }[];
  return rows.map((r) => ({
    name: `${r.name.split(" ")[0]} ${r.name.split(" ")[1]?.[0] ?? ""}`.trim(),
    since: r.created_at,
    active: r.addresses.some((a) => a.status === "active"),
  }));
}
