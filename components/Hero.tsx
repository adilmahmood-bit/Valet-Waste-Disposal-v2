import Image from "next/image";
import RevealSection from "./RevealSection";

const featureCards = [
  {
    label: "Valet Trash: Doorstep Pickup",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7FDDE6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M9 6V4h6v2" />
      </svg>
    ),
  },
  {
    label: "Nightly Service Reports",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7FDDE6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    label: "Recycling & SB 1383 Compliance",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7FDDE6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
  },
  {
    label: "Pet Waste Stations",
    icon: (
      <svg width="28" height="28" viewBox="0 0 100 100" fill="#7FDDE6" stroke="none">
        {/* Top-left toe — spread wide */}
        <ellipse cx="13" cy="24" rx="10" ry="13" transform="rotate(-22 13 24)" />
        {/* Top-middle-left toe */}
        <ellipse cx="36" cy="11" rx="10" ry="13" transform="rotate(-7 36 11)" />
        {/* Top-middle-right toe */}
        <ellipse cx="64" cy="11" rx="10" ry="13" transform="rotate(7 64 11)" />
        {/* Top-right toe — spread wide */}
        <ellipse cx="87" cy="24" rx="10" ry="13" transform="rotate(22 87 24)" />
        {/* Main pad — narrower */}
        <path d="M50 40 C34 40 24 53 24 65 C24 78 34 91 50 91 C66 91 76 78 76 65 C76 53 66 40 50 40 Z" />
      </svg>
    ),
  },
  {
    label: "Fully Licensed and Insured",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7FDDE6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    label: "All Employees W-2 & Background Checked",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7FDDE6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center">
      {/* Background image */}
      <Image
        src="/hero-building.jpg"
        alt="Apartment building"
        fill
        className="object-cover"
        priority
      />
      {/* Overlay — deep green tint for contrast */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(5,18,30,0.68)" }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto py-24">
        <RevealSection>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
            style={{ fontFamily: "var(--font-playfair-display)" }}
          >
            <span style={{ color: "#0E9AA7" }} >You have enough to manage.</span>
            <br />
            <span className="text-white italic">Trash shouldn&apos;t be one of them.</span>
          </h1>

          <p className="text-white font-semibold max-w-xl mx-auto mb-8 text-lg">
            San Diego&apos;s owner-operated valet waste service. Doorstep pickup, nightly reports, and full SB 1383 compliance — handled so you don&apos;t have to think about it.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="#contact"
              className="btn-primary px-6 py-3 rounded-lg font-semibold text-white"
            >
              Get a Free Property Quote
            </a>
            <a
              href="#how-it-works"
              className="btn-outline px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-200"
              style={{ border: "1px solid rgba(255,255,255,0.4)" }}
            >
              See How It Works
            </a>
          </div>

          {/* Feature cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {featureCards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl px-3 py-4 flex flex-col items-center gap-2 shadow-md text-center transition-transform duration-200 hover:-translate-y-1.5 cursor-default"
                style={{ backgroundColor: "#1B4F72", border: "1px solid rgba(14,154,167,0.3)" }}
              >
                {card.icon}
                <span className="text-sm font-bold text-white leading-snug">{card.label}</span>
              </div>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
