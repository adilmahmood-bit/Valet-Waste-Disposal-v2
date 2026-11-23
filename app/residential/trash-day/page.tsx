import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { IconCheck, IconChevronDown, IconExternalLink } from "@tabler/icons-react";
import { residential } from "@/config/residential";
import { cityPages } from "@/components/residential/cities";
import { trashCollectors, holidayNames, type Holiday } from "@/components/residential/trashDay";
import { otherAreas, type OtherArea } from "@/components/residential/trashDayLookup";
import TrashDayFinder from "@/components/residential/TrashDayFinder";
import { currentYear, holidayDate, formatHolidayDate, isWeekend, joinNames, trashDayUpdated } from "@/components/residential/holidayDates";
import JsonLd from "@/components/JsonLd";
import { SITE, faqPage, breadcrumbs } from "@/components/residential/schema";

// Rebuild daily so the holiday schedule year and dates roll over on their own each January.
export const revalidate = 86400;

const shareImage = { url: "/residential/og/trash-day.jpg", width: 1200, height: 630, alt: "San Diego skyline at night" };

// The year in the title and headings matches searches like "trash day San Diego 2026" and rolls
// over on its own (the page rebuilds daily).
export function generateMetadata(): Metadata {
  const year = currentYear();
  return {
    // Title under 60 and description under 160 characters, so Google doesn't cut them.
    title: { absolute: `When Is Trash Day in San Diego? ${year} Pickup & Holiday Guide` },
    description: `What day is trash day in San Diego in ${year}? Enter your city or ZIP to find your pickup day, collection rules and holiday schedule anywhere in San Diego County.`,
    alternates: { canonical: "/residential/trash-day" },
    openGraph: {
      title: `When is trash day in San Diego? Updated ${year}`,
      description: `Find your trash pickup day, collection rules and ${year} holiday schedule anywhere in San Diego County.`,
      url: "/residential/trash-day",
      siteName: "Doorstep Disposal",
      locale: "en_US",
      type: "website",
      images: [shareImage],
    },
    twitter: { card: "summary_large_image", images: [shareImage] },
  };
}

// The first question matches how people search ("what day is trash day in San Diego"). It is shown
// on the page and marked up as an FAQ so search engines and AI tools can quote the answer.
const faqs = [
  {
    q: "What day is trash day in San Diego?",
    a: "There's no single trash day in San Diego. Each street has its own collection day, Monday through Friday, and a holiday can push it one day later that week. Enter your city, neighborhood or ZIP code above to find your day, or use the City of San Diego's collection lookup if you live in the city.",
  },
  // Questions from Google's "People also ask" for San Diego trash searches (2026-11-23). Facts come from
  // the City of San Diego's and the haulers' own pages; sources are noted in trashDay.ts.
  {
    q: "My trash wasn't picked up in San Diego. What should I do?",
    a: "First check whether it's a holiday week, since pickup moves one day later after most holidays. If your carts were out by 6 a.m. and still weren't emptied, report it. In the City of San Diego, check the City's missed collections map, then submit a Missed Collection Request through Get It Done. In Oceanside, report it to WM, which says collection will be finished by the next business day. In cities served by EDCO or Republic Services, use the service request form on the hauler's website.",
  },
  {
    q: "What if I forget to take the trash out on trash day?",
    a: "Haulers collect on a set weekly schedule, and carts need to be at the curb by 6 a.m. If yours weren't out in time, plan on your next pickup day. Don't leave them at the curb until then: the City of San Diego requires carts back in by 6 p.m. on collection day. Keep lids closed until next week, because overfilled and overweight carts can be skipped.",
  },
  {
    q: "Can I put leaves in the trash?",
    a: "No. Leaves and other yard trimmings go in your green organics cart, not the gray trash cart. California's organics law, SB 1383, requires yard waste to be kept out of the trash, and the City of San Diego and EDCO both tell residents to put it in the green cart. Put it in loose: the City of San Diego doesn't accept plastic bags in the organics cart, even compostable ones.",
  },
  {
    q: "How do I keep trash cans from blowing over?",
    a: "Close the lid all the way and don't overfill the cart, since an open lid catches the wind. Put heavier bags at the bottom. Keep carts about 2 to 3 feet apart so one falling doesn't knock over the next. When Santa Ana winds are forecast, set carts out as close to pickup time as you can and bring them back in soon after the truck comes.",
  },
  {
    q: "What time do trash cans need to be out?",
    a: "In most of San Diego County, carts need to be at the curb by 6 a.m. on collection day. Some cities also set a time to bring them back in. Check your city's page for its rules.",
  },
];

