import Link from "next/link";
import { IconCheck } from "@tabler/icons-react";
import { enabledPlans } from "@/config/residential";

export default function PlanCards() {
  const plans = enabledPlans();
  return (
    <div className={`grid gap-5 ${plans.length > 2 ? "md:grid-cols-3" : "md:grid-cols-2"} max-w-4xl mx-auto`}>
      {plans.map((p) => (
        <div
          key={p.id}
          className={`relative rounded-2xl border bg-white p-6 flex flex-col ${p.mostPopular ? "border-res-teal border-2 shadow-lg" : "border-slate-200"}`}
        >
          {p.mostPopular && (
            <span className="absolute -top-3 left-6 rounded-full bg-res-teal-dark text-white text-xs font-semibold px-3 py-1">Most popular</span>
          )}
          <h3 className="text-lg font-semibold">{p.name}</h3>
          <p className="mt-1 text-sm text-slate-600">{p.blurb}</p>
          <p className="mt-4">
            <span className="text-4xl font-bold">${p.basePrice}</span>
            <span className="text-slate-600">{p.billing === "monthly" ? " / month" : " one time"}</span>
          </p>
          <p className="text-sm text-slate-600">
            Up to {p.includedBins} bins. Extra bins ${p.extraBinPrice} each{p.billing === "monthly" ? " per month" : ""}.
          </p>
          <ul className="mt-4 space-y-2 text-sm flex-1">
            {p.includes.map((i) => (
              <li key={i} className="flex gap-2">
                <IconCheck size={18} className="text-res-teal-dark shrink-0" aria-hidden="true" />
                {i}
              </li>
            ))}
          </ul>
          <Link
            href={`/residential/service-area?plan=${p.id}`}
            className={`mt-6 text-center rounded-full px-5 py-3 font-semibold transition-colors ${p.mostPopular ? "bg-res-teal-dark text-white hover:bg-res-navy" : "border-2 border-res-navy hover:bg-res-navy hover:text-white"}`}
          >
            Check my address
          </Link>
        </div>
      ))}
    </div>
  );
}
