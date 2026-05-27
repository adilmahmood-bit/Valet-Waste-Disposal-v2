import {
  IconTrash,
  IconRoute,
  IconUsers,
  IconFileText,
  IconLeaf,
  IconSpray,
} from "@tabler/icons-react";
import RevealSection from "./RevealSection";

const cards = [
  {
    icon: <IconTrash size={28} stroke={1.5} color="#6dbf67" />,
    title: "We provide the bins",
    body: "Branded, lidded container delivered to every unit door before the first service night.",
  },
  {
    icon: <IconRoute size={28} stroke={1.5} color="#6dbf67" />,
    title: "We run the route",
    body: "Five nights a week, every door, GPS-verified check-in so you always know service happened.",
  },
  {
    icon: <IconUsers size={28} stroke={1.5} color="#6dbf67" />,
    title: "We handle the residents",
    body: "Violations tagged with photo-documented reasons. Resident questions absorbed — not forwarded to you.",
  },
  {
    icon: <IconFileText size={28} stroke={1.5} color="#6dbf67" />,
    title: "We send the report",
    body: "Photo-verified completion summary in your inbox by midnight, every service night.",
  },
  {
    icon: <IconLeaf size={28} stroke={1.5} color="#6dbf67" />,
    title: "SB 1383 Compliance",
    body: "California-mandatory organics and recycling. One vendor, one invoice, zero fine exposure.",
  },
  {
    icon: <IconSpray size={28} stroke={1.5} color="#6dbf67" />,
    title: "We sweep the pad",
    body: "Dumpster pad cleaning and dog waste stations available on any contract.",
  },
];

export default function Services() {
  return (
    <section id="services" className="bg-surface py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <RevealSection>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#52b548" }}>
            The Cherry on Top — You Do Nothing
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-ink mb-3"
            style={{ fontFamily: "var(--font-playfair-display)" }}
          >
            Everything we handle. Everything.
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
                  borderTop: "4px solid #52b548",
                }}
              >
                <div className="mb-4">{card.icon}</div>
                <h3 className="font-bold text-ink mb-2">{card.title}</h3>
                <p className="text-ink-mid text-sm">{card.body}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}
