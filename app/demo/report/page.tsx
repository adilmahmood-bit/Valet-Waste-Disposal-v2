import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { C } from "@/components/demo/ui";

export const metadata: Metadata = {
  title: "Nightly Report | Valet Waste Disposal",
  description: "Sample nightly completion report emailed to property managers after every service night.",
  robots: { index: false, follow: false },
};

// The report is a self-contained HTML file (styles and photos embedded) served from
// /public/demo. Rendering it in an iframe keeps its styles scoped away from the site.
export default function NightlyReport() {
  return (
    <div className="min-h-dvh flex flex-col" style={{ backgroundColor: C.surface }}>
      <header className="text-white" style={{ backgroundColor: C.navy }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/demo" className="flex items-center gap-1 text-sm text-white/80 hover:text-white">
            <IconArrowLeft size={18} /> Demo
          </Link>
          <span className="font-heading text-lg ml-2">Nightly Report</span>
          <span className="ml-auto text-xs text-white/70 hidden sm:inline">Sample data · Center City Apartments</span>
        </div>
      </header>
      <iframe
        src="/demo/nightly-report.html"
        title="Sample nightly completion report"
        className="flex-1 w-full border-0"
        style={{ minHeight: "calc(100dvh - 52px)" }}
      />
    </div>
  );
}
