import { requireAdmin } from "@/lib/residential/admin-auth";
import { db, must, type ShiftRow } from "@/lib/residential/db";
import { formatLong, todaySD, addDays } from "@/lib/residential/schedule";
import { addShift, deleteShift } from "../actions";
import { btn, card, field, SetupNotice } from "../ui";

export default async function ShiftsPage() {
  await requireAdmin();
  let shifts: ShiftRow[];
  try {
    shifts = must(await db().from("res_service_shifts").select("*").gte("date", addDays(todaySD(), -30)).order("date")) as ShiftRow[];
  } catch (e) {
    return <SetupNotice error={e} />;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Holiday shifts</h1>
        <p className="text-sm text-slate-600 mt-1">
          Enter the holiday date. Pickups on or after that day, in that week, move later by the number of days you set. The route list follows the shift.
        </p>
      </div>

      <form action={addShift} className={`${card} p-4 grid gap-3 sm:grid-cols-2`}>
        <label className="text-sm font-semibold">
          Holiday date
          <input type="date" name="date" required className={`${field} mt-1 w-full`} />
        </label>
        <label className="text-sm font-semibold">
          Shift by (days)
          <input type="number" name="shift_days" min="1" max="3" defaultValue="1" className={`${field} mt-1 w-full`} />
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          ZIPs <span className="font-normal text-slate-500">(leave empty for all)</span>
          <input name="zips" placeholder="92103, 92104" className={`${field} mt-1 w-full`} />
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          Note
          <input name="note" placeholder="Thanksgiving" className={`${field} mt-1 w-full`} />
        </label>
        <div><button className={btn}>Add shift</button></div>
      </form>

      <ul className="space-y-2">
        {shifts.length === 0 && <li className={`${card} p-4 text-slate-500`}>No upcoming shifts.</li>}
        {shifts.map((s) => (
          <li key={s.id} className={`${card} p-4 flex items-center justify-between gap-3`}>
            <div className="text-sm">
              <p className="font-semibold">{formatLong(s.date)} · +{s.shift_days} day{s.shift_days === 1 ? "" : "s"}</p>
              <p className="text-slate-600">{s.zips.length ? s.zips.join(", ") : "All ZIPs"}{s.note ? ` · ${s.note}` : ""}</p>
            </div>
            <form action={deleteShift}>
              <input type="hidden" name="id" value={s.id} />
              <button className="text-sm text-red-700 underline">Remove</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
