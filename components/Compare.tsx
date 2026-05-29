import RevealSection from "./RevealSection";

const rows = [
  {
    scenario: "You need a human fast",
    us: "Owner's cell, no hold music",
    them: "District manager covering 30+ properties",
  },
  {
    scenario: "Attendant doesn't show",
    us: "Owner runs the route himself, you hear from us",
    them: "Service skipped, you find out from a resident",
  },
  {
    scenario: "Violation needs paper trail",
    us: "Photo-documented, time-stamped, one forwarded email",
    them: 'Verbal "all good" or nothing',
  },
  {
    scenario: "Regional asks for proof",
    us: "Report already in your inbox",
    them: "Request, wait, follow up, get less than you asked for",
  },
  {
    scenario: "Where decisions get made",
    us: "Down the street, knows your submarket",
    them: "Regional HQ in another state",
  },
];

export default function Compare() {
  return (
    <section id="why-us" className="py-20 px-4" style={{ backgroundColor: "#0e1117" }}>
      <div className="max-w-5xl mx-auto">
        <RevealSection>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#0E9AA7" }}>
            Why Us, Not Them
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-white mb-3"
            style={{ fontFamily: "var(--font-playfair-display)" }}
          >
            Same service on paper. A different call when something goes wrong.
          </h2>
          <p className="mb-10 text-white/50">
            When things go sideways — and they will — here&apos;s what you actually get.
          </p>
        </RevealSection>

        <RevealSection>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: "640px" }}>
              <thead>
                <tr>
                  <th
                    className="text-left py-3 px-4 font-medium text-white/60"
                    style={{ backgroundColor: "#1B4F72" }}
                  >
                    When this happens…
                  </th>
                  <th
                    className="text-left py-3 px-4 font-semibold text-white"
                    style={{
                      backgroundColor: "#1B4F72",
                      borderLeft: "3px solid #0E9AA7",
                    }}
                  >
                    Valet Waste Disposal
                  </th>
                  <th
                    className="text-left py-3 px-4 font-semibold"
                    style={{
                      color: "#e57060",
                      backgroundColor: "rgba(184,42,30,0.15)",
                      borderLeft: "3px solid #b82a1e",
                    }}
                  >
                    National Operator
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.scenario}
                    className="border-b transition-colors hover:bg-white/5"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}
                  >
                    <td className="py-4 px-4 text-white/70">{row.scenario}</td>
                    <td
                      className="py-4 px-4 text-white/90"
                      style={{
                        backgroundColor: "rgba(14,154,167,0.08)",
                        borderLeft: "3px solid #0E9AA7",
                      }}
                    >
                      {row.us}
                    </td>
                    <td
                      className="py-4 px-4 text-white/70"
                      style={{
                        backgroundColor: "rgba(184,42,30,0.07)",
                        borderLeft: "3px solid #b82a1e",
                      }}
                    >
                      {row.them}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
