"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconExternalLink, IconSearch } from "@tabler/icons-react";
import { isServiceZip } from "@/config/residential";
import { findTrashDay, placeSuggestions, type TrashDayMatch } from "./trashDayLookup";

// City or ZIP box on /residential/trash-day. Our city pages open at their trash-day box; anywhere
// else in San Diego County shows a link to that area's hauler lookup.
export default function TrashDayFinder() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [result, setResult] = useState<TrashDayMatch | null | "none">(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const m = findTrashDay(q);
    if (m?.kind === "page") {
      router.push(`/residential/${m.slug}#trash-day`);
      return;
    }
    setResult(m ?? "none");
  }

  const zip = q.match(/\b9[12]\d{3}\b/)?.[0];
  const served = zip && isServiceZip(zip);

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2" role="search">
        <label htmlFor="trash-day-q" className="sr-only">City, neighborhood or ZIP code</label>
        <input
          id="trash-day-q"
          list="trash-day-places"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setResult(null);
          }}
          required
          placeholder="City or ZIP code"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-full border-2 border-white/30 bg-white px-5 py-3 text-base text-res-navy focus:border-res-teal focus:outline-none"
        />
        <datalist id="trash-day-places">
          {placeSuggestions.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
        <button type="submit" className="inline-flex items-center gap-1.5 rounded-full bg-res-teal-dark px-5 py-3 font-semibold text-white hover:bg-res-teal">
          <IconSearch size={18} aria-hidden="true" /> Find
        </button>
      </form>

      <div aria-live="polite">
        {result === "none" && (
          <div className="mt-4 rounded-2xl bg-white p-5 text-res-navy text-shadow-none">
            <p className="font-semibold">San Diego County only</p>
            <p className="mt-1 text-sm text-slate-700">
              This lookup covers San Diego County. If you&apos;re in the county, try your 5-digit ZIP code or the name of your city.
            </p>
          </div>
        )}

        {result && result !== "none" && result.kind === "pages" && (
          <div className="mt-4 rounded-2xl bg-white p-5 text-res-navy text-shadow-none">
            <p className="font-semibold">Pick your neighborhood:</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {result.pages.map((p) => (
                <li key={p.slug}>
                  <Link href={`/residential/${p.slug}#trash-day`} className="inline-block rounded-full bg-res-mist px-3 py-1.5 text-sm font-medium hover:bg-res-teal-dark hover:text-white">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-slate-700">Somewhere else in the city?</p>
            <HaulerLink area={result.other} />
          </div>
        )}

        {result && result !== "none" && result.kind === "other" && (
          <div className="mt-4 rounded-2xl bg-white p-5 text-res-navy text-shadow-none">
            <p className="font-semibold">
              {result.area.name === "Unincorporated San Diego County"
                ? "That's in unincorporated San Diego County, where trash is collected by several companies depending on your community."
                : `Home trash in ${result.area.name} is collected by ${result.area.hauler}.`}
            </p>
            <HaulerLink area={result.area} />
            {result.area.note && <p className="mt-3 text-sm text-slate-600">{result.area.note}</p>}
          </div>
        )}

        {result && result !== "none" && result.kind !== "page" && served && (
          <p className="mt-3 text-sm text-white/90">
            Good news: we serve {zip}.{" "}
            <Link href={`/residential/signup?zip=${zip}`} className="font-semibold text-white underline underline-offset-4 hover:text-res-teal">
              Let us handle your trash day
            </Link>
            .
          </p>
        )}
      </div>
      <p className="mt-3 text-xs text-white/70">Covers San Diego County only.</p>
    </div>
  );
}

function HaulerLink({ area }: { area: { url: string; linkLabel: string } }) {
  return (
    <a
      href={area.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-flex items-center gap-2 rounded-full bg-res-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-res-teal-dark"
    >
      Look up your trash day <IconExternalLink size={16} aria-hidden="true" />
      <span className="sr-only">(opens the {area.linkLabel})</span>
    </a>
  );
}
