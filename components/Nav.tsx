"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // The app demo has its own chrome.
  if (pathname?.startsWith("/demo")) return null;

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
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo lockup */}
        <a href="#hero" className="flex items-center text-white" style={{ color: "#fff", gap: "0px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/vwd-icon-white.png" alt="" aria-hidden="true" style={{ height: "42px", width: "auto", display: "block", marginRight: "12px" }} />
          <span className="flex flex-col leading-none" style={{ fontFamily: "var(--font-libre-franklin)" }}>
            <span style={{ fontWeight: 800, fontSize: "15px", letterSpacing: "-0.01em" }}>VALET WASTE</span>
            <span style={{ fontWeight: 500, fontSize: "15px", letterSpacing: "0.205em", marginTop: "2px" }}>DISPOSAL</span>
            <span style={{ fontWeight: 600, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#7FDDE6", marginTop: "4px" }}>Every door, every night</span>
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
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
