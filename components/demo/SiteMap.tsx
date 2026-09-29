"use client";
import { IconCheck } from "@tabler/icons-react";
import { BUILDING_POS, DemoState, ENCLOSURES, PROPERTY, fmtTime, unitsFor } from "@/lib/demo/store";
import { C } from "@/components/demo/ui";

// The property's own site map, with live status laid over each building and
// trash enclosure. Positions are percentages of the image. Shared by the
// manager portal (view only) and the attendant app, where tapping a building
// opens its route.
export default function SiteMap({
  s,
  selected,
  onSelect,
}: {
  s: DemoState;
  selected?: string;
  onSelect?: (building: string) => void;
}) {
  const a = s.attendant;
  const at = a.status === "onsite" ? BUILDING_POS[a.building ?? "1"] : null;
  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "1293 / 684" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/app/site-map.webp" alt={`${PROPERTY.name} site map`} className="absolute inset-0 w-full h-full" />
      {PROPERTY.buildings.map((b) => {
        const units = PROPERTY.floors.flatMap((f) => unitsFor(b, f));
        const done = units.filter((u) => s.doors[u] && s.doors[u].status !== "pending").length;
        const viol = units.filter((u) => s.doors[u]?.status === "violation").length;
        const complete = done === units.length;
        const { x, y } = BUILDING_POS[b];
        const Tag = onSelect ? "button" : "div";
        return (
          <Tag
            key={b}
            {...(onSelect ? { type: "button" as const, onClick: () => onSelect(b), "aria-label": `Open Building ${b} route` } : {})}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg px-1.5 py-0.5 text-center shadow-md leading-tight"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              backgroundColor: complete ? C.green : done ? C.teal : C.navy,
              color: "#fff",
              outline: selected === b ? `2px solid ${C.accent}` : undefined,
              outlineOffset: 2,
            }}
          >
            <div className="text-[10px] sm:text-xs font-bold whitespace-nowrap">Bldg {b}</div>
            <div className="text-[9px] sm:text-[11px] whitespace-nowrap opacity-90">
              {done}/{units.length}
              {viol ? ` · ${viol}⚠` : ""}
            </div>
          </Tag>
        );
      })}
      {ENCLOSURES.map((e) => {
        const pad = s.pads[e.id];
        return (
          <div
            key={e.id}
            title={pad ? `Enclosure ${e.id} clear at ${fmtTime(pad.at)}` : `Enclosure ${e.id} not checked yet`}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow"
            style={{ left: `${e.x}%`, top: `${e.y}%`, backgroundColor: pad ? C.green : "#9ca3af" }}
          >
            {pad ? <IconCheck size={14} /> : e.id}
          </div>
        );
      })}
      {at && (
        <span
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 pointer-events-none"
          style={{ left: `${at.x}%`, top: `calc(${at.y}% - 26px)` }}
          aria-label={`${a.name} at Building ${a.building}`}
        >
          <span className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: C.accent, opacity: 0.5 }} />
          <span className="relative block w-4 h-4 rounded-full border-2 border-white shadow" style={{ backgroundColor: C.accent }} />
        </span>
      )}
      <div className="absolute bottom-1.5 left-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] sm:text-[11px] bg-white/90 rounded-lg px-1.5 py-0.5">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: C.accent }} /> Attendant
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded" style={{ backgroundColor: C.green }} /> Building done
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: C.green }} /> Enclosure clear
        </span>
      </div>
    </div>
  );
}
