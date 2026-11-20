import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireCustomer } from "@/lib/residential/portal-auth";
import { Portal } from "./portal/Portal";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const customer = await requireCustomer();
  // A password is required: first sign-in (by emailed link) goes to create one.
  if (!customer.password_set_at) redirect("/account/welcome");
  return <Portal customer={customer} params={await searchParams} />;
}
