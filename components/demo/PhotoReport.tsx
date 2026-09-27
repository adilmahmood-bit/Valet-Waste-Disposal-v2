"use client";
import { useState } from "react";
import { IconX, IconQrcode, IconMapPinCheck } from "@tabler/icons-react";
import { ALL_UNITS, DemoState, PROPERTY, fmtTime, serviceNights } from "@/lib/demo/store";
import { samplePhoto, PhotoKind } from "@/lib/demo/samplePhotos";
import { C, Card, Pill } from "@/components/demo/ui";

interface PhotoEntry {
  id: string;
  kind: PhotoKind;
  unit: string;
  bldg: string;
  at: number;
  src: string;
  detail: string;
  night: "tonight" | "earlier";
}

const KIND_META: Record<PhotoKind, { label: string; color: string; bg: string }> = {
  violation: { label: "Violation", color: C.red, bg: "#fee2e2" },
  bulk: { label: "Bulk pickup", color: C.accent, bg: "#fdf3ec" },
  pad: { label: "Pad / compactor", color: C.navy, bg: "#e0eef7" },
};

// Photos from earlier nights (illustrated samples).
function earlierPhotos(): PhotoEntry[] {
  let seed = 3;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const kinds: PhotoKind[] = ["violation", "violation", "bulk", "violation", "violation", "violation"];
  const reasons = ["Not bagged", "Bag leaking", "Out after cutoff"];
  const nights = serviceNights(3);
  const doors: PhotoEntry[] = kinds.map((kind, i) => {
    const d = new Date(nights[Math.floor(i / 2)]);
    d.setHours(19 + Math.floor(rnd() * 2), Math.floor(rnd() * 59), 0, 0);
    const unit = kind === "bulk" ? "C-110" : ALL_UNITS[Math.floor(rnd() * ALL_UNITS.length)];
    return {
      id: `s${i}`,
      kind,
      unit,
      bldg: unit[0],
      at: d.getTime(),
      // Odd seeds draw a bag, even seeds loose trash; match the image to the reason.
      src: samplePhoto(kind, kind === "violation" && reasons[i % reasons.length] === "Not bagged" ? 2 * i + 2 : 2 * i + 1),
      detail: kind === "violation" ? reasons[i % reasons.length] : "Couch and boxes, removed",
      night: "earlier",
    };
  });
  // One pad / compactor photo per building per night, taken after the route.
  const pads: PhotoEntry[] = nights.flatMap((night, n) =>
    PROPERTY.buildings.map((b, i) => {
      const d = new Date(night);
      d.setHours(20, 24 + i * 7 + n * 3, 0, 0);
      return {
        id: `p${n}${b}`,
        kind: "pad" as PhotoKind,
        unit: `Building ${b} trash pad`,
        bldg: b,
        at: d.getTime(),
        src: samplePhoto("pad", n * 3 + i),
        detail: "Compactor leveled · pad swept",
        night: "earlier" as const,
      };
    }),
  );
  return [...doors, ...pads];
}

function tonightPhotos(s: DemoState): PhotoEntry[] {
  const doors: PhotoEntry[] = Object.entries(s.doors)
    .filter(([, d]) => d.status === "violation" && d.photo)
    .map(([unit, d]) => ({
      id: unit,
      kind: "violation",
      unit,
      bldg: unit[0],
      at: d.at ?? 0,
      src: d.photo!,
      detail: `${d.violation}${d.note ? ` · "${d.note}"` : ""}`,
      night: "tonight",
    }));
  const bulk: PhotoEntry[] = s.bulk
    .filter((b) => b.photo)
    .map((b) => ({ id: b.id, kind: "bulk", unit: b.location, bldg: "", at: b.createdAt, src: b.photo!, detail: `${b.category} · ${b.status}`, night: "tonight" }));
  const pads: PhotoEntry[] = Object.entries(s.pads)
    .filter(([, p]) => p.photo)
    .map(([b, p]) => ({
      id: `pad-${b}`,
      kind: "pad",
      unit: `Building ${b} trash pad`,
      bldg: b,
      at: p.at,
      src: p.photo!,
      detail: [p.leveled && "Compactor leveled", p.swept && "pad swept"].filter(Boolean).join(" · ") || "Pad checked",
      night: "tonight",
    }));
  return [...doors, ...bulk, ...pads];
}