// Bulky item pickup. The heading is the question people search ("free bulky item pickup San Diego"),
// answered in the first lines so Google and AI tools can quote it. Keep the answer in step with the
// bulky rules in trashDay.ts, which the per-city list below is built from.
const bulkyFaq = {
  q: "Is there free bulky item pickup in San Diego?",
  a: "Not from the City of San Diego, which has no curbside bulky item pickup, but mattresses and box springs can be dropped off free at the Miramar Landfill. Elsewhere it depends on your hauler: Republic Services in Carlsbad and EDCO in Del Mar each give homes three free pickups a year, up to five items each time. EDCO charges a fee in Encinitas, Solana Beach, San Marcos and Vista and picks up by arrangement in Coronado, and WM in Oceanside quotes a price before you book.",
};

// One row per hauler area for the bulky list, grouped like the holiday table: the San Diego
// neighborhoods share the City's row, and Cardiff is listed with Encinitas.
type BulkyRow = { key: string; label: string; href: string; hauler: string; rule: string; link?: { href: string; label: string } };
const bulkyRows: BulkyRow[] = (() => {
  const rows: BulkyRow[] = [];
  for (const c of cityPages) {
    const col = trashCollectors[c.slug];
    if (!col?.rules.bulky || c.slug === "cardiff-by-the-sea") continue;
    if (col === trashCollectors["san-diego"] && c.slug !== "san-diego") continue;
    rows.push({
      key: c.slug,
      label: c.slug === "encinitas" ? "Encinitas and Cardiff" : c.name,
      href: `/residential/${c.slug}#trash-day`,
      hauler: col.name,
      rule: col.rules.bulky,
      link: col.bulkyLink,
    });
  }
  return rows.sort((a, b) => a.label.localeCompare(b.label));
})();

// "What holidays do Waste Management, EDCO and Republic Services observe?" Built from the same
// hauler data as the holiday table, so the answer and the table always agree.
function haulerHolidayFaq() {
  const by = (slug: string) => trashCollectors[slug].holidaysObserved.map((h) => holidayNames[h]);
  return {
    q: "What holidays do Waste Management, EDCO and Republic Services observe?",
    a: `Waste Management (Oceanside): ${joinNames(by("oceanside"))}. EDCO (Encinitas, Solana Beach, Del Mar, Coronado, San Marcos and Vista): ${joinNames(by("encinitas"))}. Republic Services (Carlsbad): ${joinNames(by("carlsbad"))}. The City of San Diego: ${joinNames(by("san-diego"))}. When one of these falls on a weekday, pickup for the rest of that week is one day later.`,
  };
}

const holidays = Object.keys(holidayNames) as Holiday[];

// Holiday table rows. San Diego neighborhood pages share one row (same City rules), and
// Cardiff is part of Encinitas, so it's listed under Encinitas. Other county cities are in
// extraHolidayRows, behind "Show more cities".
type HolidayRow = { key: string; label: string; href?: string; areas?: { slug: string; name: string }[]; observed: Holiday[] };
const holidayRows: HolidayRow[] = (() => {
  const rows: HolidayRow[] = [];
  const sdLookup = trashCollectors["pacific-beach"]?.lookupUrl;
  for (const c of cityPages) {
    const col = trashCollectors[c.slug];
    if (!col || c.slug === "cardiff-by-the-sea") continue;
    if (col.lookupUrl === sdLookup) {
      let sd = rows.find((r) => r.key === "san-diego");
      if (!sd) rows.push((sd = { key: "san-diego", label: "San Diego", areas: [], observed: col.holidaysObserved }));
      // The San Diego city page is the row's own link; its neighborhoods are listed under it.
      if (c.slug === "san-diego") sd.href = `/residential/${c.slug}#trash-day`;
      else sd.areas!.push({ slug: c.slug, name: c.name });
      continue;
    }
    rows.push({ key: c.slug, label: c.name, href: `/residential/${c.slug}#trash-day`, observed: col.holidaysObserved });
  }
  return rows.sort((a, b) => a.label.localeCompare(b.label));
})();
const extraHolidayRows: HolidayRow[] = otherAreas
  .filter((a) => a.holidaysObserved)
  .map((a) => ({ key: a.name, label: a.name, observed: a.holidaysObserved! }))
  .sort((a, b) => a.label.localeCompare(b.label));

