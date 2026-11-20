import type { Metadata } from "next";
import Link from "next/link";
import { confirmSignIn } from "@/app/account/actions";

export const metadata: Metadata = { title: "Sign in", referrer: "no-referrer" };

// The emailed link lands here. Signing in takes a click (a form post), because email
// scanners open links on their own and would otherwise use up the one-time token.
export default async function VerifyPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { t } = await searchParams;
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold">Sign in to your account</h1>
      {t ? (
        <form action={confirmSignIn} className="mt-6">
          <input type="hidden" name="t" value={t} />
          <button className="w-full rounded-full bg-res-teal-dark hover:bg-res-teal text-white font-semibold py-3">
            Continue to my account
          </button>
        </form>
      ) : (
        <p className="mt-4 text-slate-700">
          This link is missing its code. <Link href="/account/login" className="font-semibold text-res-teal-dark underline">Send a new link</Link>.
        </p>
      )}
    </div>
  );
}
