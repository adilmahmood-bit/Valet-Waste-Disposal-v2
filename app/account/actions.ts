"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, must } from "@/lib/residential/db";
import { addTeamMember, createRequest, overflowEstimate, removeTeamMember } from "@/lib/residential/portal-requests";
import {
  PASSWORD_MIN,
  removePassword,
  requestSignInLink,
  requireCustomer,
  setPassword,
  signInWithPassword,
  signInWithToken,
  signOut,
} from "@/lib/residential/portal-auth";

type FormState = { sent?: boolean; done?: boolean; error?: string } | null;

export async function sendLink(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "");
  try {
    await requestSignInLink(email);
  } catch (e) {
    console.error("[account] sign-in link failed", e);
    return { error: "Something went wrong on our end. Please try again, or call or text us." };
  }
  // Same answer whether or not the email has an account.
  return { sent: true };
}

export async function passwordSignIn(_prev: FormState, form: FormData): Promise<FormState> {
  const result = await signInWithPassword(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
  if (result === "locked") return { error: "Too many tries. Wait 15 minutes, or sign in with an email link instead." };
  if (result === "wrong") return { error: "That email and password don't match. You can also sign in with an email link." };
  redirect("/account");
}

export async function confirmSignIn(form: FormData) {
  const ok = await signInWithToken(String(form.get("t") ?? ""));
  redirect(ok ? "/account" : "/account/login?expired=1");
}

export async function savePassword(_prev: FormState, form: FormData): Promise<FormState> {
  const customer = await requireCustomer();
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (password.length < PASSWORD_MIN) return { error: `Use at least ${PASSWORD_MIN} characters.` };
  if (password.length > 200) return { error: "That password is too long." };
  if (password !== confirm) return { error: "The two passwords don't match." };
  if (password.trim().toLowerCase() === customer.email) return { error: "Don't use your email as your password." };
  await setPassword(customer, password);
  revalidatePath("/account");
  return { done: true };
}

export async function deletePassword() {
  const customer = await requireCustomer();
  await removePassword(customer);
  revalidatePath("/account");
}

export async function saveAlerts(form: FormData) {
  const customer = await requireCustomer();
  must(
    await db()
      .from("res_customers")
      .update({ alert_out: form.get("alert_out") === "on", alert_back: form.get("alert_back") === "on" })
      .eq("id", customer.id),
  );
  revalidatePath("/account");
}

export async function signOutAction() {
  await signOut();
  redirect("/account/login");
}

// ---------- portal requests (Adil approves before anything changes) ----------

export type FormResult = { ok?: boolean; error?: string } | null;

const str = (f: FormData, k: string, max = 500) => String(f.get(k) ?? "").trim().slice(0, max);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

async function attempt(fn: () => Promise<void>): Promise<FormResult> {
  try {
    await fn();
    revalidatePath("/account");
    return { ok: true };
  } catch (e) {
    console.error("[account] request failed", e);
    return { error: e instanceof Error && !/supabase|relation|column/i.test(e.message) ? e.message : "Something went wrong. Please try again, or call or text us." };
  }
}

export async function requestAccessChange(_prev: FormResult, f: FormData): Promise<FormResult> {
  const c = await requireCustomer();
  const notes = str(f, "access_notes", 1000);
  const gate = str(f, "gate_code", 40);
  return attempt(() => createRequest(c, "access", str(f, "address_id", 40), { access_notes: notes, gate_code: gate }));
}

export async function requestPause(_prev: FormResult, f: FormData): Promise<FormResult> {
  const c = await requireCustomer();
  const start = str(f, "start_date", 10);
  const end = str(f, "end_date", 10);
  if (!DATE.test(start) || !DATE.test(end) || end < start) return { error: "Pick a start date and an end date after it." };
  if ((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000 > 60) return { error: "A pause can be up to 60 days." };
  return attempt(() => createRequest(c, "pause", str(f, "address_id", 40), { start_date: start, end_date: end }));
}

export async function requestOverflow(_prev: FormResult, f: FormData): Promise<FormResult> {
  const c = await requireCustomer();
  if (c.overflow_first_can == null || c.overflow_per_bag == null) return { error: "Extra pickups aren't on your plan yet. Call or text us." };
  const bags = Math.max(1, Math.min(60, Math.round(Number(f.get("bags")) || 0)));
  const when = str(f, "when", 10) === "next" ? "next" : "24h";
  const photo = f.get("photo");
  let upload: { bytes: Buffer; type: string } | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith("image/") || photo.size > 1_000_000) return { error: "That photo couldn't be used. Try another, or skip it." };
    upload = { bytes: Buffer.from(await photo.arrayBuffer()), type: "image/jpeg" };
  }
  const estimate = overflowEstimate(c, bags);
  return attempt(() =>
    createRequest(c, "overflow", str(f, "address_id", 40), { bags, when: when === "24h" ? "within 24 hours" : "with next visit", notes: str(f, "notes"), estimate: estimate != null ? `$${estimate}` : "" }, upload),
  );
}

export async function requestAddProperty(_prev: FormResult, f: FormData): Promise<FormResult> {
  const c = await requireCustomer();
  const street = str(f, "street", 120);
  const city = str(f, "city", 60);
  const zip = str(f, "zip", 5);
  const day = str(f, "trash_day", 3);
  const bins = Math.max(1, Math.min(8, Math.round(Number(f.get("bins")) || 3)));
  if (!street || !city || !/^\d{5}$/.test(zip)) return { error: "Fill in the street, city and a 5-digit ZIP." };
  if (!["Mon", "Tue", "Wed", "Thu", "Fri"].includes(day)) return { error: "Pick a trash day." };
  return attempt(() =>
    createRequest(c, "add_property", null, { street, city, zip, trash_day: day, bins, access_notes: str(f, "access_notes"), gate_code: str(f, "gate_code", 40) }),
  );
}

export async function addTeamMemberAction(_prev: FormResult, f: FormData): Promise<FormResult> {
  const c = await requireCustomer();
  const name = str(f, "name", 80);
  const email = str(f, "email", 120).toLowerCase();
  const phone = str(f, "phone", 30);
  if (!name) return { error: "Add a name." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That email doesn't look right." };
  if (!email && !phone) return { error: "Add an email or a mobile number." };
  return attempt(() => addTeamMember(c.id, { name, email: email || null, phone: phone || null }));
}

export async function removeTeamMemberAction(f: FormData) {
  const c = await requireCustomer();
  await removeTeamMember(c.id, str(f, "id", 40));
  revalidatePath("/account");
}
