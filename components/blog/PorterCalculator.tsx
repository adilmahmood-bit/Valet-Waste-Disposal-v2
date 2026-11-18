"use client";
import { useState } from "react";

// Estimates porter time and labor cost spent on dumpster pads. All inputs are the
// reader's own numbers; the defaults are only a starting point.
const WEEKS_PER_MONTH = 52 / 12;

function Field({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-ink">{label}</span>
      <span className="block text-xs text-muted mb-1.5">{hint}</span>
      <span className="flex items-center rounded-xl border border-border bg-white focus-within:border-teal">
        {prefix && <span className="pl-3 text-ink-mid">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
          className="w-full bg-transparent px-3 py-2.5 text-ink outline-none"
        />
      </span>
    </label>
  );
}

export default function PorterCalculator() {
  const [areas, setAreas] = useState(8);
  const [minutes, setMinutes] = useState(20);
  const [days, setDays] = useState(5);
  const [wage, setWage] = useState(22);

  const hoursPerWeek = (areas * minutes * days) / 60;
  const hoursPerMonth = hoursPerWeek * WEEKS_PER_MONTH;
  const costPerMonth = hoursPerMonth * wage;
  const fmt = (n: number, d = 0) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });

  return (
    <div className="not-prose my-10 rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-teal">Calculator</p>
      <h3 className="font-heading text-2xl text-ink mt-1">How much porter time goes to your pads?</h3>
      <p className="text-sm text-ink-mid mt-2">
        Enter your own numbers. Nothing is saved or sent anywhere.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Dumpster areas" hint="Pads or enclosures porters clean" value={areas} onChange={setAreas} min={1} max={60} step={1} />
        <Field label="Minutes per area" hint="Sorting, leveling, picking up spills" value={minutes} onChange={setMinutes} min={1} max={120} step={1} />
        <Field label="Days per week" hint="How often porters clean the pads" value={days} onChange={setDays} min={1} max={7} step={1} />
        <Field label="Hourly porter cost" hint="Wage, or your contractor's hourly rate" value={wage} onChange={setWage} min={1} max={100} step={0.5} prefix="$" />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3" aria-live="polite">
        {[
          { label: "Hours per week", value: fmt(hoursPerWeek, 1) },
          { label: "Hours per month", value: fmt(hoursPerMonth, 0) },
          { label: "Labor cost per month", value: `$${fmt(costPerMonth, 0)}` },
        ].map((r) => (
          <div key={r.label} className="rounded-2xl bg-surface px-4 py-4">
            <p className="text-xs text-muted">{r.label}</p>
            <p className="font-heading text-2xl text-navy mt-1">{r.value}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted">
        Hours per month use 52 weeks ÷ 12 months. Labor cost leaves out payroll taxes and benefits, so the real
        number is usually higher. The defaults are an example, not data from any one property.
      </p>
    </div>
  );
}
