import type { Metadata } from "next";
import { cookies } from "next/headers";
import SignupFlow from "@/components/residential/SignupFlow";
import { SOURCE_COOKIE, REFERRAL_COOKIE, cleanCode, normalizeSource } from "@/lib/residential/tracking";

// The full sign-up (address, service, plan, contact, terms). Not linked from the site for now:
// new customers fill out the short form at /residential/signup first, and we send this link
// once they're ready to start. The "add another property" link on /residential/thanks uses it too.
export const metadata: Metadata = { title: "Sign up", robots: { index: false } };

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const jar = await cookies();
  return (
    <SignupFlow
      zip={sp.zip?.replace(/\D/g, "").slice(0, 5)}
      plan={sp.plan}
      source={normalizeSource(sp.src ?? jar.get(SOURCE_COOKIE)?.value)}
      referralCode={cleanCode(sp.ref ?? jar.get(REFERRAL_COOKIE)?.value)}
      addAnother={sp.add === "1"}
    />
  );
}
