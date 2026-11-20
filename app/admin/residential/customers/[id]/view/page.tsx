import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountView } from "@/app/account/AccountView";
import { requireAdmin } from "@/lib/residential/admin-auth";
import { customerById } from "@/lib/residential/portal-auth";
import { loadPortal } from "@/lib/residential/portal-data";

export const dynamic = "force-dynamic";

// What a customer sees at /account, for the admin. Read only: it doesn't sign in as them,
// and their sign-in, password and alert settings can't be changed from here.
export default async function ViewAsCustomer({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const customer = /^[0-9a-f-]{36}$/i.test(id) ? await customerById(id) : null;
  if (!customer) notFound();
  const properties = await loadPortal(customer.id);

  return (
    <div className="-mx-4 -my-6">
      <div className="bg-amber-100 text-amber-950 px-4 py-2 text-sm flex flex-wrap items-center justify-between gap-2">
        <span>
          Preview of <strong>{customer.name}</strong>&apos;s account, exactly as they see it at /account. Read only.
        </span>
        <Link href="/admin/residential/customers" className="underline font-semibold">Back to customers</Link>
      </div>
      <div className="bg-slate-50 text-res-navy text-[17px] md:text-base">
        <AccountView customer={customer} properties={properties} preview />
      </div>
    </div>
  );
}
