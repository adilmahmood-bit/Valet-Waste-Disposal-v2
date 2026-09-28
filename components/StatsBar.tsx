import RevealSection from "./RevealSection";

const stats = [
  {
    num: "0",
    label: "Missed pickups tolerated",
    sub: "We show up every scheduled night — no exceptions.",
  },
  {
    num: "3–5×",
    label: "Nights per week",
    sub: "Schedules built around your property's actual trash patterns.",
  },
  {
    num: "< 2h",
    label: "Resident resolution time",
    sub: "Issues handled before they become your problem.",
  },
];

export default function StatsBar() {
  return (
    <section className="py-14 px-4" style={{ backgroundColor: "#1B4F72" }}>
      <RevealSection>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2">
              <span
                className="font-bold leading-none"
                style={{
                  fontFamily: "var(--font-libre-franklin)",
                  fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                  color: "#7FDDE6",
                }}
              >
                {stat.num}
              </span>
              <span className="font-semibold text-white text-base">{stat.label}</span>
              <span className="text-sm max-w-[220px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                {stat.sub}
              </span>
            </div>
          ))}
        </div>
      </RevealSection>
    </section>
  );
}
