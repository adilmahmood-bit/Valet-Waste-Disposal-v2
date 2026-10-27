// Small shared bits for the admin screens.

export const card = "rounded-2xl bg-white border border-slate-200";
export const btn = "rounded-full bg-res-teal-dark text-white text-sm font-semibold px-4 py-2 hover:bg-res-navy";
export const btnGhost = "rounded-full border border-slate-300 text-sm font-semibold px-4 py-2 hover:bg-slate-100";
export const field = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

const tones: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  done: "bg-emerald-100 text-emerald-800",
  accepted: "bg-emerald-100 text-emerald-800",
  signed_up: "bg-sky-100 text-sky-800",
  quoted: "bg-sky-100 text-sky-800",
  quote_needed: "bg-amber-100 text-amber-900",
  open: "bg-amber-100 text-amber-900",
  issue: "bg-amber-100 text-amber-900",
  paused: "bg-slate-200 text-slate-700",
  skipped: "bg-slate-200 text-slate-700",
  cancelled: "bg-red-100 text-red-800",
  declined: "bg-red-100 text-red-800",
  missed: "bg-red-100 text-red-800",
};

export function Badge({ value }: { value: string }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tones[value] ?? "bg-slate-100 text-slate-700"}`}>{value.replace(/_/g, " ")}</span>;
}

export function SetupNotice({ error }: { error: unknown }) {
  return (
    <div className={`${card} p-6`}>
      <p className="font-semibold">Can&apos;t reach the database.</p>
      <p className="mt-2 text-sm text-slate-600">{error instanceof Error ? error.message : String(error)}</p>
      <p className="mt-2 text-sm text-slate-600">Check that the Supabase project is active, the migration is applied, and SUPABASE_SECRET_KEY is in .env.local.</p>
    </div>
  );
}
