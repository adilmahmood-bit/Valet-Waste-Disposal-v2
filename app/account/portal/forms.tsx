"use client";
import { useActionState, useRef, useState } from "react";
import { shrinkPhoto } from "@/lib/client/shrink-photo";
import {
  addTeamMemberAction,
  removeTeamMemberAction,
  requestAccessChange,
  requestAddProperty,
  requestOverflow,
  requestPause,
  type FormResult,
} from "../actions";

const C = { navy: "#1B4F72", tealDark: "#137F8C", border: "#E7E2D8", muted: "#6b7280" };
const input = "w-full rounded-xl border px-3 py-2.5 text-[15px] bg-white";
const primary = "rounded-full text-white font-semibold px-5 py-2.5 disabled:opacity-50";
const ghost = "rounded-full border-2 font-semibold px-4 py-2 disabled:opacity-50";

function Result({ state, sent }: { state: FormResult; sent: string }) {
  if (state?.error) return <p className="text-sm text-red-700" role="alert">{state.error}</p>;
  if (state?.ok) return <p className="text-sm text-green-800" role="status">{sent}</p>;
  return null;
}

// "Request a change" under Access. Opens inline.
export function AccessRequestForm({ addressId, currentNotes }: { addressId: string; currentNotes: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(requestAccessChange, null);
  if (state?.ok) return <Result state={state} sent="Sent. We'll update it and let you know." />;
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${ghost} w-full`} style={{ borderColor: C.navy, color: C.navy }}>
        Request an access change
      </button>
    );
  return (
    <form action={action} className="space-y-2 rounded-xl border p-3" style={{ borderColor: C.border }}>
      <input type="hidden" name="address_id" value={addressId} />
      <label className="block text-sm font-semibold">
        Notes for the crew
        <textarea name="access_notes" defaultValue={currentNotes} rows={3} className={`${input} mt-1`} style={{ borderColor: C.border }} />
      </label>
      <label className="block text-sm font-semibold">
        New gate or lock code <span className="font-normal" style={{ color: C.muted }}>(leave empty to keep it)</span>
        <input name="gate_code" autoComplete="off" className={`${input} mt-1`} style={{ borderColor: C.border }} />
      </label>
      <Result state={state} sent="" />
      <div className="flex gap-2">
        <button disabled={pending} className={primary} style={{ backgroundColor: C.tealDark }}>{pending ? "Sending…" : "Send to us"}</button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 font-semibold" style={{ color: C.tealDark }}>Cancel</button>
      </div>
    </form>
  );
}

export function PauseRequestForm({ addressId, min }: { addressId: string; min: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(requestPause, null);
  if (state?.ok) return <Result state={state} sent="Pause request sent. We'll confirm it." />;
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${ghost} w-full`} style={{ borderColor: C.border, color: C.navy }}>
        Pause service for a while
      </button>
    );
  return (
    <form action={action} className="space-y-2 rounded-xl border p-3" style={{ borderColor: C.border }}>
      <input type="hidden" name="address_id" value={addressId} />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm font-semibold">
          From
          <input type="date" name="start_date" min={min} required className={`${input} mt-1`} style={{ borderColor: C.border }} />
        </label>
        <label className="text-sm font-semibold">
          To
          <input type="date" name="end_date" min={min} required className={`${input} mt-1`} style={{ borderColor: C.border }} />
        </label>
      </div>
      <p className="text-xs" style={{ color: C.muted }}>Up to 60 days. No charge while paused.</p>
      <Result state={state} sent="" />
      <div className="flex gap-2">
        <button disabled={pending} className={primary} style={{ backgroundColor: C.tealDark }}>{pending ? "Sending…" : "Request pause"}</button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 font-semibold" style={{ color: C.tealDark }}>Cancel</button>
      </div>
    </form>
  );
}

