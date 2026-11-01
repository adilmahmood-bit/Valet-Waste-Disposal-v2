"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { IconHome } from "@tabler/icons-react";
import { poppins } from "@/app/fonts/fonts";

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // The app demo, residential pages and admin have their own chrome.
  if (pathname?.startsWith("/app") || pathname?.startsWith("/residential") || pathname?.startsWith("/admin")) return null;

  const links = [
    { label: "Services", href: "#services" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Why Us", href: "#why-us" },
  ];

  return (
    <nav
      className={`sticky top-0 z-50 transition-shadow ${scrolled ? "shadow-md" : ""}`}
      style={{
        backgroundColor: "#1B4F72",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-[68px] md:h-[72px]">
        {/* Logo lockup */}
        <a href="#hero" className="flex items-center text-white" style={{ color: "#fff" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/vwd-icon-white.png" alt="" aria-hidden="true" className="block h-11 md:h-12 w-auto mr-3" />
          {/* Poppins, like the "Doorstep Disposal" logo on the residential pages. */}
          <span className={`${poppins.className} flex flex-col leading-none`}>
            <span className="text-base md:text-lg" style={{ fontWeight: 700, letterSpacing: "0" }}>VALET WASTE</span>
            <span className="text-base md:text-lg" style={{ fontWeight: 500, letterSpacing: "0.08em" }}>DISPOSAL</span>
            <span className="text-[7.5px] md:text-[8.5px] mt-1" style={{ fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#7FDDE6" }}>Every door, every night</span>
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {/* "For Homes" is the residential bin valet section; the homepage stays multifamily.
              Filled in the homepage's step blue so it reads as its own button next to the teal "Get a Quote". */}
          <Link
            href="/residential"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white rounded-full px-5 py-2 bg-[#2C7FB8] transition-colors duration-200 hover:bg-[#3A92CF]"
          >
            <IconHome size={16} stroke={2} aria-hidden="true" />
            For Homes
          </Link>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-white transition-opacity hover:opacity-75"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            className="text-sm font-semibold rounded-full px-5 py-2 transition-colors duration-200"
            style={{ backgroundColor: "#0E9AA7", color: "#fff" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#3BBFCB";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#0E9AA7";
            }}
          >
            Get a Quote
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span className="block w-6 h-0.5 bg-white" />
          <span className="block w-6 h-0.5 bg-white" />
          <span className="block w-6 h-0.5 bg-white" />
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div
          className="md:hidden px-4 pb-4 flex flex-col gap-4 border-t"
          style={{ backgroundColor: "#1B4F72", borderColor: "rgba(255,255,255,0.1)" }}
        >
          <Link
            href="/residential"
            className="mt-3 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white rounded-full px-4 py-2 bg-[#2C7FB8]"
            onClick={() => setOpen(false)}
          >
            <IconHome size={16} stroke={2} aria-hidden="true" />
            For Homes
          </Link>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-white font-medium"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            className="text-sm font-semibold rounded-full px-4 py-2 text-center"
            style={{ backgroundColor: "#0E9AA7", color: "#fff" }}
            onClick={() => setOpen(false)}
          >
            Get a Quote
          </a>
        </div>
      )}
    </nav>
  );
}
