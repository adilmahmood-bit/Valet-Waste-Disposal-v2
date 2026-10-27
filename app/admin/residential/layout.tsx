import type { Metadata } from "next";
import Link from "next/link";
import { poppins } from "@/app/fonts/fonts";
import { isAdmin } from "@/lib/residential/admin-auth";
import { logout } from "./actions";

export const metadata: Metadata = { title: "Residential ops | Valet Waste Disposal", robots: { index: false, follow: false } };

const tabs = [
  { label: "Routes", href: "/admin/residential" },
  { label: "Customers", href: "/admin/residential/customers" },
  { label: "Quotes", href: "/admin/residential/quotes" },
  { label: "Waitlist", href: "/admin/residential/waitlist" },
  { label: "Holiday shifts", href: "/admin/residential/shifts" },
  { label: "Sync", href: "/admin/residential/sync" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  return (
    <div className={`${poppins.className} min-h-screen bg-slate-50 text-res-navy`}>
      <header className="bg-res-navy text-white print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/admin/residential" className="font-semibold">VWD Residential Ops</Link>
          {admin && (
            <form action={logout}>
              <button className="text-sm text-white/80 hover:text-white">Log out</button>
            </form>
          )}
        </div>
        {admin && (
          <nav className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto text-sm">
            {tabs.map((t) => (
              <Link key={t.href} href={t.href} className="px-3 py-2.5 whitespace-nowrap hover:bg-white/10 rounded-t-lg">
                {t.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
