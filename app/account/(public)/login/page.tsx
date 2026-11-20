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
      <p className="mt-3 text-slate-700">See your pickup schedule, photos from each visit and your billing.</p>
      {expired && (
        <p className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900" role="alert">
          That sign-in link has expired or was already used. Send yourself a new one below.
        </p>
      )}
      <PasswordForm />
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">First time signing in, or forgot your password?</h2>
        <p className="mt-1 text-sm text-slate-600">
          Enter the email you signed up with. We&apos;ll email you a sign-in link, then you&apos;ll create a new password.
        </p>
        <SignInForm />
      </section>
    </div>
  );
}