// One question per holiday ("Is there trash pickup on Christmas in San Diego?"), built from the same
// data as the table. Shown collapsed on the page and included in the FAQ markup for search and AI.
function holidayFaqs(year: number) {
  const all = [...holidayRows, ...extraHolidayRows];
  return holidays.map((h) => {
    const name = holidayNames[h];
    const date = holidayDate(h, year);
    const when = `In ${year}, ${name} is ${formatHolidayDate(date)}.`;
    const off = all.filter((r) => r.observed.includes(h)).map((r) => r.label);
    const on = all.filter((r) => !r.observed.includes(h)).map((r) => r.label);
    const shift = isWeekend(date)
      ? `Because it falls on a weekend in ${year}, pickup that week isn't delayed in most areas.`
      : "Pickups later that week move one day later.";
    let a: string;
    if (!off.length) a = `Yes. ${name} is a regular trash pickup day across San Diego County. ${when}`;
    else if (!on.length) a = `No. San Diego and the other cities in San Diego County don't collect trash on ${name}. ${shift} ${when}`;
    else
      a = `It depends on your city. There's no trash pickup on ${name} in ${joinNames(off)}. ${shift} ${joinNames(on)} ${
        on.length > 1 ? "have" : "has"
      } regular pickup. ${when}`;
    return { q: `Is there trash pickup on ${name} in San Diego?`, a };
  });
}

function HolidayCells({ observed }: { observed: Holiday[] }) {
  return holidays.map((h) => (
    <td key={h} className="px-1 py-2 text-center">
      {observed.includes(h) ? (
        <>
          <IconCheck size={20} stroke={3} className="mx-auto text-green-600" aria-hidden="true" />
          <span className="sr-only">Yes</span>
        </>
      ) : (
        <>
          <span className="text-slate-300" aria-hidden="true">–</span>
          <span className="sr-only">No</span>
        </>
      )}
    </td>
  ));
}

// Same column widths in both tables, so the hidden rows line up with the ones above.
const holidayCols = (
  <colgroup>
    <col className="w-[180px]" />
    {holidays.map((h) => (
      <col key={h} />
    ))}
  </colgroup>
);

// City pages grouped by who collects the trash, for the list under the finder.
const byHauler = cityPages.reduce<Record<string, typeof cityPages>>((acc, c) => {
  const name = trashCollectors[c.slug]?.name ?? "Other";
  (acc[name] ??= []).push(c);
  return acc;
}, {});

// Rows shown before "Show more areas": San Diego, Escondido and Poway.
const SHOWN = 3;

function AreaRow({ a }: { a: OtherArea }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
      <span>
        <span className="font-semibold">{a.name === "San Diego" ? "Other City of San Diego neighborhoods" : a.name}</span>
        <span className="block text-sm text-slate-600">{a.name.startsWith("Unincorporated") ? "Several haulers, by community" : a.hauler}</span>
      </span>
      <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-res-teal-dark hover:underline">
        Look up <IconExternalLink size={15} aria-hidden="true" />
        <span className="sr-only">trash day: {a.linkLabel}</span>
      </a>
    </li>
  );
}

