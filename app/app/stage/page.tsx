"use client";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { C, LogoMark, ResetButton } from "@/components/demo/ui";

// Presenter view: each role runs in its own frame; they share localStorage,
// so actions in one frame show up in the others instantly.
const FRAMES = [
  { src: "/app/porter", label: "Attendant", w: 390 },
  { src: "/app/resident", label: "Resident · 5-4105", w: 390 },
  { src: "/app/manager", label: "Property Manager", w: 0 },
];

export default function Stage() {
  return (
    <div className="min-h-dvh flex flex-col" style={{ backgroundColor: C.navyDeep }}>
      <div className="flex items-center gap-3 px-4 h-12 text-white">
        <Link href="/app" className="flex items-center gap-1 text-sm opacity-80 hover:opacity-100">
          <IconArrowLeft size={16} /> Demo home
        </Link>
        <LogoMark size={30} />
        <span className="font-heading text-sm">Presenter view</span>
        <span className="ml-auto">
          <ResetButton className="!text-white/70" />
        </span>
      </div>
      <div className="flex-1 flex gap-4 px-4 pb-4 min-h-0 overflow-x-auto">
        {FRAMES.map((f) => (
          <div key={f.src} className="flex flex-col min-w-0" style={f.w ? { width: f.w, flex: "none" } : { flex: 1, minWidth: 520 }}>
            <div className="text-xs font-semibold uppercase tracking-wider py-1.5" style={{ color: C.tealSoft }}>
              {f.label}
            </div>
            <iframe src={f.src} title={f.label} className="flex-1 w-full rounded-2xl bg-white" style={{ minHeight: 760 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
