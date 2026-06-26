import {
  IconAlertTriangle,
  IconTrashX,
  IconWind,
  IconDroplet,
} from "@tabler/icons-react";
import RevealSection from "./RevealSection";

const cards = [
  {
    icon: <IconAlertTriangle size={26} stroke={1.6} color="#C9622B" />,
    accent: "#C9622B",
    title: "Surprise compliance fines",
    sub: "Trash and recyclables in the wrong dumpster — SB 1383 violations and code citations.",
    body: "One missorted load is all it takes for a citation to hit your statement — now multiply that across 10 dumpsters. With us, that exposure goes away — no surprise fines.",
  },
  {
    icon: <IconTrashX size={26} stroke={1.6} color="#0E9AA7" />,
    accent: "#1B4F72",
    title: "The morning dumpster mess",
    sub: "Bags left beside the dumpster instead of in it — scatter and overflow by sunrise.",
    body: "Self-hauled trash means your porters inherit the cleanup. With us, the area is spotless before your team clocks in — that's labor back on your roster.",
  },
  {
    icon: <IconWind size={26} stroke={1.6} color="#0E9AA7" />,
    accent: "#1B4F72",
    title: "The smell and the pests",
    sub: "Trash sitting overnight brings odor, flies, and rodents.",
    body: "Trash that lingers is trash that smells. With us it's gone the same evening, so odor and pests never get the chance to settle in.",
  },
  {
    icon: <IconDroplet size={26} stroke={1.6} color="#0E9AA7" />,
    accent: "#1B4F72",
    title: "Spills and stains",
    sub: "Leaking bags stain concrete, carpet, and breezeway tile.",
    body: "Self-hauled bags leak far more often, and those stains set into concrete and carpet. With us, your stairwells, breezeways, and floors stay clean — period.",
  },
];

export default function PainPoints() {
  return (
    <section id="pain-points" className="py-20 px-4" style={{ backgroundColor: "#FAF8F4" }}>
      <div className="max-w-7xl mx-auto">
        <RevealSection>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#0E9AA7" }}>
            Why Property Managers Call Us First
          </p>
          <h2
            className="font-heading text-3xl sm:text-4xl mb-3 max-w-2xl"
            style={{ color: "#1B4F72" }}
          >
            What lands on you:
          </h2>
          <p className="text-ink-mid mb-12 max-w-xl">
            Trash isn&apos;t a line item until it becomes a complaint, a fine, or a porter&apos;s morning. Sound familiar?
          </p>
        </RevealSection>

        <div className="grid md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <RevealSection key={card.title}>
              <div
                className="bg-white rounded-xl p-6 h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                style={{
                  border: "1px solid #e5e7eb",
                  borderTop: `4px solid ${card.accent}`,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${card.accent}14` }}
                  >
                    {card.icon}
                  </div>
                  <h3
                    className="font-heading text-lg"
                    style={{ color: "#1B4F72" }}
                  >
                    {card.title}
                  </h3>
                </div>
                <p className="text-ink-mid text-sm font-semibold mb-2">{card.sub}</p>
                <p className="text-ink-mid text-sm">{card.body}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}
