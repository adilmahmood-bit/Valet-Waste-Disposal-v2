export default function Footer() {
  return (
    <footer className="py-10 px-4" style={{ backgroundColor: "#1B4F72" }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Logo lockup */}
        <div className="flex items-center" style={{ color: "#fff", gap: "0px" }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 132" aria-hidden="true" style={{ width: "72px", height: "auto", display: "block" }}>
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
            <span style={{ fontWeight: 800, fontSize: "14px", letterSpacing: "-0.01em" }}>VALET WASTE</span>
            <span style={{ fontWeight: 500, fontSize: "14px", letterSpacing: "0.205em", marginTop: "2px" }}>DISPOSAL</span>
            <span style={{ fontWeight: 600, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#7FDDE6", marginTop: "4px" }}>Every door, every night</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="flex gap-6 justify-start md:justify-center">
          {["#services", "#why-us", "#how-it-works", "#contact"].map((href) => {
            const label = href.replace("#", "").replace(/-/g, " ");
            return (
              <a
                key={href}
                href={href}
                className="text-sm capitalize transition-opacity hover:opacity-100"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                {label}
              </a>
            );
          })}
        </div>

        {/* Copyright */}
        <div className="text-sm md:text-right" style={{ color: "rgba(255,255,255,0.55)" }}>
          © {new Date().getFullYear()} Valet Waste Disposal. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
