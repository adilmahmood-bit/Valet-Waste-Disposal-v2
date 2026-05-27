import Image from "next/image";
import RevealSection from "./RevealSection";

const featureCards = [
  {
    label: "Five nights a week",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6dbf67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  {
    label: "GPS-verified check-in",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6dbf67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    label: "Nightly photo report",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6dbf67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    label: "We provide the bins",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6dbf67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M9 6V4h6v2" />
      </svg>
    ),
  },
  {
    label: "SB 1383 compliant",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6dbf67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
  },
  {
    label: "Owner answers the call",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6dbf67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
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
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(10,13,18,0.44)" }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto py-24">
        <RevealSection>
          <p
            className="text-xs uppercase tracking-widest mb-6"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            Doorstep Valet Trash · San Diego County
          </p>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
            style={{ fontFamily: "var(--font-playfair-display)" }}
          >
            <span style={{ color: "#52b548" }}>You have enough to manage.</span>
            <br />
            <span className="text-white italic">Trash shouldn&apos;t be one of them.</span>
          </h1>

          <p className="text-white font-semibold max-w-xl mx-auto mb-8 text-lg">
            Five nights a week, every door, GPS-verified. We handle the bins, the route, the residents, and the reports.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="#contact"
              className="px-6 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#52b548" }}
            >
              Get a Free Property Quote
            </a>
            <a
              href="#how-it-works"
              className="px-6 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
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
                className="bg-white rounded-xl px-4 py-3 flex items-center gap-2 shadow-md"
              >
                {card.icon}
                <span className="text-sm font-medium text-gray-800">{card.label}</span>
              </div>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
