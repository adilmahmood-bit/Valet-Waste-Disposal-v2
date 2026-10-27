import { residential, openDecisions } from "@/config/residential";

// Demo-only strip listing the values still marked FILL IN in config/residential.ts.
export default function PlaceholderBanner() {
  if (!residential.showPlaceholderBanner) return null;
  return (
    <details className="bg-amber-100 text-amber-950 text-xs border-b border-amber-300">
      <summary className="max-w-6xl mx-auto px-4 py-2 cursor-pointer font-semibold">
        Demo: placeholder values, not final. Tap to see what&apos;s still open.
      </summary>
      <ul className="max-w-6xl mx-auto px-4 pb-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 list-disc list-inside">
        {openDecisions().map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
    </details>
  );
}
