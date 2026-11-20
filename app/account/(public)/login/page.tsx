import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentCustomer } from "@/lib/residential/portal-auth";
import SignInForm from "./SignInForm";
import PasswordForm from "./PasswordForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function AccountLogin({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (await currentCustomer()) redirect("/account");
  const { expired } = await searchParams;
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold">Sign in</h1>
      <p className="mt-3 text-slate-700">
        See your pickup schedule, photos from each visit and your billing. Enter the email you signed up with and
        we&apos;ll send you a sign-in link. No password needed.
      </p>
      {expired && (
        <p className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900" role="alert">
          That sign-in link has expired or was already used. Send yourself a new one below.
        </p>
      )}
      <SignInForm />
      <details className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 group">
        <summary className="cursor-pointer font-semibold list-none flex items-center justify-between">
          Set up a password? Sign in with it here
          <span className="text-res-teal-dark group-open:rotate-180 transition-transform" aria-hidden="true">▾</span>
        </summary>
        <PasswordForm />
        <p className="mt-3 text-sm text-slate-600">Forgot it? Use the email link above, then set a new one in your account.</p>
      </details>
    </div>
  );
}
