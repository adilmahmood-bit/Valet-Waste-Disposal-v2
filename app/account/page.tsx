import type { Metadata } from "next";
import { requireCustomer } from "@/lib/residential/portal-auth";
import { Portal } from "./portal/Portal";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const customer = await requireCustomer();
  return <Portal customer={customer} params={await searchParams} />;
}
