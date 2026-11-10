"use client";
import { useState } from "react";
import { IconLock, IconMapPinCheck, IconX, IconLoader2, IconCircleCheck } from "@tabler/icons-react";
import { C, Btn } from "@/components/demo/ui";
import { Can, fmtDate, fmtTime, receiptId } from "@/lib/hostdemo/data";

// ---------- placeholder service photos ----------

const HOUSE = ["#F4EFE6", "#E8F1F2", "#FBF3E4", "#EEF0F3", "#F3ECE4", "#E9F2EA", "#F6EEF0"];
const ROOF = ["#B5523B", "#4B5563", "#8A5A44", "#374151", "#A0522D", "#57534E", "#6B7280"];
const DOOR = ["#1B4F72", "#7C4A2D", "#0E9AA7", "#3F3F46", "#9A3412", "#14532D", "#1E3A8A"];
const CAN_FILL: Record<Can, string> = { trash: "#4B5563", recycle: "#1D4ED8", green: "#3F6212" };

function CanShape({ x, y, w, fill }: { x: number; y: number; w: number; fill: string }) {
  const h = w * 1.45;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={w * 0.12} fill={fill} />
      <rect x={x - w * 0.06} y={y - w * 0.12} width={w * 1.12} height={w * 0.18} rx={w * 0.05} fill={fill} stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
      <circle cx={x + w * 0.2} cy={y + h} r={w * 0.13} fill="#111" />
    </g>
  );
}

// The property's real photo when it has one (public/hosts/portal/<photo>-out.jpg / -in.jpg),
// otherwise an illustrated curbside scene: cans at the curb ("out") or tucked by the side gate ("in").
export function CurbPhoto({ seed, kind, cans, at, photo, className = "" }: { seed: number; kind: "out" | "in"; cans: Can[]; at?: number; photo?: string; className?: string }) {
  if (photo)
    return (
      <div className={`relative ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/hosts/portal/${photo}-${kind}.jpg`} alt={kind === "out" ? "Cans at the curb" : "Cans back in"} className="block w-full aspect-video object-cover" loading="lazy" />
        {at && (
          <span className="absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[10px] sm:text-xs font-mono text-white" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
            {fmtDate(at)} · {fmtTime(at)}
          </span>
        )}
      </div>
    );
  const i = (seed - 1 + HOUSE.length) % HOUSE.length;
  return (
    <svg viewBox="0 0 320 200" className={`block w-full h-auto ${className}`} role="img" aria-label={kind === "out" ? "Cans at the curb" : "Cans back in"}>
      <defs>
        <linearGradient id={`sky${seed}${kind}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={kind === "out" ? "#F6B98B" : "#9ED3F0"} />
          <stop offset="1" stopColor={kind === "out" ? "#FBE3CC" : "#DCEFF8"} />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#sky${seed}${kind})`} />
      {/* palms */}
      <rect x="26" y="40" width="5" height="88" fill="#6B4F35" />
      <path d="M28 42 q-22 -6 -30 8 M28 42 q22 -8 30 6 M28 42 q-12 -18 -26 -14 M28 42 q14 -18 28 -12" stroke="#2F6B3A" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* house */}
      <rect x="70" y="78" width="190" height="62" fill={HOUSE[i]} stroke="rgba(0,0,0,0.08)" />
      <polygon points="60,80 165,38 270,80" fill={ROOF[i]} />
      <rect x="152" y="100" width="20" height="40" fill={DOOR[i]} />
      <rect x="88" y="92" width="38" height="24" fill="#CFE6F2" stroke="#fff" strokeWidth="3" />
      <rect x="196" y="92" width="44" height="24" fill="#CFE6F2" stroke="#fff" strokeWidth="3" />
      {kind === "out" && (
        <>
          <rect x="91" y="95" width="32" height="18" fill="#F9D58C" opacity="0.7" />
          <rect x="199" y="95" width="38" height="18" fill="#F9D58C" opacity="0.7" />
        </>
      )}
      {/* side gate */}
      <rect x="260" y="104" width="34" height="36" fill="#A47148" />
      <line x1="277" y1="104" x2="277" y2="140" stroke="#7C5232" strokeWidth="2" />
      {/* lawn, walk, sidewalk, curb, street */}
      <rect x="0" y="140" width="320" height="18" fill="#7FB069" />
      <polygon points="152,140 172,140 176,158 148,158" fill="#D9D4CA" />
      <rect x="0" y="158" width="320" height="10" fill="#D9D4CA" />
      <rect x="0" y="168" width="320" height="4" fill="#B8B2A6" />
      <rect x="0" y="172" width="320" height="28" fill="#5B6168" />
      <rect x="20" y="184" width="40" height="3" fill="#E5E7EB" opacity="0.6" />
      <rect x="140" y="184" width="40" height="3" fill="#E5E7EB" opacity="0.6" />
      <rect x="260" y="184" width="40" height="3" fill="#E5E7EB" opacity="0.6" />
      {kind === "out"
        ? cans.map((c, n) => <CanShape key={c} x={196 + n * 30} y={136} w={22} fill={CAN_FILL[c]} />)
        : cans.map((c, n) => <CanShape key={c} x={262 + n * 13} y={124} w={11} fill={CAN_FILL[c]} />)}
      {at && (
        <g>
          <rect x="6" y="6" width="132" height="18" rx="4" fill="rgba(0,0,0,0.55)" />
          <text x="12" y="19" fill="#fff" fontSize="10.5" fontFamily="ui-monospace, monospace">
            {fmtDate(at)} · {fmtTime(at)}
          </text>
        </g>
      )}
    </svg>
  );
}

