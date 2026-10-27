import type { Metadata } from "next";
import { cookies } from "next/headers";
import SignupFlow from "@/components/residential/SignupFlow";
import { SOURCE_COOKIE, REFERRAL_COOKIE, cleanCode, normalizeSource } from "@/lib/residential/tracking";

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
