"use client";
import { useEffect, useState } from "react";
import { IconCheck, IconMaximize, IconX } from "@tabler/icons-react";
import { BUILDING_POS, DemoState, ENCLOSURES, PROPERTY, fmtTime, unitsFor } from "@/lib/demo/store";
import { C } from "@/components/demo/ui";

const RATIO = 1293 / 684; // site map image, width / height

type Props = {
  s: DemoState;
  selected?: string;
  onSelect?: (building: string) => void;
};

// The property's own site map, with live status laid over each building and
// trash enclosure. Shared by the manager portal (view only) and the attendant
// app, where tapping a building opens its route. Either can expand it to full
// screen.
export default function SiteMap(props: Props) {
  const [full, setFull] = useState(false);
  return (
    <>
      <div className="relative">
        <MapCanvas {...props} />
        <button
          type="button"
          onClick={() => setFull(true)}
          aria-label="Show map full screen"
          className="absolute top-1.5 right-1.5 rounded-lg p-1.5 bg-white/90 shadow"
          style={{ color: C.navy }}
        >
          <IconMaximize size={18} />
        </button>
      </div>
      {full && (
        <FullScreenMap
          {...props}
          onSelect={props.onSelect ? (b) => (props.onSelect!(b), setFull(false)) : undefined}
          onClose={() => setFull(false)}
        />
      )}
    </>
  );
}

// Full-screen view. The map is landscape, so on a portrait screen it's turned
// 90° to use the full height; the viewer rotates the phone to read it.
function FullScreenMap({ onClose, ...props }: Props & { onClose: () => void }) {
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    const check = () => setPortrait(window.innerHeight > window.innerWidth);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    check();
    window.addEventListener("resize", check);
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  // Largest map that fits the screen with a 16px margin, in either orientation.
  const width = portrait
    ? `min(calc(100dvh - 32px), calc((100vw - 32px) * ${RATIO}))`
    : `min(calc(100vw - 32px), calc((100dvh - 32px) * ${RATIO}))`;

  return (
    <div className="fixed inset-0 z-50" style={{ backgroundColor: "rgba(10, 25, 40, 0.94)" }} role="dialog" aria-label="Site map, full screen">
      <div
        className="absolute left-1/2 top-1/2"
        style={{ width, transform: `translate(-50%, -50%)${portrait ? " rotate(90deg)" : ""}` }}
      >
        <MapCanvas {...props} large />
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close full-screen map"
        className="absolute rounded-full p-2 bg-white shadow-lg"
        style={{ top: "calc(12px + env(safe-area-inset-top, 0px))", right: 12, color: C.navy }}
      >
        <IconX size={22} />
      </button>
    </div>
  );
}

function MapCanvas({ s, selected, onSelect, large }: Props & { large?: boolean }) {
  const a = s.attendant;
  const at = a.status === "onsite" ? BUILDING_POS[a.building ?? "1"] : null;
  const label = large ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs";
  const count = large ? "text-[11px] sm:text-xs" : "text-[9px] sm:text-[11px]";
  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: `${RATIO}` }}>
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
            <div className={`${label} font-bold whitespace-nowrap`}>Bldg {b}</div>
            <div className={`${count} whitespace-nowrap opacity-90`}>
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
