import type { Metadata } from "next";
import { requireCustomer } from "@/lib/residential/portal-auth";
import { loadPortal } from "@/lib/residential/portal-data";
import { AccountView } from "./AccountView";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const customer = await requireCustomer();
  const properties = await loadPortal(customer.id);
  return <AccountView customer={customer} properties={properties} />;
}
