import type { Metadata } from "next";
import Link from "next/link";
import { poppins } from "@/app/fonts/fonts";
import { residential } from "@/config/residential";

export const metadata: Metadata = {
  title: { default: "Your account | Doorstep Disposal", template: "%s | Doorstep Disposal" },
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { contact } = residential;
  return (
    <div className={`${poppins.className} bg-slate-50 text-res-navy min-h-screen text-[17px] md:text-base flex flex-col`}>
      <header className="bg-[#1B4F72] text-white">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link href="/account" className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/vwd-icon-white.png" alt="" aria-hidden="true" width={40} height={40} className="h-9 w-auto shrink-0" />
            <span className="leading-tight min-w-0">
              <span className="block font-bold text-lg tracking-tight whitespace-nowrap">Doorstep Disposal</span>
              <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-res-teal">Your account</span>
            </span>
          </Link>
          <a href={`tel:${contact.phoneHref}`} className="text-sm font-semibold whitespace-nowrap hover:text-res-teal">
            {contact.phone}
          </a>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="text-sm text-slate-500 text-center px-4 py-8">
        Questions or changes? Call or text{" "}
        <a href={`tel:${contact.phoneHref}`} className="font-semibold text-res-teal-dark">{contact.phone}</a> or email{" "}
        <a href={`mailto:${contact.email}`} className="font-semibold text-res-teal-dark break-all">{contact.email}</a>.
      </footer>
    </div>
  );
}
