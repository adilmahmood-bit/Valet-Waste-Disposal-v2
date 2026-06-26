import Image from "next/image";
import RevealSection from "./RevealSection";

const featureCards = [
  {
    label: "Valet Trash: Doorstep Pickup",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7FDDE6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
        <path d="M14 12v.01" />
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
    label: "Recycling compliance and pad sweep",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7FDDE6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 17l-2 2l2 2" />
        <path d="M10 19h9a2 2 0 0 0 1.75 -2.75l-.55 -1" />
        <path d="M8.536 11l-.732 -2.732l-2.732 .732" />
        <path d="M7.804 8.268l-4.5 7.794a2 2 0 0 0 1.506 2.89l1.141 .024" />
        <path d="M15.464 11l2.732 .732l.732 -2.732" />
        <path d="M18.196 11.732l-4.5 -7.794a2 2 0 0 0 -3.256 -.14l-.591 .976" />
      </svg>
    ),
  },
  {
    label: "Lidded Bins Provided",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7FDDE6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="3" width="6" height="2" rx="0.5" />
        <path d="M4 7h16" />
        <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
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
      {/* Overlay — directional navy gradient scrim, matches the brand flyers */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, rgba(5,18,30,0.72) 0%, rgba(5,18,30,0.55) 45%, rgba(27,79,114,0.4) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto py-24">
        <RevealSection>
          <h1
            className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-4 leading-tight"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.55), 0 2px 24px rgba(0,0,0,0.4)" }}
          >
            <span className="text-white">You have enough to manage.</span>
            <br />
            <span style={{ color: "#7FDDE6" }}>Trash shouldn&apos;t be one of them.</span>
          </h1>

          <p className="text-white font-semibold max-w-xl mx-auto mb-8 text-lg">
            San Diego&apos;s owner-operated valet waste service. Doorstep pickup, nightly reports, sortation compliance, and a tidy pad every morning — handled so none of it lands on you.
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
                className="rounded-xl px-3 py-4 flex flex-col items-center gap-2 shadow-lg text-center transition-transform duration-200 hover:-translate-y-1.5 cursor-default"
                style={{
                  backgroundColor: "rgba(27,79,114,0.45)",
                  border: "1px solid rgba(127,221,230,0.35)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }}
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
