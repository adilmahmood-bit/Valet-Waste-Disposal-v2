import Link from "next/link";
import { notFound } from "next/navigation";
import { Portal } from "@/app/account/portal/Portal";
import { requireAdmin } from "@/lib/residential/admin-auth";
import { customerById } from "@/lib/residential/portal-auth";

export const dynamic = "force-dynamic";

// What a customer sees at /account, for the admin. Read only: it doesn't sign in as them,
// and every form is hidden.
export default async function ViewAsCustomer({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const { id } = await params;
  const customer = /^[0-9a-f-]{36}$/i.test(id) ? await customerById(id) : null;
  if (!customer) notFound();

  return (
    <div className="-mx-4 -my-6">
      <div className="bg-amber-100 text-amber-950 px-4 py-2 text-sm flex flex-wrap items-center justify-between gap-2">
        <span>
          Preview of <strong>{customer.name}</strong>&apos;s account, as they see it at /account. Read only.
        </span>
        <Link href="/admin/residential/customers" className="underline font-semibold">Back to customers</Link>
      </div>
      <Portal customer={customer} params={await searchParams} preview />
    </div>
  );
}
