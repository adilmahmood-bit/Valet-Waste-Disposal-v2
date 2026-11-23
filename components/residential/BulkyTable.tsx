import Link from "next/link";
import {
  IconCheck,
  IconChevronDown,
  IconExternalLink,
  IconX,
} from "@tabler/icons-react";
import { cityPages } from "@/components/residential/cities";
import {
  trashCollectors,
  type BulkySummary,
} from "@/components/residential/trashDay";
import { otherAreas } from "@/components/residential/trashDayLookup";

// Bulky item and mattress pickup table, shared by /residential/trash-day and the mattress blog post.

// One row per hauler area for the bulky list, grouped like the holiday table: the San Diego
// neighborhoods share the City's row, and Cardiff is listed with Encinitas.
// Cells come from bulkySummary (the short version of each city's bulky rule); the full rule stays
// on the city page. Other county cities are in extraBulkyRows, behind "Show more cities".
export type BulkyRow = {
  key: string;
  label: string;
  href?: string;
  areas?: { slug: string; name: string }[];
  hauler: string;
  summary: BulkySummary;
  text?: string;
  link?: { href: string; label: string };
};
export const bulkyRows: BulkyRow[] = (() => {
  const rows: BulkyRow[] = [];
  const sdAreas: { slug: string; name: string }[] = [];
  for (const c of cityPages) {
    const col = trashCollectors[c.slug];
    if (!col?.bulkySummary || c.slug === "cardiff-by-the-sea") continue;
    // San Diego neighborhoods share the City's row and are listed under it, like the holiday table.
    if (col === trashCollectors["san-diego"] && c.slug !== "san-diego") {
      sdAreas.push({ slug: c.slug, name: c.name });
      continue;
    }
    rows.push({
      key: c.slug,
      label: c.slug === "encinitas" ? "Encinitas and Cardiff" : c.name,
      href: `/residential/${c.slug}#trash-day`,
      hauler: col.name,
      summary: col.bulkySummary,
      text: col.rules.bulky,
      link: col.bulkyLink,
    });
  }
  const sd = rows.find((r) => r.key === "san-diego");
  if (sd) sd.areas = sdAreas;
  // San Diego first (Adil, 2026-11-23), then A to Z.
  return rows.sort(
    (a, b) =>
      Number(b.key === "san-diego") - Number(a.key === "san-diego") ||
      a.label.localeCompare(b.label),
  );
})();
export const extraBulkyRows: BulkyRow[] = otherAreas
  .filter((a) => a.bulkySummary)
  .map((a) => ({
    key: a.name,
    label: a.name,
    hauler: a.hauler,
    summary: a.bulkySummary!,
    link: a.bulkyLink,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

// One question per city ("Is there free bulky item pickup in Carlsbad?"), in table order. Shown
// collapsed on the page and included in the FAQ markup. Cities with a page use their full bulky
// rule; the other county cities are written from their table cells.
function bulkyAnswer(r: BulkyRow) {
  if (r.text) return r.text;
  const s = r.summary;
  const cost = s.free
    ? `Yes. ${r.hauler} gives homes in ${r.label} free curbside bulky item pickup: ${s.cost.replace(/^Free, /, "")}.`
    : `${r.hauler} picks up bulky items at the curb in ${r.label}. Cost: ${s.cost.charAt(0).toLowerCase()}${s.cost.slice(1)}.`;
  const mattresses = s.mattresses.startsWith("Ask")
    ? `Its bulky item page doesn't mention mattresses, so check with ${r.hauler} before setting one out.`
    : `Mattresses and box springs: ${s.mattresses.charAt(0).toLowerCase()}${s.mattresses.slice(1)}.`;
  return `${cost} ${mattresses}`;
}
export const perCityBulky = [...bulkyRows, ...extraBulkyRows].map((r) => ({
  q: `Is there free bulky item pickup in ${r.label}?`,
  a: bulkyAnswer(r),
}));

const bulkyCols = (
  <colgroup>
    <col className="w-[24%]" />
    <col className="w-[11%]" />
    <col className="w-[23%]" />
    <col className="w-[18%]" />
    <col className="w-[24%]" />
  </colgroup>
);

function BulkyCells({ r }: { r: BulkyRow }) {
  return (
    <>
      <th
        scope="row"
        className="sticky left-0 bg-white px-3 py-2.5 text-left font-medium align-top"
      >
        {r.href ? (
          <Link
            href={r.href}
            className="hover:text-res-teal-dark hover:underline"
          >
            {r.label}
          </Link>
        ) : (
          r.label
        )}
        {r.areas && r.areas.length > 0 && (
          <span className="block text-xs font-normal text-slate-500 leading-snug">
            {r.areas.map((a, i) => (
              <span key={a.slug}>
                {i > 0 && ", "}
                <Link
                  href={`/residential/${a.slug}#trash-day`}
                  className="hover:text-res-teal-dark hover:underline"
                >
                  {a.name}
                </Link>
              </span>
            ))}
          </span>
        )}
        <span className="mt-0.5 block text-xs font-normal text-slate-400">
          {r.hauler}
        </span>
      </th>
      <td className="px-2 py-2.5 text-center align-top">
        {r.summary.curbside ? (
          <IconCheck
            size={20}
            stroke={2.5}
            className="mx-auto text-green-600"
            aria-label="Yes"
          />
        ) : (
          <IconX
            size={20}
            stroke={2.5}
            className="mx-auto text-slate-400"
            aria-label="No"
          />
        )}
      </td>
      <td
        className={`px-2 py-2.5 align-top ${r.summary.free ? "font-semibold text-green-700" : "text-slate-700"}`}
      >
        {r.summary.cost}
      </td>
      <td className="px-2 py-2.5 align-top text-slate-700">
        {r.summary.mattresses}
      </td>
      <td className="px-2 py-2.5 align-top">
        {r.link && (
          <a
            href={r.link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-res-teal-dark hover:underline"
          >
            {r.link.label}{" "}
            <IconExternalLink
              size={14}
              className="inline align-[-2px]"
              aria-hidden="true"
            />
          </a>
        )}
      </td>
    </>
  );
}

// The table, with the other county cities behind "Show more cities". wide pulls it past the text
// column on large screens, like the holiday table. A real table (not an image) so search engines
// and AI tools can read it. Cells come from bulkySummary in trashDay.ts and trashDayLookup.ts.
export function BulkyTable({ wide = true }: { wide?: boolean }) {
  return (
    <div
      className={`mt-3 overflow-x-auto rounded-xl ring-1 ring-slate-200 ${wide ? "lg:-mx-24" : ""}`}
    >
      <table className="min-w-[720px] w-full text-sm table-fixed">
        <caption className="sr-only">
          Bulky item and mattress pickup by city in San Diego County
        </caption>
        {bulkyCols}
        <thead className="bg-slate-50">
          <tr>
            <th
              scope="col"
              className="sticky left-0 bg-slate-50 px-3 py-2 text-left font-semibold"
            >
              City
            </th>
            <th
              scope="col"
              className="px-2 py-2 text-center text-xs font-semibold leading-tight"
            >
              Curbside pickup
            </th>
            <th
              scope="col"
              className="px-2 py-2 text-left text-xs font-semibold"
            >
              Cost
            </th>
            <th
              scope="col"
              className="px-2 py-2 text-left text-xs font-semibold"
            >
              Mattresses
            </th>
            <th
              scope="col"
              className="px-2 py-2 text-left text-xs font-semibold"
            >
              How to book
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {bulkyRows.map((r) => (
            <tr key={r.key}>
              <BulkyCells r={r} />
            </tr>
          ))}
        </tbody>
      </table>
      <details className="group min-w-[720px] border-t border-slate-200">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-semibold text-res-teal-dark [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">
            Show {extraBulkyRows.length} more San Diego County cities
          </span>
          <span className="hidden group-open:inline">Show fewer cities</span>
          <IconChevronDown
            size={18}
            className="transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <table className="w-full text-sm table-fixed border-t border-slate-200">
          <caption className="sr-only">
            Bulky item and mattress pickup in other San Diego County cities
          </caption>
          {bulkyCols}
          <tbody className="divide-y divide-slate-200">
            {extraBulkyRows.map((r) => (
              <tr key={r.key}>
                <BulkyCells r={r} />
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
