import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import Footer from "@/components/Footer";
import { PostHeader, PostFaqs, HomesCta } from "@/components/blog/PostParts";
import { getPost, postMetadata, postJsonLd } from "@/lib/blogPage";
import { cityPages } from "@/components/residential/cities";
import { trashCollectors, type TrashCollector } from "@/components/residential/trashDay";
import { joinNames } from "@/components/residential/holidayDates";

// Set-out, bring-in and placement rules come straight from trashDay.ts (sourced from each city's and
// hauler's own pages), grouped by who collects. The "Where carts go" text left the city pages on
// 2026-11-23 and lives here instead.
const post = getPost("when-to-put-trash-cans-out-san-diego");
export const metadata = postMetadata(post);

const pagesFor = (match: (c: TrashCollector) => boolean) =>
  cityPages.filter((c) => trashCollectors[c.slug] && match(trashCollectors[c.slug]));

const sd = trashCollectors["san-diego"];
const groups = [
  { key: "san-diego", title: "City of San Diego", col: sd, pages: pagesFor((c) => c === sd) },
  { key: "oceanside", title: "Oceanside (WM)", col: trashCollectors.oceanside, pages: pagesFor((c) => c === trashCollectors.oceanside) },
  { key: "carlsbad", title: "Carlsbad (Republic Services)", col: trashCollectors.carlsbad, pages: pagesFor((c) => c === trashCollectors.carlsbad) },
  { key: "edco", title: "EDCO cities", col: trashCollectors.encinitas, pages: pagesFor((c) => c.name === "EDCO") },
];

const outBy = (c: TrashCollector) => c.rules.setOut?.match(/\d{1,2} a\.m\./)?.[0] ?? "Not published";
const backBy = (c: TrashCollector) => c.rules.bringIn?.match(/\d{1,2} p\.m\./)?.[0];

const faqs = [
  {
    q: "What time do trash cans need to be out in San Diego?",
    a: "By 6 a.m. on your collection day. That's the rule for the City of San Diego, WM in Oceanside, Republic Services in Carlsbad and EDCO in Encinitas, Solana Beach, Del Mar, Coronado, San Marcos and Vista. Most people put carts out the evening before so they don't miss an early truck.",
  },
  {
    q: "When do I have to bring my trash cans back in?",
    a: "In the City of San Diego, by 6 p.m. on collection day, and they have to be stored out of view from the street. In Oceanside, WM says carts must be off the street by 11 p.m. that day. EDCO and Republic Services don't publish a bring-in time, but your HOA may set one.",
  },
  {
    q: "Where should I put my trash cans on the curb?",
    a: "Wheels against the curb, with space around each cart so the truck's arm can grab it. The City of San Diego asks for about 3 feet between carts and from parked cars, poles, trees and mailboxes. EDCO and WM ask for at least 2 feet, and Republic Services in Carlsbad asks for 1 foot between carts and 2 feet from other objects.",
  },
  {
    q: "Does trash day change on holidays in San Diego?",
    a: "Yes, on the holidays your hauler observes. When one falls on a weekday, pickup usually moves one day later for the rest of that week. Which holidays count depends on your city, so check the holiday schedule before a holiday week.",
  },
  {
    q: "How do I keep trash cans from blowing over?",
    a: "Close the lid all the way and don't overfill the cart. Put heavier bags at the bottom and keep carts a few feet apart so one falling doesn't knock over the next. When Santa Ana winds are forecast, set carts out as close to pickup time as you can and bring them in soon after the truck comes.",
  },
];

const jsonLd = postJsonLd(post, faqs, ["Trash can set-out times", "Curbside trash collection", "San Diego trash rules", "Trash day"]);

