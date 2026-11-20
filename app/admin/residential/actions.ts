"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { residential } from "@/config/residential";
import { db, must, type AddressStatus } from "@/lib/residential/db";
import { requireAdmin, passwordMatches, startAdminSession, endAdminSession } from "@/lib/residential/admin-auth";
import { syncCustomer, retrySync, pullContacts, addNote } from "@/lib/residential/hubspot";
import { firstServiceDate, todaySD as todaySDForAdmin } from "@/lib/residential/schedule";
import { routificConfigured } from "@/lib/residential/routific";
import { addOneOff, pushRollouts, removeOrders, syncRoutific, type OneOffKind } from "@/lib/residential/routific-sync";
import { saveVisitPhoto } from "@/lib/residential/photos";
import { notifyVisit } from "@/lib/residential/visit-notify";
import { acceptRequest, declineRequest } from "@/lib/residential/portal-requests";
import { clientCheckoutUrl } from "@/lib/residential/client-billing";
import { SITE } from "@/lib/blog";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function login(_: unknown, f: FormData) {
  if (!passwordMatches(s(f, "password"))) return { error: "Wrong password." };
  await startAdminSession();
  redirect("/admin/residential");
}

export async function logout() {
  await endAdminSession();
  redirect("/admin/residential/login");
}

const VISIT_STATUSES = ["done", "missed", "skipped", "issue"];

export async function markVisit(f: FormData) {
  await requireAdmin();
  const status = s(f, "status");
  const type = s(f, "type");
  if (!VISIT_STATUSES.includes(status) || !["out", "back"].includes(type)) return;
  must(
    await db()
      .from("res_visits")
      .upsert(
        { address_id: s(f, "address_id"), date: s(f, "date"), type, status, note: s(f, "note") || null, completed_by: "admin", completed_at: new Date().toISOString() },
        { onConflict: "address_id,date,type" },
      ),
  );
  refresh();
}

const ADDRESS_STATUSES: AddressStatus[] = ["quote_needed", "signed_up", "active", "paused", "cancelled"];

async function customerOf(addressId: string) {
  return (must(await db().from("res_addresses").select("customer_id").eq("id", addressId).single()) as { customer_id: string }).customer_id;
}

export async function setAddressStatus(f: FormData) {
  await requireAdmin();
  const id = s(f, "address_id");
  const status = s(f, "status") as AddressStatus;
  if (!ADDRESS_STATUSES.includes(status)) return;
  must(await db().from("res_addresses").update({ status }).eq("id", id));
  const customerId = await customerOf(id);
  after(() => syncCustomer(customerId));
  after(() => routificSyncQuietly("status change"));
  refresh();
}

export async function addPause(f: FormData) {
  await requireAdmin();
  const start = s(f, "start_date");
  const end = s(f, "end_date") || start;
  if (!start || end < start) return;
  must(await db().from("res_pauses").insert({ address_id: s(f, "address_id"), start_date: start, end_date: end }));
  after(() => routificSyncQuietly("pause added"));
  refresh();
}

export async function deletePause(f: FormData) {
  await requireAdmin();
  must(await db().from("res_pauses").delete().eq("id", s(f, "id")));
  after(() => routificSyncQuietly("pause removed"));
  refresh();
}

export async function setQuotePrice(f: FormData) {
  await requireAdmin();
  const price = Number(s(f, "price"));
  if (!(price > 0)) return;
  const q = must(await db().from("res_quote_requests").update({ quoted_price: price, status: "quoted" }).eq("id", s(f, "id")).select("address_id").single()) as { address_id: string };
  must(await db().from("res_subscriptions").update({ price }).eq("address_id", q.address_id));
  const customerId = await customerOf(q.address_id);
  after(() => syncCustomer(customerId));
  refresh();
}

