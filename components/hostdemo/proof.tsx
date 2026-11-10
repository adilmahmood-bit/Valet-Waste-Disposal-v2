"use client";
import { useState } from "react";
import { IconCopy, IconDownload, IconExternalLink } from "@tabler/icons-react";
import { Btn, C, LogoMark } from "@/components/demo/ui";
import { CurbPhoto, Modal } from "@/components/hostdemo/parts";
import {
  CONTACT_PHONE,
  CITY_RULES_CHECKED,
  Property,
  cityFor,
  compliance,
  completedServices,
  fmtDate,
  fmtTime,
  rulesFor,
} from "@/lib/hostdemo/data";

// Service proof report: the same content for the share page and the PDF (printed from
// the share page). Never shows gate or padlock codes, the host's contact details or billing.

export const proofSlug = (p: Property) => p.photo ?? p.id;

export interface ProofRange {
  from: number;
  to: number;
  photos: boolean;
}

export function proofPath(p: Property, r: ProofRange, print = false) {
  const q = new URLSearchParams({ from: isoDay(r.from), to: isoDay(r.to), photos: r.photos ? "1" : "0" });
  if (print) q.set("print", "1");
  return `/hosts/portal/proof/${proofSlug(p)}?${q}`;
}

export const isoDay = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const fromIso = (s: string, endOfDay = false) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, endOfDay ? 23 : 0, endOfDay ? 59 : 0).getTime();
};