export function OverflowForm({
  properties,
  firstCan,
  perBag,
  initial,
}: {
  properties: { id: string; label: string }[];
  firstCan: number;
  perBag: number;
  initial?: string;
}) {
  const [bags, setBags] = useState(7);
  const [result, setResult] = useState<FormResult>(null);
  const [pending, setPending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const price = firstCan + Math.max(0, bags - 7) * perBag;

  async function submit(form: FormData) {
    setPending(true);
    setResult(null);
    try {
      const f = fileRef.current?.files?.[0];
      form.delete("photo");
      if (f) form.set("photo", await shrinkPhoto(f), "photo.jpg");
      setResult(await requestOverflow(null, form));
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "Sending failed. Try again, or text us." });
    }
    setPending(false);
  }

  if (result?.ok)
    return (
      <div className="rounded-2xl p-4 bg-green-50 border border-green-200 text-green-900" role="status">
        <p className="font-semibold">Request sent.</p>
        <p className="text-sm mt-1">We&apos;ll confirm the pickup time by text and send you a photo when it&apos;s done.</p>
      </div>
    );

  return (
    <form action={submit} className="space-y-3">
      <label className="block text-sm font-semibold">
        Property
        <select name="address_id" defaultValue={initial ?? properties[0]?.id} className={`${input} mt-1`} style={{ borderColor: C.border }}>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold">
        About how many 13-gallon bags?
        <div className="mt-1 flex items-center gap-2">
          <button type="button" onClick={() => setBags((b) => Math.max(1, b - 1))} className="w-10 h-10 rounded-full border text-lg" style={{ borderColor: C.border }} aria-label="Fewer bags">−</button>
          <input name="bags" type="number" min={1} max={60} value={bags} onChange={(e) => setBags(Math.max(1, Math.min(60, Number(e.target.value) || 1)))} className={`${input} w-20 text-center`} style={{ borderColor: C.border }} />
          <button type="button" onClick={() => setBags((b) => Math.min(60, b + 1))} className="w-10 h-10 rounded-full border text-lg" style={{ borderColor: C.border }} aria-label="More bags">+</button>
          <span className="text-sm" style={{ color: C.muted }}>A full 95-gallon can is about 7 bags.</span>
        </div>
      </label>
      <fieldset className="text-sm">
        <legend className="font-semibold">When</legend>
        <label className="mt-1 flex items-center gap-2"><input type="radio" name="when" value="24h" defaultChecked /> Within 24 hours</label>
        <label className="mt-1 flex items-center gap-2"><input type="radio" name="when" value="next" /> With the next scheduled visit</label>
      </fieldset>
      <label className="block text-sm font-semibold">
        Notes <span className="font-normal" style={{ color: C.muted }}>(where the bags are, gate, timing)</span>
        <input name="notes" className={`${input} mt-1`} style={{ borderColor: C.border }} />
      </label>
      <label className="block text-sm font-semibold">
        Photo <span className="font-normal" style={{ color: C.muted }}>(optional, helps us bring the right truck)</span>
        <input ref={fileRef} type="file" accept="image/*" className="mt-1 block w-full text-sm" />
      </label>
      <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: "#eef7f8" }}>
        Estimate: <strong>${price.toFixed(2).replace(/\.00$/, "")}</strong> ({bags <= 7 ? "first can" : `first can + ${bags - 7} extra bag${bags - 7 === 1 ? "" : "s"}`}). Billed after the pickup.
      </div>
      {result?.error && <p className="text-sm text-red-700" role="alert">{result.error}</p>}
      <button disabled={pending} className={primary} style={{ backgroundColor: C.tealDark }}>{pending ? "Sending…" : "Request pickup"}</button>
    </form>
  );
}

export function AddPropertyForm() {
  const [state, action, pending] = useActionState(requestAddProperty, null);
  if (state?.ok)
    return (
      <div className="rounded-2xl p-4 bg-green-50 border border-green-200 text-green-900" role="status">
        <p className="font-semibold">Got it.</p>
        <p className="text-sm mt-1">We&apos;ll check the address and text you to confirm the price and first service day.</p>
      </div>
    );
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold sm:col-span-2">
        Street address
        <input name="street" required autoComplete="address-line1" className={`${input} mt-1`} style={{ borderColor: C.border }} />
      </label>
      <label className="text-sm font-semibold">
        City
        <input name="city" required defaultValue="San Diego" autoComplete="address-level2" className={`${input} mt-1`} style={{ borderColor: C.border }} />
      </label>
      <label className="text-sm font-semibold">
        ZIP
        <input name="zip" required inputMode="numeric" pattern="\d{5}" maxLength={5} autoComplete="postal-code" className={`${input} mt-1`} style={{ borderColor: C.border }} />
      </label>
      <label className="text-sm font-semibold">
        Trash day
        <select name="trash_day" className={`${input} mt-1`} style={{ borderColor: C.border }}>
          {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => <option key={d}>{d}</option>)}
        </select>
      </label>
      <label className="text-sm font-semibold">
        Number of cans
        <input name="bins" type="number" min={1} max={8} defaultValue={3} className={`${input} mt-1`} style={{ borderColor: C.border }} />
      </label>
      <label className="text-sm font-semibold sm:col-span-2">
        Where the cans are, and access notes
        <input name="access_notes" placeholder="Side gate on the left" className={`${input} mt-1`} style={{ borderColor: C.border }} />
      </label>
      <label className="text-sm font-semibold sm:col-span-2">
        Gate or lock code <span className="font-normal" style={{ color: C.muted }}>(optional, stored encrypted)</span>
        <input name="gate_code" autoComplete="off" className={`${input} mt-1`} style={{ borderColor: C.border }} />
      </label>
      <div className="sm:col-span-2">
        <Result state={state} sent="" />
        <button disabled={pending} className={primary} style={{ backgroundColor: C.tealDark }}>{pending ? "Sending…" : "Add property"}</button>
      </div>
    </form>
  );
}

export function TeamForm() {
  const [state, action, pending] = useActionState(addTeamMemberAction, null);
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] items-end">
      <label className="text-sm font-semibold">
        Name
        <input name="name" required placeholder="Maria (cleaner)" className={`${input} mt-1`} style={{ borderColor: C.border }} />
      </label>
      <label className="text-sm font-semibold">
        Email
        <input name="email" type="email" className={`${input} mt-1`} style={{ borderColor: C.border }} />
      </label>
      <label className="text-sm font-semibold">
        Mobile
        <input name="phone" type="tel" className={`${input} mt-1`} style={{ borderColor: C.border }} />
      </label>
      <button disabled={pending} className={primary} style={{ backgroundColor: C.tealDark }}>{pending ? "Adding…" : "Add"}</button>
      <div className="sm:col-span-4"><Result state={state} sent="Added." /></div>
    </form>
  );
}

export function RemoveTeamButton({ id, name }: { id: string; name: string }) {
  return (
    <form action={removeTeamMemberAction}>
      <input type="hidden" name="id" value={id} />
      <button className="text-sm font-semibold text-red-700" aria-label={`Remove ${name}`}>Remove</button>
    </form>
  );
}

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="rounded-lg border px-3 py-2 text-sm bg-white break-all" style={{ borderColor: C.border }}>{url}</code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(`https://${url}`);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
        className={primary}
        style={{ backgroundColor: C.tealDark }}
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
