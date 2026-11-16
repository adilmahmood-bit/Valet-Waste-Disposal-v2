"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconMenu2, IconX } from "@tabler/icons-react";

// Phone-only ☰ menu for the residential header. Closes when a link is tapped or the page changes.
export default function MobileMenu({ links }: { links: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="res-mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="grid place-items-center size-11 rounded-full hover:bg-white/10"
      >
        {open ? <IconX size={26} aria-hidden="true" /> : <IconMenu2 size={26} aria-hidden="true" />}
      </button>
      {open && (
        <nav id="res-mobile-menu" className="absolute inset-x-0 top-[72px] z-50 bg-[#1B4F72] border-t border-white/10 shadow-lg">
          <ul className="px-4 py-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className="block py-3.5 text-lg font-medium border-b border-white/10 last:border-0 hover:text-res-teal">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