// Customer approved the quoted price: the address joins the normal signed-up flow.
export async function acceptQuote(f: FormData) {
  await requireAdmin();
  const q = must(await db().from("res_quote_requests").update({ status: "accepted" }).eq("id", s(f, "id")).select("address_id, quoted_price").single()) as { address_id: string; quoted_price: number | null };
  const a = must(await db().from("res_addresses").update({ status: "signed_up" }).eq("id", q.address_id).select("trash_day, customer_id").single()) as { trash_day: string; customer_id: string };
  must(await db().from("res_subscriptions").update({ start_date: firstServiceDate(a.trash_day, residential.startLeadDays) }).eq("address_id", q.address_id));
  after(async () => {
    const contactId = await syncCustomer(a.customer_id);
    if (contactId) await addNote(contactId, `Accepted quoted price $${q.quoted_price ?? "?"}/month.`, `address:${q.address_id}`).catch(() => {});
  });
  refresh();
}

export async function declineQuote(f: FormData) {
  await requireAdmin();
  const q = must(await db().from("res_quote_requests").update({ status: "declined" }).eq("id", s(f, "id")).select("address_id").single()) as { address_id: string };
  must(await db().from("res_addresses").update({ status: "cancelled" }).eq("id", q.address_id));
  const customerId = await customerOf(q.address_id);
  after(() => syncCustomer(customerId));
  refresh();
}

export async function addShift(f: FormData) {
  await requireAdmin();
  const date = s(f, "date");
  const zips = s(f, "zips").split(/[\s,]+/).map((z) => z.replace(/\D/g, "")).filter((z) => z.length === 5);
  const shiftDays = Number(s(f, "shift_days") || 1);
  if (!date || !Number.isInteger(shiftDays)) return;
  must(await db().from("res_service_shifts").insert({ date, zips, shift_days: shiftDays, note: s(f, "note") || null }));
  refresh();
}

export async function deleteShift(f: FormData) {
  await requireAdmin();
  must(await db().from("res_service_shifts").delete().eq("id", s(f, "id")));
  refresh();
}

export async function retryHubSpot(f: FormData) {
  await requireAdmin();
  await retrySync(s(f, "local_ref"));
  refresh();
}

export async function pullFromHubSpot() {
  await requireAdmin();
  await pullContacts();
  refresh();
}

// ---------- Routific ----------

async function saveLastSync(result: Awaited<ReturnType<typeof syncRoutific>>, by: string) {
  await db().from("res_app_state").upsert({ key: "routific_last_sync", value: { ...result, by }, updated_at: new Date().toISOString() });
}

// After a pause or status change, so tonight's Routific orders match. Errors only get logged:
// the admin change itself already succeeded.
async function routificSyncQuietly(by: string) {
  if (!routificConfigured()) return;
  try {
    await saveLastSync(await syncRoutific(), by);
  } catch (e) {
    console.error("[routific] sync after change failed", e);
  }
}

export async function runRoutificSync() {
  await requireAdmin();
  await saveLastSync(await syncRoutific(), "admin button");
  refresh();
}

// ---------- crew roll-ins ----------

export async function markRollIn(f: FormData) {
  await requireAdmin();
  const addressId = s(f, "address_id");
  const date = s(f, "date");
  const status = s(f, "status");
  if (!addressId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !["done", "issue"].includes(status)) throw new Error("Missing details.");
  const note = s(f, "note") || null;

  let photoUrl: string | null = null;
  const photo = f.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith("image/")) throw new Error("That file isn't a photo.");
    const bytes = Buffer.from(await photo.arrayBuffer());
    photoUrl = await saveVisitPhoto(`${addressId}/${date}-back-${Date.now()}.jpg`, bytes, "image/jpeg");
  }

  must(
    await db()
      .from("res_visits")
      .upsert(
        { address_id: addressId, date, type: "back", status, note, photo_url: photoUrl, completed_by: "crew", completed_at: new Date().toISOString() },
        { onConflict: "address_id,date,type" },
      ),
  );
  after(() => notifyVisit(addressId, "back", status, note));
  refresh();
}

// ---------- Routific dispatch dashboard ----------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const back = (date: string, msg: string, error = false) =>
  redirect(`/admin/residential/routific?date=${date}&${error ? "err" : "msg"}=${encodeURIComponent(msg.slice(0, 400))}`);

