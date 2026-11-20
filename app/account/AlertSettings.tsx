"use client";
import { useState, useTransition } from "react";
import { saveAlerts } from "./actions";

export default function AlertSettings({ alertOut, alertBack, live }: { alertOut: boolean; alertBack: boolean; live: boolean }) {
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  return (
    <section className="rounded-2xl bg-white border border-slate-200 p-5">
      <h2 className="text-lg font-bold">Email alerts</h2>
      <p className="mt-2 text-slate-700">
        {live
          ? "Choose which visits we email you about. Each email links to the photo."
          : "Choose which visits you'd like emails about. We'll start sending them soon; photos are always here in your account."}
      </p>
      <form
        action={(form) => start(async () => { await saveAlerts(form); setSaved(true); })}
        onChange={() => setSaved(false)}
        className="mt-4 space-y-3"
      >
        <label className="flex items-center gap-3">
          <input type="checkbox" name="alert_out" defaultChecked={alertOut} className="h-5 w-5 accent-res-teal-dark" />
          <span>Cans are out at the curb</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" name="alert_back" defaultChecked={alertBack} className="h-5 w-5 accent-res-teal-dark" />
          <span>Cans are back in</span>
        </label>
        <p className="text-sm text-slate-600">If we miss a visit or spot a problem, we&apos;ll let you know the same day, whatever you choose here.</p>
        <div className="flex items-center gap-3">
          <button disabled={pending} className="rounded-full border-2 border-res-navy px-5 py-2 font-semibold hover:bg-res-navy hover:text-white disabled:opacity-60">
            {pending ? "Saving…" : "Save"}
          </button>
          {saved && <span className="text-sm text-green-800" role="status">Saved</span>}
        </div>
      </form>
    </section>
  );
}