const fmtLong = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function ProofReport({ p, range, publicView }: { p: Property; range: ProofRange; publicView?: boolean }) {
  const rows = completedServices(p).filter((e) => e.date >= range.from && e.date <= range.to);
  const onTime = rows.filter((e) => compliance(p.area, e) === "ok").length;
  const pct = rows.length ? Math.round((onTime / rows.length) * 100) : 100;
  const rules = rulesFor(p.area);
  const generated = new Date();

  return (
    <article className="bg-white rounded-2xl border print:border-0 print:rounded-none p-5 sm:p-8 text-[13px] sm:text-sm" style={{ borderColor: C.border }}>
      <header className="flex flex-wrap items-start gap-4 pb-4 border-b" style={{ borderColor: C.border }}>
        <span className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 print:[print-color-adjust:exact]" style={{ backgroundColor: C.navy }}>
          <LogoMark size={34} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: C.teal }}>
            Doorstep Disposal
          </div>
          <h1 className="font-heading text-xl sm:text-2xl" style={{ color: C.navy }}>
            Service Verification Report
          </h1>
          <div className="mt-1 font-semibold">{p.nickname}</div>
          <div style={{ color: C.muted }}>
            {p.address}, {p.area}
          </div>
        </div>
        <div className="text-xs sm:text-right" style={{ color: C.muted }}>
          <div>
            {fmtLong(range.from)} – {fmtLong(range.to)}
          </div>
          <div>
            Generated {fmtLong(generated.getTime())}, {fmtTime(generated.getTime())}
          </div>
        </div>
      </header>

      <p className="mt-4 text-base font-semibold" style={{ color: C.navy }}>
        {rows.length} of {rows.length} scheduled services completed · {pct}% on time
      </p>
      <p className="mt-1 text-xs" style={{ color: C.muted }}>
        Checked against {cityFor(p.area)} rules: {rules.curbOut.toLowerCase()}, {rules.curbIn.toLowerCase()}
        {rules.verified ? "." : " (general guidance)."}
      </p>

      {rows.length === 0 ? (
        <p className="mt-6" style={{ color: C.muted }}>
          No completed services in this date range.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto print:overflow-visible">
          <table className="w-full min-w-[560px] print:min-w-0 border-collapse">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider" style={{ color: C.muted }}>
                <th className="py-2 pr-3 font-semibold">Date</th>
                <th className="py-2 pr-3 font-semibold">Cans out</th>
                <th className="py-2 pr-3 font-semibold">Collected</th>
                <th className="py-2 pr-3 font-semibold">Cans back in</th>
                {range.photos && <th className="py-2 pr-3 font-semibold">Photos</th>}
                <th className="py-2 pr-3 font-semibold">City rules</th>
                <th className="py-2 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const c = compliance(p.area, e);
                return (
                  <tr key={e.id} className="border-t align-top break-inside-avoid" style={{ borderColor: C.border }}>
                    <td className="py-2.5 pr-3 font-semibold whitespace-nowrap">{fmtDate(e.date)}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      {new Date(e.outAt).toLocaleDateString("en-US", { weekday: "short" })} {fmtTime(e.outAt)}
                    </td>
                    <td className="py-2.5 pr-3 whitespace-nowrap">{e.collectedAt ? `✓ ${fmtTime(e.collectedAt)}` : "✓"}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      {new Date(e.inAt).toLocaleDateString("en-US", { weekday: "short" })} {fmtTime(e.inAt)}
                    </td>
                    {range.photos && (
                      <td className="py-2.5 pr-3">
                        <div className="flex gap-2">
                          {(["out", "in"] as const).map((k) => (
                            <figure key={k} className="w-24 sm:w-28">
                              <div className="rounded-md overflow-hidden border" style={{ borderColor: C.border }}>
                                <CurbPhoto seed={p.seed} kind={k} cans={p.cans} photo={p.photo} />
                              </div>
                              <figcaption className="mt-0.5 text-[9.5px] leading-tight" style={{ color: C.muted }}>
                                📍 Verified at property · {fmtTime(k === "out" ? e.outAt : e.inAt)}
                              </figcaption>
                            </figure>
                          ))}
                        </div>
                      </td>
                    )}
                    <td className="py-2.5 pr-3 whitespace-nowrap font-semibold" style={{ color: c === "ok" ? C.green : C.amber }}>
                      {c === "ok" ? "✅ On time" : "⚠️ Late return"}
                    </td>
                    <td className="py-2.5 text-xs" style={{ color: C.muted }}>
                      {e.note ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <footer className="mt-6 pt-4 border-t text-xs leading-relaxed" style={{ borderColor: C.border, color: C.muted }}>
        Photos are timestamped and location-verified by Doorstep Disposal, a locally operated service in San Diego. Questions: {CONTACT_PHONE}.
        {rules.verified && (
          <>
            {" "}
            {cityFor(p.area)} rules from the {rules.source}, checked {CITY_RULES_CHECKED}.
          </>
        )}
        {publicView && <div className="mt-3 font-semibold" style={{ color: C.navy }}>Powered by Doorstep Disposal</div>}
      </footer>
    </article>
  );
}

// ---------- modal used on the dashboard and property detail ----------

const DAY = 86_400_000;

export function ProofModal({ p, onClose }: { p: Property; onClose: () => void }) {
  const [preset, setPreset] = useState<"4" | "8" | "custom">("8");
  const [today] = useState(() => Date.now());
  const [from, setFrom] = useState(isoDay(today - 56 * DAY));
  const [to, setTo] = useState(isoDay(today));
  const [photos, setPhotos] = useState(true);
  const [toast, setToast] = useState("");

  const range: ProofRange =
    preset === "custom" ? { from: fromIso(from), to: fromIso(to, true), photos } : { from: today - Number(preset) * 7 * DAY - DAY, to: today, photos };
  const share = () => `${location.origin}${proofPath(p, range)}`;

  return (
    <Modal title="Proof of service" onClose={onClose}>
      <p className="text-sm -mt-2 mb-4" style={{ color: C.muted }}>
        Timestamped, location-verified photos for {p.nickname}. Send it to a neighbor, HOA or city inspector. Gate codes and billing are never included.
      </p>
      <div className="text-xs font-semibold mb-1.5">Date range</div>
      <div className="flex flex-wrap gap-2">
        {[
          { id: "4" as const, label: "Last 4 weeks" },
          { id: "8" as const, label: "Last 8 weeks" },
          { id: "custom" as const, label: "Custom" },
        ].map((o) => (
          <button
            key={o.id}
            onClick={() => setPreset(o.id)}
            className="rounded-xl border px-3 py-2 text-sm font-semibold"
            style={preset === o.id ? { backgroundColor: C.teal, borderColor: C.teal, color: "#fff" } : { borderColor: C.border, backgroundColor: "#fff" }}
          >
            {o.label}
          </button>
        ))}
      </div>
      {preset === "custom" && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-xs font-semibold">
            From
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm font-normal" style={{ borderColor: C.border }} />
          </label>
          <label className="text-xs font-semibold">
            To
            <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm font-normal" style={{ borderColor: C.border }} />
          </label>
        </div>
      )}
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" className="h-4 w-4 accent-[#0E9AA7]" checked={photos} onChange={(e) => setPhotos(e.target.checked)} />
        Include photos
      </label>
      <div className="mt-5 grid sm:grid-cols-2 gap-2">
        <Btn variant="navy" onClick={() => window.open(proofPath(p, range, true), "_blank", "noopener")}>
          <span className="inline-flex items-center gap-1.5">
            <IconDownload size={16} /> Download PDF
          </span>
        </Btn>
        <Btn
          variant="ghost"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(share());
            } catch {}
            setToast("Link copied. Anyone with this link can view this report.");
          }}
        >
          <span className="inline-flex items-center gap-1.5">
            <IconCopy size={16} /> Copy share link
          </span>
        </Btn>
      </div>
      <a href={proofPath(p, range)} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2" style={{ color: C.teal }}>
        <IconExternalLink size={14} /> Preview the shared report
      </a>
      {toast && (
        <p className="mt-3 rounded-xl px-3 py-2 text-sm font-medium" role="status" style={{ backgroundColor: "#ecfdf5", color: C.green }}>
          {toast}
        </p>
      )}
    </Modal>
  );
}