// ---------- modal shell ----------

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div
        className={`w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-md"} max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5`}
        style={{ backgroundColor: C.surface }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-heading text-lg flex-1" style={{ color: C.navy }}>
            {title}
          </h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-black/5">
            <IconX size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------- lightbox ----------

export function Lightbox({ seed, kind, cans, at, photo, title, onClose }: { seed: number; kind: "out" | "in"; cans: Can[]; at: number; photo?: string; title: string; onClose: () => void }) {
  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: C.border }}>
        <CurbPhoto seed={seed} kind={kind} cans={cans} at={at} photo={photo} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="font-semibold">{kind === "out" ? "Cans out at curb" : "Cans back in"}</span>
        <span style={{ color: C.muted }}>
          {fmtDate(at)} at {fmtTime(at)}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold" style={{ color: C.green }}>
          <IconMapPinCheck size={16} /> Verified at property
        </span>
      </div>
      <p className="mt-2 text-xs" style={{ color: C.muted }}>
        Taken on site by your attendant, stamped with time and GPS.
      </p>
    </Modal>
  );
}

// ---------- Square checkout (simulated) ----------

export function SquareBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
      <span className="inline-block w-3.5 h-3.5 rounded-[3px] border-2" style={{ borderColor: "#111" }} aria-hidden="true" />
      <IconLock size={13} /> Secured by Square
    </span>
  );
}

// Mimics the Square Web Payments card form. Any input "succeeds" after a short spinner.
export function SquareCardForm({ amountLabel, cta, onDone }: { amountLabel?: string; cta: string; onDone: (receipt: string, last4: string) => void }) {
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [zip, setZip] = useState("");
  const [busy, setBusy] = useState(false);
  const field = "w-full bg-white px-3 py-2.5 text-sm outline-none";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const last4 = card.replace(/\D/g, "").slice(-4) || "4242";
    setTimeout(() => onDone(receiptId(), last4.padStart(4, "0")), 1200);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#D1D5DB" }}>
        <input
          className={field}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Card number"
          value={card}
          onChange={(e) => setCard(e.target.value.replace(/[^\d ]/g, "").slice(0, 19))}
          aria-label="Card number"
        />
        <div className="grid grid-cols-3 border-t" style={{ borderColor: "#D1D5DB" }}>
          <input className={field} placeholder="MM/YY" autoComplete="off" value={exp} onChange={(e) => setExp(e.target.value.slice(0, 5))} aria-label="Expiry" />
          <input className={`${field} border-l`} style={{ borderColor: "#D1D5DB" }} placeholder="CVV" autoComplete="off" inputMode="numeric" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} aria-label="CVV" />
          <input className={`${field} border-l`} style={{ borderColor: "#D1D5DB" }} placeholder="ZIP" autoComplete="off" inputMode="numeric" value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))} aria-label="ZIP" />
        </div>
      </div>
      <Btn type="submit" variant="navy" className="w-full" disabled={busy}>
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <IconLoader2 size={16} className="animate-spin" /> Processing…
          </span>
        ) : (
          `${cta}${amountLabel ? ` ${amountLabel}` : ""}`
        )}
      </Btn>
      <div className="text-center">
        <SquareBadge />
      </div>
    </form>
  );
}

// "Charge the card on file" step with a short spinner.
export function ChargeOnFile({ brand, last4, amountLabel, onDone, onUseOther }: { brand: string; last4: string; amountLabel: string; onDone: (receipt: string) => void; onUseOther: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-white px-4 py-3 flex items-center gap-3" style={{ borderColor: C.border }}>
        <span className="rounded-md px-2 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: "#1A1F71" }}>
          {brand.toUpperCase()}
        </span>
        <span className="text-sm font-semibold">
          {brand} •••• {last4}
        </span>
      </div>
      <Btn
        variant="navy"
        className="w-full"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setTimeout(() => onDone(receiptId()), 1200);
        }}
      >
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <IconLoader2 size={16} className="animate-spin" /> Processing…
          </span>
        ) : (
          `Confirm and pay ${amountLabel}`
        )}
      </Btn>
      <div className="flex items-center justify-between">
        <button onClick={onUseOther} className="text-xs underline underline-offset-2" style={{ color: C.navy }} disabled={busy}>
          Use a different card
        </button>
        <SquareBadge />
      </div>
    </div>
  );
}

export function ReceiptLine({ receipt }: { receipt: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-mono" style={{ backgroundColor: "#ecfdf5", color: C.green }}>
      <IconCircleCheck size={14} /> Square receipt {receipt}
    </div>
  );
}
