// Live poll results from an industry webinar on multifamily waste spend, rebuilt as a grid.
const polls: { q: string; answers: [string, number][] }[] = [
  {
    q: "Does your organization account for onsite labor when evaluating waste costs?",
    answers: [["Yes, consistently", 0], ["Sometimes", 0], ["Rarely", 100], ["Not sure", 0]],
  },
  {
    q: "Where do you have the biggest opportunity or least visibility into waste spend?",
    answers: [["Service levels", 0], ["Overage and contamination fees", 80], ["Waste volume", 0], ["Bulk spend", 20], ["Not sure", 0]],
  },
  {
    q: "Which part of your waste spend is hardest to predict?",
    answers: [["Rate increases", 0], ["Overage and contamination fees", 80], ["Waste volume", 20], ["Bulk removal", 0], ["Regulatory costs", 0]],
  },
];

export default function PollResults() {
  return (
    <figure className="my-10 lg:-mx-24">
      <div className="grid gap-4 md:grid-cols-3">
        {polls.map((p) => {
          const top = Math.max(...p.answers.map(([, v]) => v));
          return (
            <div key={p.q} className="rounded-2xl border border-border bg-white p-5">
              <p className="text-sm font-bold text-ink leading-snug">{p.q}</p>
              <ul className="mt-4 space-y-2.5">
                {p.answers.map(([label, v]) => {
                  const lead = v === top && v > 0;
                  return (
                    <li key={label}>
                      <div className="flex items-baseline justify-between gap-2 text-xs">
                        <span className={lead ? "font-semibold text-ink" : "text-ink-mid"}>{label}</span>
                        <span className={lead ? "font-bold text-teal" : "text-muted"}>{v}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-border" aria-hidden="true">
                        <div className={`h-1.5 rounded-full ${lead ? "bg-teal" : "bg-ink-mid/50"}`} style={{ width: `${v}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-3 text-sm text-muted">
        Live poll from a 2026 industry webinar on multifamily waste spend. The group was small, so read these as
        directional, not a survey.
      </figcaption>
    </figure>
  );
}
