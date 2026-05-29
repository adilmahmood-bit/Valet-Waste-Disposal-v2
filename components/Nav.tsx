"use client";
import { useState, useEffect } from "react";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { label: "Services", href: "#services" },
    { label: "Why Us", href: "#why-us" },
    { label: "How It Works", href: "#how-it-works" },
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 132" aria-hidden="true" style={{ width: "77px", height: "auto", display: "block" }}>
            <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="30" y="16" width="120" height="102" rx="20" strokeWidth="2.4" opacity="0.55"/>
              <path d="M84 110 L130 110" strokeWidth="2.6"/>
              <path d="M88 110 L88 30 L126 30 L126 110"/>
              <rect x="95" y="38" width="24" height="28" strokeWidth="2.4"/>
              <rect x="95" y="74" width="24" height="30" strokeWidth="2.4"/>
              <path d="M60 80 L60 78.5 Q60 77 62 77 L64 77 Q66 77 66 78.5 L66 80" strokeWidth="2.6"/>
              <path d="M53 82 L73 82" strokeWidth="3.2"/>
              <path d="M54 86 L72 86 L69 106 Q69 110 65 110 L61 110 Q57 110 57 106 Z" strokeWidth="3"/>
              <path d="M59.5 90 L59.5 105" strokeWidth="1.7"/>
              <path d="M63 90 L63 105" strokeWidth="1.7"/>
              <path d="M66.5 90 L66.5 105" strokeWidth="1.7"/>
            </g>
            <circle cx="93" cy="70" r="2" fill="currentColor"/>
          </svg>
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
