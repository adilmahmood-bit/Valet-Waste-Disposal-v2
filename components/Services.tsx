import {
  IconFileCheck,
  IconUsers,
  IconLeaf,
  IconSpray,
  IconDroplet,
  IconCoin,
} from "@tabler/icons-react";
import RevealSection from "./RevealSection";

const cards = [
  {
    icon: <IconUsers size={28} stroke={1.5} color="#0E9AA7" />,
    title: "Resident onboarding handled — lidded bins provided",
    body: "Welcome letters, bin delivery, program rules. We handle every resident touchpoint so your team fields zero setup questions from Day 1.",
  },
  {
    icon: <IconFileCheck size={28} stroke={1.5} color="#0E9AA7" />,
    title: "A nightly report — in your inbox every morning",
    body: "Every door serviced, GPS-verified, with a photo-verified completion summary in your inbox by midnight — every night we run.",
  },
  {
    icon: <IconLeaf size={28} stroke={1.5} color="#0E9AA7" />,
    title: "SB 1383 Compliance & recycling sortation",
    body: "California-mandatory organics and recycling, sorted properly at disposal. One vendor, one invoice, zero fine exposure.",
  },
  {
    icon: <IconSpray size={28} stroke={1.5} color="#0E9AA7" />,
    title: "The mess around the dumpster — gone",
    body: "Every bag carried into the dumpster — never left beside it. We sweep and tidy the dumpster pad each night, so the enclosure is clean and clear by morning instead of scattered with overflow.",
  },
  {
    icon: <IconDroplet size={28} stroke={1.5} color="#0E9AA7" />,
    title: "Spills handled, floors protected",
    body: "We carry trash in leakproof containers and clean any spill on-site — plus available protective mats under each bin, an optional upgrade that keeps leaks off your flooring entirely.",
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
            className="text-3xl sm:text-4xl font-extrabold mb-3"
            style={{ fontFamily: "var(--font-libre-franklin)", color: "#1B4F72", letterSpacing: "-0.01em" }}
          >
            What we handle:
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
                style={{ fontFamily: "var(--font-libre-franklin)" }}
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
                "No bags sit out — lidded bins are provided and it's collected the same evening.",
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
