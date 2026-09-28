"use client";
import { useState } from "react";
import { IconX, IconQrcode, IconMapPinCheck } from "@tabler/icons-react";
import { DemoState, ENCLOSURES, PROPERTY, fmtTime, serviceNights } from "@/lib/demo/store";
type PhotoKind = "violation" | "bulk" | "pad";
import { C, Card, Pill } from "@/components/demo/ui";

interface PhotoEntry {
  id: string;
  kind: PhotoKind;
  unit: string;
  bldgs: string[];
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

// Example photos from earlier nights (public/app/photos). Each violation
// photo is paired with the reason it shows.
// The most recent night matches the sample nightly report: same units, photos and times.
const SAMPLE_VIOLATIONS = [
  { unit: "1-5308", reason: "Boxes not broken down", src: "/app/photos/violation-boxes.jpg", night: 0, time: [19, 8] },
  { unit: "2-2104", reason: "Overflowing bin", src: "/app/photos/violation-overflowing.jpg", night: 0, time: [19, 26] },
  { unit: "6-6205", reason: "Not in bin", src: "/app/photos/violation-not-binned.jpg", night: 0, time: [19, 41] },
  { unit: "4-3201", reason: "Bag leaking", src: "/app/photos/violation-leaking.jpg", night: 0, time: [20, 3] },
];
// Each enclosure has its own photo, the same place night after night.
const PAD_PHOTOS: Record<string, string> = {
  T1: "/app/photos/pad-3.jpg",
  T2: "/app/photos/pad-1.jpg",
  T3: "/app/photos/pad-2.jpg",
  T4: "/app/photos/pad-4.jpg",
};

function earlierPhotos(): PhotoEntry[] {
  const nights = serviceNights(3);
  const at = (night: number, h: number, m: number) => {
    const d = new Date(nights[night]);
    d.setHours(h, m, 0, 0);
    return d.getTime();
  };
  const violations: PhotoEntry[] = SAMPLE_VIOLATIONS.map((v, i) => ({
    id: `s${i}`,
    kind: "violation",
    unit: v.unit,
    bldgs: [v.unit[0]],
    at: at(v.night, v.time[0], v.time[1]),
    src: v.src,
    detail: v.reason,
    night: "earlier",
  }));
  // One pad / compactor photo per trash enclosure per night, taken after the route.
  const pads: PhotoEntry[] = nights.flatMap((_, n) =>
    ENCLOSURES.map((e, i) => ({
      id: `p${n}${e.id}`,
      kind: "pad" as PhotoKind,
      unit: `Enclosure ${e.id} (Bldg ${e.buildings.join(" & ")})`,
      bldgs: e.buildings,
      at: at(n, 20, 13 + i * 3 + n), // night 0: 8:13, 8:16, 8:19, 8:22 PM as in the report
      src: PAD_PHOTOS[e.id],
      detail: "Compactor leveled · pad swept",
      night: "earlier" as const,
    })),
  );
  return [...violations, ...pads];
}

function tonightPhotos(s: DemoState): PhotoEntry[] {
  const doors: PhotoEntry[] = Object.entries(s.doors)
    .filter(([, d]) => d.status === "violation" && d.photo)
    .map(([unit, d]) => ({
      id: unit,
      kind: "violation",
      unit,
      bldgs: [unit[0]],
      at: d.at ?? 0,
      src: d.photo!,
      detail: `${d.violation}${d.note ? ` · "${d.note}"` : ""}`,
      night: "tonight",
    }));
  const bulk: PhotoEntry[] = s.bulk
    .filter((b) => b.photo)
    .map((b) => ({
      id: b.id,
      kind: "bulk",
      unit: b.location,
      bldgs: [...b.location.matchAll(/Building (\d)/g)].map((m) => m[1]),
      at: b.createdAt,
      src: b.photo!,
      detail: `${b.category} · ${b.status}`,
      night: b.createdAt >= new Date().setHours(0, 0, 0, 0) ? "tonight" : "earlier",
    }));
  const pads: PhotoEntry[] = Object.entries(s.pads)
    .filter(([, p]) => p.photo)
    .map(([id, p]) => ({
      id: `pad-${id}`,
      kind: "pad",
      unit: `Enclosure ${id} (Bldg ${ENCLOSURES.find((e) => e.id === id)?.buildings.join(" & ")})`,
      bldgs: ENCLOSURES.find((e) => e.id === id)?.buildings ?? [],
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
    (p) => (kind === "all" || p.kind === kind) && (night === "all" || p.night === night) && (bldg === "all" || p.bldgs.includes(bldg)),
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