export async function pushSelectedRollouts(f: FormData) {
  await requireAdmin();
  const date = s(f, "date");
  const ids = f.getAll("address_id").map(String).filter(Boolean);
  if (!DATE_RE.test(date)) return back(todaySDForAdmin(), "Pick a date first.", true);
  if (!ids.length) return back(date, "Tick at least one roll-out to push.", true);
  let note: string;
  let failed = false;
  try {
    const r = await pushRollouts(date, ids);
    note = `Sent ${r.create.length} new and ${r.update.length} updated roll-outs to Routific; ${r.keep.length} were already there.`;
    if (r.errors.length) {
      note += ` Problems: ${r.errors.join("; ")}`;
      failed = true;
    }
  } catch (e) {
    note = e instanceof Error ? e.message : String(e);
    failed = true;
  }
  back(date, note, failed);
}

export async function removeSelectedOrders(f: FormData) {
  await requireAdmin();
  const date = s(f, "date");
  const ids = f.getAll("order_id").map(String).filter(Boolean);
  if (!ids.length) return back(date, "Tick at least one stop to remove.", true);
  const errors = await removeOrders(ids);
  back(date, errors.length ? `Some stops weren't removed: ${errors.join("; ")}` : `Removed ${ids.length} from Routific.`, errors.length > 0);
}

export async function addOneOffStop(f: FormData) {
  await requireAdmin();
  const date = s(f, "date");
  const kind = s(f, "kind") as OneOffKind;
  const start = s(f, "start");
  const end = s(f, "end");
  const addressId = s(f, "address_id");
  if (!DATE_RE.test(date) || !addressId || !["extra", "rollin", "rollout"].includes(kind)) return back(date || todaySDForAdmin(), "Fill in the property, type and date.", true);
  if (!TIME_RE.test(start) || !TIME_RE.test(end) || end <= start) return back(date, "The time window needs a start before its end.", true);
  let note: string;
  let failed = false;
  try {
    const num = await addOneOff({ addressId, date, kind, start, end, notes: s(f, "notes") || null });
    note = `Added ${num} to Routific.`;
  } catch (e) {
    note = e instanceof Error ? e.message : String(e);
    failed = true;
  }
  back(date, note, failed);
}

// ---------- portal requests ----------

const toRequests = (msg: string, error = false) =>
  redirect(`/admin/residential/requests?${error ? "err" : "msg"}=${encodeURIComponent(msg.slice(0, 400))}`);

export async function acceptPortalRequest(f: FormData) {
  await requireAdmin();
  const id = s(f, "id");
  const date = s(f, "date");
  const start = s(f, "start");
  const end = s(f, "end");
  let note: string;
  let failed = false;
  try {
    await acceptRequest(id, date ? { date, start, end } : undefined);
    note = "Accepted and applied.";
  } catch (e) {
    note = e instanceof Error ? e.message : String(e);
    failed = true;
  }
  toRequests(note, failed);
}

export async function declinePortalRequest(f: FormData) {
  await requireAdmin();
  await declineRequest(s(f, "id"), s(f, "note") || null);
  toRequests("Declined.");
}

// ---------- Stripe autopay for customers ----------

export async function makeClientPaymentLink(f: FormData) {
  await requireAdmin();
  const id = s(f, "customer_id");
  const c = must(await db().from("res_customers").select("name").eq("id", id).single()) as { name: string };
  let to: string;
  try {
    const base = process.env.NODE_ENV === "production" ? SITE : "http://localhost:3000";
    const { url } = await clientCheckoutUrl(id, `${base}/account?tab=billing`);
    to = `/admin/residential/billing?link=${encodeURIComponent(url)}&for=${encodeURIComponent(c.name)}`;
  } catch (e) {
    to = `/admin/residential/billing?err=${encodeURIComponent((e instanceof Error ? e.message : String(e)).slice(0, 300))}`;
  }
  redirect(to);
}
