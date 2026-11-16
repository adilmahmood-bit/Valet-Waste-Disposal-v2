import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SOURCE_COOKIE, REFERRAL_COOKIE, cleanCode, normalizeSource } from "@/lib/residential/tracking";
import InterestForm from "@/components/residential/InterestForm";
import { cityPages } from "@/components/residential/cities";
import { trashCollectors } from "@/components/residential/trashDay";

// Where "Sign up" and the ZIP check lead: the short interest form, sent to HubSpot.
// The full sign-up is at /residential/signup/full.
export const metadata: Metadata = { title: "Get started", robots: { index: false } };

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const zip = sp.zip?.replace(/\D/g, "").slice(0, 5);
  // Fill in the city when the ZIP belongs to one of our city pages. Neighborhood pages inside
  // San Diego (Pacific Beach, Hillcrest...) fill in "San Diego", and Cardiff fills in Encinitas.
  const page = zip ? cityPages.find((c) => c.zips.includes(zip)) : undefined;
  const city = !page ? undefined : trashCollectors[page.slug]?.lookupUrl.includes("sandiego.gov") ? "San Diego" : page.name;
  const jar = await cookies();
  return (
    <InterestForm
      zip={zip}
      city={city}
      source={normalizeSource(sp.src ?? jar.get(SOURCE_COOKIE)?.value)}
      referralCode={cleanCode(sp.ref ?? jar.get(REFERRAL_COOKIE)?.value)}
    />
  );
}
