export default function Footer() {
  return (
    <footer className="py-10 px-4" style={{ backgroundColor: "#1B4F72" }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Logo */}
        <div>
          <p
            className="font-bold text-lg text-white"
            style={{ fontFamily: "var(--font-playfair-display)" }}
          >
            Valet Waste Disposal
          </p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            San Diego County
          </p>
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