export default function PhotoReport({ s }: { s: DemoState }) {
  const [kind, setKind] = useState<"all" | PhotoKind>("all");
  const [bldg, setBldg] = useState("all");
  const [night, setNight] = useState<"all" | "tonight" | "earlier">("all");
  const [open, setOpen] = useState<PhotoEntry | null>(null);

  const all = [...tonightPhotos(s), ...earlierPhotos()].sort((a, b) => b.at - a.at);
  const shown = all.filter(
    (p) => (kind === "all" || p.kind === kind) && (night === "all" || p.night === night) && (bldg === "all" || p.bldg === bldg),
  );
  const count = (k: PhotoKind) => all.filter((p) => p.kind === k).length;
  const chip = (active: boolean) =>
    active ? { backgroundColor: C.navy, color: "#fff", borderColor: C.navy } : { backgroundColor: "#fff", borderColor: C.border };
  const stamp = (t: number) => `${new Date(t).toLocaleDateString([], { month: "short", day: "numeric" })} ${fmtTime(t)}`;

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {(["pad", "violation", "bulk"] as PhotoKind[]).map((k) => (
          <Card key={k} className="!py-3">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
              {KIND_META[k].label}
            </div>
            <div className="font-heading text-2xl" style={{ color: C.navy }}>
              {count(k)}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "pad", "violation", "bulk"] as const).map((k) => (
          <button key={k} onClick={() => setKind(k)} className="rounded-full px-3 py-1.5 text-sm border font-medium" style={chip(kind === k)}>
            {k === "all" ? "All photos" : KIND_META[k].label}
          </button>
        ))}
        <span className="w-px bg-gray-300 mx-1" />
        {(["all", "tonight", "earlier"] as const).map((n) => (
          <button key={n} onClick={() => setNight(n)} className="rounded-full px-3 py-1.5 text-sm border font-medium" style={chip(night === n)}>
            {n === "all" ? "All nights" : n === "tonight" ? "Tonight" : "Earlier this week"}
          </button>
        ))}
        <select value={bldg} onChange={(e) => setBldg(e.target.value)} className="rounded-full px-3 py-1.5 text-sm border bg-white" style={{ borderColor: C.border }}>
          <option value="all">All buildings</option>
          {PROPERTY.buildings.map((b) => (
            <option key={b} value={b}>
              Building {b}
            </option>
          ))}
        </select>
      </div>

      {shown.length === 0 ? (
        <Card className="text-sm" style={{ color: C.muted }}>
          No photos match these filters. Photos appear here as soon as the attendant takes them.
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {shown.map((p) => (
            <button
              key={p.id}
              onClick={() => setOpen(p)}
              className="text-left bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-shadow"
              style={{ borderColor: C.border }}
            >
              <div className="relative aspect-[4/3] bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={`${KIND_META[p.kind].label} at ${p.unit}`} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2">
                  <Pill color={KIND_META[p.kind].color} bg={KIND_META[p.kind].bg}>
                    {KIND_META[p.kind].label}
                  </Pill>
                </span>
                <span className="absolute bottom-0 inset-x-0 px-2 py-1 text-[11px] text-white font-mono" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
                  {stamp(p.at)}
                </span>
              </div>
              <div className="p-2.5 text-xs">
                <div className="font-semibold text-sm truncate">{p.unit}</div>
                <div className="truncate" style={{ color: C.muted }}>
                  {p.detail}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative bg-gray-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={open.src} alt={`${KIND_META[open.kind].label} at ${open.unit}`} className="w-full max-h-[60vh] object-contain" />
              <button onClick={() => setOpen(null)} className="absolute top-3 right-3 rounded-full bg-white/90 p-1.5" aria-label="Close">
                <IconX size={18} />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-heading text-xl" style={{ color: C.navy }}>
                  {open.unit}
                </div>
                <Pill color={KIND_META[open.kind].color} bg={KIND_META[open.kind].bg}>
                  {KIND_META[open.kind].label}
                </Pill>
              </div>
              <div className="text-sm">{open.detail}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: C.muted }}>
                <span>
                  {new Date(open.at).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}, {fmtTime(open.at)}
                </span>
                <span>By {open.kind === "bulk" && open.night === "tonight" ? "Dana K. (request)" : s.attendant.name}</span>
                <span className="flex items-center gap-1" style={{ color: C.green }}>
                  <IconMapPinCheck size={14} /> Geofence verified
                </span>
                {open.kind === "violation" && (
                  <span className="flex items-center gap-1" style={{ color: C.green }}>
                    <IconQrcode size={14} /> QR scanned
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
