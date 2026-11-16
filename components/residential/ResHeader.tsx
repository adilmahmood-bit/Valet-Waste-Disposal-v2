import Link from "next/link";
import { IconPhone } from "@tabler/icons-react";
import { residential } from "@/config/residential";
import MobileMenu from "./MobileMenu";

const links = [
  { label: "How it works", href: "/residential#how-it-works" },
  { label: "Pricing", href: "/residential/pricing" },
  { label: "Airbnb hosts", href: "/hosts" },
  { label: "FAQ", href: "/residential/faq" },
  { label: "Trash Day SD Guide", href: "/residential/trash-day" },
];

export default function ResHeader() {
  return (
    // Same blue as the main site's nav bar.
    <header className="relative bg-[#1B4F72] text-white">
      <div className="max-w-6xl mx-auto px-4 h-[72px] md:h-20 flex items-center justify-between gap-3">
        <Link href="/residential" className="flex items-center gap-2.5 md:gap-3 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/vwd-icon-white.png" alt="Doorstep Disposal logo" aria-hidden="true" width={48} height={48} className="h-10 md:h-12 w-auto shrink-0" />
          <span className="leading-tight min-w-0">
            <span className="block font-bold text-lg md:text-2xl tracking-tight whitespace-nowrap">Doorstep Disposal</span>
            <span className="block text-[11px] md:text-xs font-medium uppercase tracking-[0.18em] text-res-teal">For Homes</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-res-teal transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 shrink-0">
        <a
          href={`tel:${residential.contact.phoneHref}`}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-res-teal-dark hover:bg-res-teal px-4 py-2 text-sm font-semibold transition-colors"
        >
          <IconPhone size={16} stroke={2} aria-hidden="true" />
          <span className="hidden sm:inline">{residential.contact.phone}</span>
          <span className="sm:hidden">Call</span>
        </a>
        <MobileMenu links={links} />
        </div>
      </div>
    </header>
  );
}