export default function Page() {
  if (post.archived) notFound();
  return (
    <>
      <JsonLd data={jsonLd} />
      <article className="px-4 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <PostHeader
            post={post}
            lede="Every hauler in San Diego County wants your carts at the curb by 6 a.m. What happens after the truck comes, and where exactly the carts should sit, depends on your city."
          />

          <div className="article mt-8">
            <aside className="key-points">
              <p className="font-bold text-ink">Key points</p>
              <ul>
                <li>Carts out by 6 a.m. on collection day, everywhere we cover.</li>
                <li>City of San Diego: back in by 6 p.m. the same day and stored out of view. Oceanside: off the street by 11 p.m.</li>
                <li>Wheels against the curb, with 1 to 3 feet around each cart depending on your hauler.</li>
                <li>Holiday weeks can push pickup back a day.</li>
              </ul>
            </aside>

            <p>
              We roll trash cans to the curb and back for homes across San Diego County every week, so we spend a lot of
              time on these rules. They&apos;re simple once you know them, but they aren&apos;t the same in every city, and
              the City of San Diego is stricter than most about bringing carts back in.
            </p>

            <h2>Set-out and bring-in times by city</h2>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-slate-200">
            <table className="min-w-[520px] w-full text-sm">
              <caption className="sr-only">Trash cart set-out and bring-in times by city in San Diego County</caption>
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-semibold">Area</th>
                  <th scope="col" className="px-3 py-2 text-left font-semibold">Out by</th>
                  <th scope="col" className="px-3 py-2 text-left font-semibold">Back in by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {groups.map((g) => (
                  <tr key={g.key}>
                    <th scope="row" className="px-3 py-2.5 text-left font-medium align-top">
                      {g.title}
                      <span className="block text-xs font-normal text-slate-500">{joinNames(g.pages.map((p) => p.name))}</span>
                    </th>
                    <td className="px-3 py-2.5 align-top">{outBy(g.col)} on collection day</td>
                    <td className="px-3 py-2.5 align-top">{backBy(g.col) ? `${backBy(g.col)} the same day` : "No set time"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="article">
            <p>
              &quot;No set time&quot; means the hauler doesn&apos;t publish one. Your HOA may still have its own rule, and
              leaving carts out for days is the fastest way to hear from a neighbor.
            </p>

            <h2>The rules in full</h2>
            <p>Here&apos;s what each city or hauler asks for, from their own collection pages.</p>
            {groups.map((g) => (
              <div key={g.key}>
                <h3>{g.title}</h3>
                <ul className="mt-2 list-disc pl-5 space-y-1.5">
                  <li><strong>Setting out:</strong> {g.col.rules.setOut}</li>
                  <li><strong>Bringing in:</strong> {g.col.rules.bringIn ?? "No bring-in time published."}</li>
                  {g.col.rules.placement && <li><strong>Where carts go:</strong> {g.col.rules.placement}</li>}
                  {g.col.rules.carts && <li><strong>Carts:</strong> {g.col.rules.carts}</li>}
                </ul>
                <p className="mt-2 text-sm">
                  City pages:{" "}
                  {g.pages.map((p, i) => (
                    <span key={p.slug}>
                      {i > 0 && ", "}
                      <Link href={`/residential/${p.slug}#trash-day`}>{p.name}</Link>
                    </span>
                  ))}
                </p>
              </div>
            ))}

            <h2>Can I put my cans out the night before?</h2>
            <p>
              Yes. None of these haulers publish an earliest set-out time, and the evening before is what most people
              do, since trucks can come right at 6 a.m. The catch is the other end: in the City of San Diego the carts
              have to be back in by 6 p.m., so if you work late on trash day, you&apos;ll need someone to bring them in.
            </p>

            <h2>What about holiday weeks?</h2>
            <p>
              When your hauler observes a holiday on a weekday, pickup usually moves one day later for the rest of the
              week. Which holidays count varies by city. Carlsbad only shifts for three, while EDCO cities shift for six.
              See the <Link href="/residential/trash-day#holidays">holiday schedule by city</Link> before a holiday week.
            </p>

            <h2>If your trash wasn&apos;t picked up</h2>
            <p>
              Check whether it&apos;s a holiday week first. If your carts were out by 6 a.m. and still weren&apos;t
              emptied, report it to your hauler. Our <Link href="/residential/trash-day">trash day guide</Link> has the
              lookup link for every city.
            </p>

            <PostFaqs faqs={faqs} />
          </div>

          <HomesCta
            eyebrow="Never miss trash day"
            title="We roll your cans out and bring them back"
            text="Doorstep Disposal takes your trash, recycling and green waste cans to the curb the evening before pickup and back after the truck comes, with a GPS-logged photo each time. We follow holiday weeks for you."
          />
        </div>
      </article>
      <Footer />
    </>
  );
}
