import {
  IconTrash,
  IconRoute,
  IconUsers,
  IconLeaf,
  IconSpray,
  IconCoin,
} from "@tabler/icons-react";
import RevealSection from "./RevealSection";

const cards = [
  {
    icon: <IconTrash size={28} stroke={1.5} color="#0E9AA7" />,
    title: "We provide the bins",
    body: "Branded, lidded container delivered to every unit door before the first service night.",
  },
  {
    icon: <IconRoute size={28} stroke={1.5} color="#0E9AA7" />,
    title: "We run the route & send the report",
    body: "Five nights a week, every door, GPS-verified. A photo-verified completion summary lands in your inbox by midnight — every service night.",
  },
  {
    icon: <IconUsers size={28} stroke={1.5} color="#0E9AA7" />,
    title: "We handle the residents",
    body: "Education before enforcement — residents get a welcome letter on Day 1. Violations are photo-documented with a plain-language reason, never a surprise fine.",
  },
  {
    icon: <IconLeaf size={28} stroke={1.5} color="#0E9AA7" />,
    title: "SB 1383 Compliance",
    body: "California-mandatory organics and recycling. One vendor, one invoice, zero fine exposure.",
  },
  {
    icon: <IconSpray size={28} stroke={1.5} color="#0E9AA7" />,
    title: "We sweep the pad",
    body: "Dumpster pad cleaning and dog waste stations available on any contract.",
  },
  {
    icon: <IconCoin size={28} stroke={1.5} color="#0E9AA7" />,
    title: "Boost NOI — zero capital",
    body: "Charge residents the market rate, pay our flat per-door fee, and keep the margin every month. A revenue-generating amenity your team never has to touch.",
  },
];

export default function Services() {
  return (
    <section id="services" className="py-20 px-4" style={{ backgroundColor: "#FAF8F4" }}>
      <div className="max-w-7xl mx-auto">
        <RevealSection>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#0E9AA7" }}>
            The Cherry on Top — You Do Nothing
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{ fontFamily: "var(--font-playfair-display)", color: "#1B4F72" }}
          >
            We handle everything.
          </h2>
          <p className="text-ink-mid mb-12 max-w-xl">
            You point us at the property and approve the welcome letter. That&apos;s the entire lift on your side.
          </p>
        </RevealSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <RevealSection key={card.title}>
              <div
                className="bg-white rounded-xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                style={{
                  border: "1px solid #e5e7eb",
                  borderTop: "4px solid #1B4F72",
                }}
              >
                <div className="mb-4">{card.icon}</div>
                <h3 className="font-bold mb-2" style={{ color: "#1B4F72" }}>{card.title}</h3>
                <p className="text-ink-mid text-sm">{card.body}</p>
              </div>
            </RevealSection>
          ))}
        </div>

        {/* Resident benefits callout */}
        <RevealSection>
          <div
            className="mt-12 rounded-2xl p-8 flex flex-col md:flex-row gap-8"
            style={{ backgroundColor: "#1B4F72" }}
          >
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#7FDDE6" }}>
                Why Residents Love It
              </p>
              <h3
                className="text-xl font-bold text-white mb-4"
                style={{ fontFamily: "var(--font-playfair-display)" }}
              >
                The amenity they actually use every day.
              </h3>
              <p className="text-sm mb-0" style={{ color: "rgba(255,255,255,0.75)" }}>
                Unlike the gym or the pool, every resident benefits from valet trash — every single night.
                That makes it the most-used amenity on the property and a genuine leasing differentiator at tours.
              </p>
            </div>
            <div className="flex-1 flex flex-col gap-3 justify-center">
              {[
                "No more hauling bags to the dumpster — pickup happens at their door.",
                "Especially valued by elderly residents, families, and busy professionals.",
                "Used nightly — residents notice it missing immediately, which means they value it.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7FDDE6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
