import Link from "next/link";
import { IconPhone } from "@tabler/icons-react";
import { residential } from "@/config/residential";

const links = [
  { label: "How it works", href: "/residential#how-it-works" },
  { label: "Pricing", href: "/residential/pricing" },
  { label: "Airbnb hosts", href: "/residential/hosts" },
  { label: "FAQ", href: "/residential/faq" },
];

export default function ResHeader() {
  return (
    <header className="bg-res-navy text-white">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link href="/residential" className="flex items-center gap-2.5 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/vwd-icon-white.png" alt="" aria-hidden="true" width={36} height={36} className="h-9 w-auto" />
          <span className="leading-tight min-w-0">
            <span className="block font-semibold text-[15px] truncate">Valet Waste Disposal</span>
            <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-res-teal">For Homes</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-res-teal transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
        <a
          href={`tel:${residential.contact.phoneHref}`}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-res-teal-dark hover:bg-res-teal px-4 py-2 text-sm font-semibold transition-colors"
        >
          <IconPhone size={16} stroke={2} aria-hidden="true" />
          <span className="hidden sm:inline">{residential.contact.phone}</span>
          <span className="sm:hidden">Call</span>
        </a>
      </div>
      <nav className="md:hidden border-t border-white/10 overflow-x-auto">
        <div className="flex gap-5 px-4 h-11 items-center text-sm font-medium whitespace-nowrap">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-res-teal">
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
