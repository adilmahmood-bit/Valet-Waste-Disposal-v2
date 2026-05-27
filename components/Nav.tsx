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
      className={`sticky top-0 z-50 transition-shadow ${scrolled ? "shadow-sm" : ""}`}
      style={{
        backgroundColor: "#52b548",
        borderBottom: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <a href="#hero" className="flex flex-col leading-tight">
          <span
            className="font-bold text-lg text-white"
            style={{ fontFamily: "var(--font-playfair-display)" }}
          >
            Valet Waste Disposal
          </span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
            San Diego County
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium transition-opacity hover:opacity-100"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            className="text-sm font-medium text-white rounded-full px-4 py-1.5 transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.4)",
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
          className="md:hidden px-4 pb-4 flex flex-col gap-4"
          style={{ backgroundColor: "#52b548" }}
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
            className="text-sm font-medium text-white rounded-full px-4 py-2 text-center"
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.4)",
            }}
            onClick={() => setOpen(false)}
          >
            Get a Quote
          </a>
        </div>
      )}
    </nav>
  );
}
