import { requireAdmin } from "@/lib/residential/admin-auth";
import { db, must, type WaitlistRow } from "@/lib/residential/db";
import { sourceLabel } from "@/config/residential";
import { card, SetupNotice } from "../ui";

export default async function WaitlistPage() {
  await requireAdmin();
  let rows: WaitlistRow[];
  try {
    rows = must(await db().from("res_waitlist").select("*").order("created_at", { ascending: false })) as WaitlistRow[];
  } catch (e) {
    return <SetupNotice error={e} />;
  }
  const counts = Object.entries(
    rows.reduce<Record<string, number>>((acc, r) => ((acc[r.zip] = (acc[r.zip] ?? 0) + 1), acc), {}),
  ).sort((a, b) => b[1] - a[1]);
  const max = counts[0]?.[1] ?? 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Waitlist <span className="text-slate-500 font-medium">({rows.length})</span></h1>

      <section className={`${card} p-4`}>
        <h2 className="font-semibold">By ZIP</h2>
        {counts.length === 0 && <p className="text-slate-500 text-sm mt-2">Nobody yet.</p>}
        <ul className="mt-3 space-y-1.5">
          {counts.map(([zip, n]) => (
            <li key={zip} className="grid grid-cols-[4rem_1fr_2rem] items-center gap-3 text-sm">
              <span className="font-medium">{zip}</span>
              <span className="h-3 rounded-full bg-res-teal" style={{ width: `${(n / max) * 100}%` }} />
              <span className="text-right font-semibold">{n}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              {["Date", "Name", "ZIP", "Address", "Mobile", "Email", "Source"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-200">
                <td className="px-3 py-2 whitespace-nowrap">{r.created_at.slice(0, 10)}</td>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2">{r.zip}</td>
                <td className="px-3 py-2">{r.address}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.mobile}</td>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2">{sourceLabel(r.source)}{r.referral_code ? ` (${r.referral_code})` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
