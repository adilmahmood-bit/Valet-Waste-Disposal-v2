import RevealSection from "./RevealSection";

const steps = [
  {
    num: "1",
    time: "6–8 PM",
    title: "Set-Out",
    desc: "Residents set their labeled bins outside their unit door.",
  },
  {
    num: "2",
    time: "8:00 PM",
    title: "Check-In",
    desc: "Attendant arrives and GPS check-in is logged — you know service started on time.",
  },
  {
    num: "3",
    time: "8–11 PM",
    title: "Collection",
    desc: "Every door on every floor, every bin collected — no skipped units.",
  },
  {
    num: "4",
    time: "By Midnight",
    title: "Report",
    desc: "Photo-verified completion summary lands in your inbox — forward it to your regional in two clicks.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4" style={{ backgroundColor: "#FAF8F4" }}>
      <div className="max-w-5xl mx-auto">
        <RevealSection>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#0E9AA7" }}>
            The Nightly Routine
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold mb-12"
            style={{ fontFamily: "var(--font-playfair-display)", color: "#1B4F72" }}
          >
            How a service night works.
          </h2>
        </RevealSection>

        <RevealSection>
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Connecting line — desktop only */}
            <div
              className="hidden md:block absolute"
              style={{
                backgroundColor: "rgba(14,154,167,0.3)",
                height: "2px",
                top: "24px",
                left: "calc(12.5% + 24px)",
                right: "calc(12.5% + 24px)",
                zIndex: 0,
              }}
            />

            {steps.map((step) => (
              <div key={step.num} className="flex flex-col items-center text-center relative z-10">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md mb-4"
                  style={{ backgroundColor: "#0E9AA7" }}
                >
                  {step.num}
                </div>
                <p
                  className="text-xs uppercase tracking-wider mb-1"
                  style={{ color: "#6b7280" }}
                >
                  {step.time}
                </p>
                <h3
                  className="font-bold mb-2"
                  style={{ fontFamily: "var(--font-playfair-display)", color: "#1B4F72" }}
                >
                  {step.title}
                </h3>
                <p className="text-sm text-ink-mid max-w-[200px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