export default function TrashDayPage() {
  const year = currentYear();
  const perHoliday = holidayFaqs(year);
  const updated = trashDayUpdated();
  // The holiday chart comes right after the first question (Adil, 2026-11-23); the rest follow it,
  // starting with the holidays-by-hauler question that goes with the chart.
  const topFaqs = faqs.slice(0, 1);
  const bottomFaqs = [haulerHolidayFaq(), ...faqs.slice(1)];
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              name: `When is trash day in San Diego? Updated ${year}`,
              url: `${SITE}/residential/trash-day`,
              dateModified: updated,
            },
            faqPage([...topFaqs, ...bottomFaqs, bulkyFaq, ...perHoliday]),
            breadcrumbs([
              { name: "For Homes", path: "/residential" },
              { name: "Trash day", path: "/residential/trash-day" },
            ]),
          ],
        }}
      />

      <section className="relative overflow-hidden bg-res-navy text-white">
        <Image
          src="/residential/trash-day-san-diego.jpg"
          alt="San Diego skyline at night across the bay"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_55%]"
        />
        <div className="absolute inset-0 bg-res-navy/70 md:bg-res-navy/55" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto px-4 pt-8 pb-10 md:py-20 text-shadow-md text-shadow-black/80">
          <nav aria-label="Breadcrumb" className="text-xs text-white/60">
            <Link href="/residential" className="hover:text-white">For Homes</Link> › <span className="text-white/80">Trash day</span>
          </nav>
          <h1 className="mt-3 text-[2rem] md:text-5xl font-bold leading-[1.15]">
            When is trash day in San Diego? Updated <time dateTime={updated}>{year}</time>
          </h1>
          <p className="mt-3 md:mt-4 md:text-lg text-white/85">
            Trash day in San Diego changes street by street. Enter your city, neighborhood or ZIP code to find your day, plus the set-out
            rules and holiday schedule where you live.
          </p>
          <div className="mt-6">
            <TrashDayFinder />
          </div>
          <a
            href="#holidays"
            className="text-shadow-none mt-5 inline-block rounded-full bg-res-teal px-5 py-3 font-semibold text-white hover:bg-res-teal-dark"
          >
            San Diego Trash Holiday Guide {year}
          </a>
        </div>
      </section>

      <section className="py-10 md:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold">Trash day by area</h2>
          <p className="mt-3 text-slate-700">Each page has a link to look up your exact day, a pickup map where one is published, and local collection rules.</p>
          <div className="mt-6 space-y-6">
            {Object.entries(byHauler).map(([hauler, cities]) => (
              <div key={hauler}>
                <h3 className="font-semibold">Collected by {hauler}</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {cities.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/residential/${c.slug}#trash-day`} className="inline-block rounded-full bg-res-mist px-3 py-1.5 text-sm font-medium hover:bg-res-teal-dark hover:text-white">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <h2 className="mt-12 text-2xl md:text-3xl font-bold">Other San Diego County areas</h2>
          <p className="mt-3 text-slate-700">Look up your day on the collector&apos;s own site.</p>
          {/* The first few areas show; the rest open from "Show more areas". */}
          <ul className="mt-4 divide-y divide-slate-200 border-t border-slate-200">
            {otherAreas.slice(0, SHOWN).map((a) => <AreaRow key={a.name} a={a} />)}
          </ul>
          <details className="group border-y border-slate-200">
            <summary className="flex cursor-pointer list-none items-center justify-between py-3 font-semibold text-res-teal-dark [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">Show {otherAreas.length - SHOWN} more areas</span>
              <span className="hidden group-open:inline">Show fewer areas</span>
              <IconChevronDown size={20} className="transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <ul className="divide-y divide-slate-200 border-t border-slate-200">
              {otherAreas.slice(SHOWN).map((a) => <AreaRow key={a.name} a={a} />)}
            </ul>
          </details>

          <div className="mt-12 rounded-2xl bg-res-mist p-6">
            <h2 className="text-xl md:text-2xl font-bold">Rather not think about trash day at all?</h2>
            <p className="mt-2 text-slate-700">
              We track your trash day, holiday weeks included, and roll your cans to the curb the evening before and back after pickup.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/residential/signup" className="rounded-full bg-res-teal-dark px-6 py-3 font-semibold text-white hover:bg-res-navy">Get started</Link>
              <Link href="/residential/pricing" className="rounded-full border-2 border-res-navy px-6 py-3 font-semibold hover:bg-res-navy hover:text-white">See plans and pricing</Link>
            </div>
          </div>

          <h2 className="mt-12 text-2xl md:text-3xl font-bold">Trash day questions</h2>
          <dl className="mt-4 divide-y divide-slate-200">
            {topFaqs.map((f) => (
              <div key={f.q} className="py-4">
                <dt className="font-semibold">{f.q}</dt>
                <dd className="mt-1.5 text-slate-700">{f.a}</dd>
              </div>
            ))}
          </dl>

          {/* San Diego Trash Holiday Guide. A real table (not an image) so search engines and AI tools
              can read it. Checks come from holidaysObserved in trashDay.ts and trashDayLookup.ts. */}
          <div id="holidays" className="scroll-mt-4 border-t border-slate-200 py-4">
            <h3 className="font-semibold">San Diego Trash Holiday Schedule {year}: Is There Trash Pickup on Holidays?</h3>
            <p className="mt-1.5 text-slate-700">
              Covers {joinNames(holidays.map((h) => holidayNames[h]))}. A check means the holiday <strong>changes</strong> trash
              pickup that week in that area.
            </p>
            <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-slate-200 lg:-mx-24">
              <table className="min-w-[900px] w-full text-sm table-fixed">
                <caption className="sr-only">Trash pickup holidays by city in San Diego County</caption>
                {holidayCols}
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="sticky left-0 bg-slate-50 px-3 py-2 text-left font-semibold">City</th>
                    {holidays.map((h) => (
                      <th key={h} scope="col" className="px-1 py-2 text-center text-xs font-semibold leading-tight">{holidayNames[h]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {holidayRows.map((r) => (
                    <tr key={r.key}>
                      <th scope="row" className="sticky left-0 bg-white px-3 py-2 text-left font-medium">
                        {r.href ? <Link href={r.href} className="hover:text-res-teal-dark hover:underline">{r.label}</Link> : r.label}
                        {r.areas && (
                          <span className="block text-xs font-normal text-slate-500 leading-snug">
                            {r.areas.map((a, i) => (
                              <span key={a.slug}>
                                {i > 0 && ", "}
                                <Link href={`/residential/${a.slug}#trash-day`} className="hover:text-res-teal-dark hover:underline">{a.name}</Link>
                              </span>
                            ))}
                          </span>
                        )}
                      </th>
                      <HolidayCells observed={r.observed} />
                    </tr>
                  ))}
                </tbody>
              </table>
              <details className="group min-w-[900px] border-t border-slate-200">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-semibold text-res-teal-dark [&::-webkit-details-marker]:hidden">
                  <span className="group-open:hidden">Show {extraHolidayRows.length} more San Diego County cities</span>
                  <span className="hidden group-open:inline">Show fewer cities</span>
                  <IconChevronDown size={18} className="transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <table className="w-full text-sm table-fixed border-t border-slate-200">
                  <caption className="sr-only">Trash pickup holidays in other San Diego County cities</caption>
                  {holidayCols}
                  <tbody className="divide-y divide-slate-200">
                    {extraHolidayRows.map((r) => (
                      <tr key={r.key}>
                        <th scope="row" className="sticky left-0 bg-white px-3 py-2 text-left font-medium">{r.label}</th>
                        <HolidayCells observed={r.observed} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </div>

            {/* Collapsed to keep the page short. The text is still in the page HTML (and the FAQ markup),
                so Google, Bing and AI tools read it. */}
            <details className="group/q mt-4 rounded-xl ring-1 ring-slate-200">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-semibold text-res-teal-dark [&::-webkit-details-marker]:hidden">
                Is there trash pickup on a holiday? Answers by holiday
                <IconChevronDown size={18} className="shrink-0 transition-transform group-open/q:rotate-180" aria-hidden="true" />
              </summary>
              <dl className="divide-y divide-slate-200 border-t border-slate-200 px-4">
                {perHoliday.map((f) => (
                  <div key={f.q} className="py-3">
                    <dt className="font-semibold">{f.q}</dt>
                    <dd className="mt-1 text-sm text-slate-700">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </div>

          <dl className="divide-y divide-slate-200 border-t border-slate-200">
            {bottomFaqs.map((f) => (
              <div key={f.q} className="py-4">
                <dt className="font-semibold">{f.q}</dt>
                <dd className="mt-1.5 text-slate-700">{f.a}</dd>
              </div>
            ))}
          </dl>

          <section id="bulky" className="scroll-mt-4 mt-12">
            <h2 className="text-2xl md:text-3xl font-bold">
              {bulkyFaq.q} Updated <time dateTime={updated}>{year}</time>
            </h2>
            <p className="mt-3 text-slate-700">{bulkyFaq.a}</p>
            <h3 className="mt-6 font-semibold">Bulky item and mattress pickup by city</h3>
            <ul className="mt-2 divide-y divide-slate-200 border-y border-slate-200">
              {bulkyRows.map((r) => (
                <li key={r.key} className="py-4">
                  <p className="font-semibold">
                    <Link href={r.href} className="hover:text-res-teal-dark hover:underline">{r.label}</Link>
                    <span className="font-normal text-sm text-slate-500"> · {r.hauler}</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{r.rule}</p>
                  {r.link && (
                    <a
                      href={r.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-res-teal-dark hover:underline"
                    >
                      {r.link.label} <IconExternalLink size={15} aria-hidden="true" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <p className="mt-10 text-center md:text-lg text-slate-700">
            Questions? Call or text us at{" "}
            <a href={`tel:${residential.contact.phoneHref}`} className="font-semibold text-res-teal-dark whitespace-nowrap">{residential.contact.phone}</a>.
          </p>
        </div>
      </section>
    </>
  );
}
