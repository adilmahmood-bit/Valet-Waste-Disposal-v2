"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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

export async function signOutAction() {
  await signOut();
  redirect("/account/login");
}
