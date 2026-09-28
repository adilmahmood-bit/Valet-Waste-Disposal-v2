export default function Footer() {
  return (
    <footer className="py-10 px-4" style={{ backgroundColor: "#1B4F72" }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Logo lockup */}
        <div className="flex items-center" style={{ color: "#fff", gap: "0px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/vwd-icon-white.png" alt="" aria-hidden="true" style={{ height: "40px", width: "auto", display: "block", marginRight: "12px" }} />
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
