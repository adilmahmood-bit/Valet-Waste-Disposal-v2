import RevealSection from "./RevealSection";

const cards = [
  {
    num: "01",
    title: "The Complaints",
    sub: "Overflowing dumpsters are never your fault. They're always your problem.",
    body: "Every trash complaint is uncompensated work — answering the call, walking the property, chasing the resident. None of it shows up on the things you're actually measured on.",
  },
  {
    num: "02",
    title: "The Pressure",
    sub: "Your regional wants more revenue and tighter occupancy. Today.",
    body: "You need amenities residents notice on renewal without a capex conversation. Doorstep trash is the easiest one to add this quarter.",
  },
  {
    num: "03",
    title: "The Vendor",
    sub: "The valet company you have doesn't answer the phone anymore.",
    body: "National operators sign you, then forget you. Completion rates slip, violations go undocumented. You're the last to know when service was missed.",
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
            className="text-3xl sm:text-4xl font-bold mb-12 max-w-2xl"
            style={{ fontFamily: "var(--font-playfair-display)", color: "#1B4F72" }}
          >
            Three problems you live with every single week.
          </h2>
        </RevealSection>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <RevealSection key={card.num}>
              <div
                className="bg-white rounded-xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                style={{
                  border: "1px solid #e5e7eb",
                  borderTop: "4px solid #1B4F72",
                }}
              >
                <span
                  className="text-3xl font-bold block mb-3"
                  style={{ color: "#1B4F72", fontFamily: "var(--font-playfair-display)" }}
                >
                  {card.num}
                </span>
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ fontFamily: "var(--font-playfair-display)", color: "#1B4F72" }}
                >
                  {card.title}
                </h3>
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
