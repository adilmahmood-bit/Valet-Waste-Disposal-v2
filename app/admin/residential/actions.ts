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
import { catchUpRouteMileage, syncRollinTrips } from "@/lib/residential/mileage";
import { SITE } from "@/lib/blog";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

// After 5 wrong passwords in a row the admin login locks for 15 minutes (counted in the database,
// so guesses sent at once can't slip past it).
const ADMIN_MAX_FAILED = 5;
const ADMIN_LOCK_MINUTES = 15;
const LOCKED_MSG = `Too many wrong passwords. Try again in ${ADMIN_LOCK_MINUTES} minutes.`;

export async function login(_: unknown, f: FormData) {
  const locked = await db().rpc("res_admin_login_locked");
  if (locked.error) throw new Error(locked.error.message);
  if (locked.data) return { error: LOCKED_MSG };
  if (!passwordMatches(s(f, "password"))) {
    const failed = await db().rpc("res_admin_login_failed", { p_max: ADMIN_MAX_FAILED, p_minutes: ADMIN_LOCK_MINUTES });
    if (failed.error) throw new Error(failed.error.message);
    return { error: failed.data ? LOCKED_MSG : "Wrong password." };
  }
  await db().rpc("res_admin_login_ok");
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
  const addressId = s(f, "address_id");
  const date = s(f, "date");
  if (!VISIT_STATUSES.includes(status) || !["out", "back"].includes(type) || !addressId || !DATE_RE.test(date)) return;
  const note = s(f, "note") || null;
  const existing = must(
    await db().from("res_visits").select("id, status").eq("address_id", addressId).eq("date", date).eq("type", type).maybeSingle(),
  ) as { id: string; status: string } | null;
  if (existing) {
    // Editing a recorded visit (a note, or done -> issue) keeps when it happened and who did it:
    // the portal shows that time and stamps it on the customer's photo. Only a visit that
    // becomes "done" now takes the current time.
    const becameDone = status === "done" && existing.status !== "done";
    must(
      await db()
        .from("res_visits")
        .update({ status, note, ...(becameDone ? { completed_by: "admin", completed_at: new Date().toISOString() } : {}) })
        .eq("id", existing.id),
    );
  } else {
    must(
      await db()
        .from("res_visits")
        .insert({ address_id: addressId, date, type, status, note, completed_by: "admin", completed_at: new Date().toISOString() }),
    );
  }
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
  after(async () => {
    await notifyVisit(addressId, "back", status, note);
    await syncRollinTrips().catch((e) => console.error("[mileage] roll-in log failed", e));
  });
  refresh();
}

// ---------- Mileage log ----------

const MILES_RE = /^\d{1,4}(\.\d)?$/;
const mileageBack = (year: string, msg: string, error = false) =>
  redirect(`/admin/residential/mileage?year=${year}&${error ? "err" : "msg"}=${encodeURIComponent(msg.slice(0, 300))}`);

// Actual (odometer) miles and a note for any trip. Blank miles = use the planned/estimate.
export async function saveTripActual(f: FormData) {
  await requireAdmin();
  const id = s(f, "id");
  const year = s(f, "year") || todaySDForAdmin().slice(0, 4);
  const miles = s(f, "actual_miles");
  if (miles && !MILES_RE.test(miles)) return mileageBack(year, "Miles must be a number like 48 or 48.5.", true);
  must(
    await db()
      .from("res_mileage_trips")
      .update({ actual_miles: miles ? Number(miles) : null, note: s(f, "note") || null, updated_at: new Date().toISOString() })
      .eq("id", id),
  );
  return mileageBack(year, "Saved.");
}

export async function addManualTrip(f: FormData) {
  await requireAdmin();
  const date = s(f, "date");
  const year = date.slice(0, 4) || todaySDForAdmin().slice(0, 4);
  const miles = s(f, "miles");
  const purpose = s(f, "purpose");
  if (!DATE_RE.test(date)) return mileageBack(year, "Pick a date.", true);
  if (!purpose) return mileageBack(year, "Add the business purpose (e.g. supply run, client meeting).", true);
  if (!MILES_RE.test(miles)) return mileageBack(year, "Miles must be a number like 12 or 12.5.", true);
  must(
    await db().from("res_mileage_trips").insert({
      date,
      kind: "manual",
      source: "manual",
      purpose: purpose.slice(0, 300),
      start_address: s(f, "start_address").slice(0, 200) || null,
      end_address: s(f, "end_address").slice(0, 200) || null,
      actual_miles: Number(miles),
      note: s(f, "note").slice(0, 300) || null,
    }),
  );
  return mileageBack(year, "Trip added.");
}

export async function deleteManualTrip(f: FormData) {
  await requireAdmin();
  const year = s(f, "year") || todaySDForAdmin().slice(0, 4);
  must(await db().from("res_mileage_trips").delete().eq("id", s(f, "id")).eq("kind", "manual"));
  return mileageBack(year, "Trip deleted.");
}

export async function saveMileageRate(f: FormData) {
  await requireAdmin();
  const year = s(f, "year") || todaySDForAdmin().slice(0, 4);
  const rate = s(f, "rate");
  if (rate && !/^\d(\.\d{1,3})?$/.test(rate)) return mileageBack(year, "Rate must look like 0.70 (dollars per mile).", true);
  must(
    await db()
      .from("res_app_state")
      .upsert({ key: "mileage_rate", value: rate ? { rate: Number(rate) } : {}, updated_at: new Date().toISOString() }),
  );
  return mileageBack(year, rate ? "Rate saved." : "Rate cleared.");
}

// Pulls in finished Routific routes and roll-in days now (they also arrive on their own).
export async function refreshMileage(f: FormData) {
  await requireAdmin();
  const year = s(f, "year") || todaySDForAdmin().slice(0, 4);
  const added = await catchUpRouteMileage(30);
  await syncRollinTrips(30);
  return mileageBack(year, `Up to date${added ? `: ${added} route${added === 1 ? "" : "s"} added` : ""}.`);
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
    if (r.routing.length) note += ` ${r.routing.map((n) => n.replace(/^! /, "")).join(" ")}`;
    if (r.routing.some((n) => n.startsWith("!"))) failed = true;
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
  if (date && (!DATE_RE.test(date) || !TIME_RE.test(start) || !TIME_RE.test(end) || end <= start)) {
    return toRequests("Pick a day and a time window with the start before the end.", true);
  }
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
  const group = String(f.get("group") ?? "") || null;
  const c = must(await db().from("res_customers").select("name").eq("id", id).single()) as { name: string };
  let to: string;
  try {
    const base = process.env.NODE_ENV === "production" ? SITE : "http://localhost:3000";
    const { url } = await clientCheckoutUrl(id, `${base}/account?tab=billing`, group);
    to = `/admin/residential/billing?link=${encodeURIComponent(url)}&for=${encodeURIComponent(group ? `${c.name}: ${group}` : c.name)}`;
  } catch (e) {
    to = `/admin/residential/billing?err=${encodeURIComponent((e instanceof Error ? e.message : String(e)).slice(0, 300))}`;
  }
  redirect(to);
}
