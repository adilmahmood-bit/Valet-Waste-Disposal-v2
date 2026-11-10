"use client";
import { useEffect, useState } from "react";
import { IconPrinter } from "@tabler/icons-react";
import { Btn, C } from "@/components/demo/ui";
import { ProofReport, fromIso, proofSlug } from "@/components/hostdemo/proof";
import { useHostDemo } from "@/lib/hostdemo/data";

const DAY = 86_400_000;

export default function ProofView({ slug, from, to, photos, print }: { slug: string; from?: string; to?: string; photos: boolean; print: boolean }) {
  const s = useHostDemo();
  const p = s?.properties.find((x) => proofSlug(x) === slug);
  const [now] = useState(() => Date.now());
  const range = {
    from: from ? fromIso(from) : now - 57 * DAY,
    to: to ? fromIso(to, true) : now,
    photos,
  };

  // "Download PDF" opens this page with print=1: print once the photos have loaded.
  useEffect(() => {
    if (!print || !p) return;
    const imgs = [...document.images].filter((i) => !i.complete);
    let left = imgs.length;
    const go = () => setTimeout(() => window.print(), 300);
    if (!left) return void go();
    const done = () => --left === 0 && go();
    imgs.forEach((i) => {
      i.loading = "eager";
      i.addEventListener("load", done, { once: true });
      i.addEventListener("error", done, { once: true });
    });
  }, [print, p]);

  return (
    <div className="min-h-dvh py-6 px-3 sm:px-6 print:p-0 print:bg-white" style={{ backgroundColor: "#eef1f4" }}>
      <div className="max-w-4xl mx-auto">
        {!s ? (
          <p className="text-center text-sm py-10" style={{ color: C.muted }}>
            Loading…
          </p>
        ) : !p ? (
          <p className="text-center text-sm py-10" style={{ color: C.muted }}>
            This report link is no longer available.
          </p>
        ) : (
          <>
            <div className="mb-3 flex justify-end print:hidden">
              <Btn variant="ghost" onClick={() => window.print()}>
                <span className="inline-flex items-center gap-1.5">
                  <IconPrinter size={16} /> Download PDF
                </span>
              </Btn>
            </div>
            <ProofReport p={p} range={range} publicView />
          </>
        )}
      </div>
    </div>
  );
}
