import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Footer from "@/components/Footer";
import { BulkyTable, bulkyRows, extraBulkyRows } from "@/components/residential/BulkyTable";
import { PostHeader, PostFaqs, HomesCta } from "@/components/blog/PostParts";
import { getPost, postMetadata, postJsonLd } from "@/lib/blogPage";
import { joinNames } from "@/components/residential/holidayDates";

// Every city fact here comes from the bulky item data in trashDay.ts and trashDayLookup.ts (the same
// data as the table on /residential/trash-day), so the post stays in step when a hauler changes.
const post = getPost("how-to-get-rid-of-a-mattress-san-diego");
export const metadata = postMetadata(post);

const all = [...bulkyRows, ...extraBulkyRows];
const free = all.filter((r) => r.summary.free);
const freeNames = joinNames(free.map((r) => r.label));
const wrapped = all.filter((r) => r.summary.mattresses.toLowerCase().includes("wrapped"));
const escondido = extraBulkyRows.find((r) => r.key === "Escondido");

const faqs = [
  {
    q: "Can I put a mattress in my trash can in San Diego?",
    a: "No. A mattress won't fit in a cart, and the City of San Diego says furniture, appliances and anything over 50 pounds can't go in your carts. Book a bulky item pickup with your hauler or take it to a drop-off site.",
  },
  {
    q: "Is there free mattress pickup in San Diego?",
    a: `Not from the City of San Diego, which has no curbside bulky item pickup. City residents can drop off mattresses and box springs free at the Miramar Landfill. Haulers in ${freeNames} include free bulky item pickups for homes, with limits on how often and how many items.`,
  },
  {
    q: "Where can I drop off a mattress for free in San Diego?",
    a: "At the Miramar Landfill mattress collection site, weekdays 7 a.m. to 3 p.m. Mattresses and box springs are free to drop off there.",
  },
  {
    q: "How much does mattress pickup cost in San Diego County?",
    a: `It depends on your hauler. ${escondido ? `Escondido Disposal charges ${escondido.summary.cost.split(" (")[0]}. ` : ""}EDCO charges an extra fee in cities without free pickups but doesn't publish the price, and WM gives you a price before you book.`,
  },
  {
    q: "Do I need to wrap a mattress in plastic for pickup?",
    a: `With some haulers, yes. Mattresses and box springs must be wrapped in plastic for pickup in ${joinNames(wrapped.map((r) => r.label))}. A plastic mattress bag from a hardware or moving store works.`,
  },
];

const jsonLd = postJsonLd(post, faqs, ["Mattress disposal", "Bulky item pickup", "Miramar Landfill", "San Diego trash collection"]);

export default function Page() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <article className="px-4 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <PostHeader
            post={post}
            lede="The City of San Diego won't pick up a mattress at the curb, but you can drop one off free. In the rest of the county it depends on who collects your trash. Here's what each hauler offers."
          />

          <div className="article mt-8">
            <aside className="key-points">
              <p className="font-bold text-ink">Key points</p>
              <ul>
                <li>City of San Diego: no curbside pickup. Mattresses and box springs are free to drop off at the Miramar Landfill, weekdays 7 a.m. to 3 p.m.</li>
                <li>Free curbside pickups for homes in {freeNames}, with limits on how often and how many items.</li>
                <li>Most other cities charge a fee or quote a price.</li>
                <li>Some haulers only take mattresses wrapped in plastic.</li>
              </ul>
            </aside>

            <p>
              Mattresses are one of the most common things people ask us about. They don&apos;t fit in a cart, they&apos;re
              heavy, and leaving one on the sidewalk without a pickup booked is a quick way to annoy the neighbors. The good
              news is that every part of San Diego County has a way to get rid of one. It just isn&apos;t the same way
              everywhere.
            </p>

            <h2>City of San Diego: free drop-off at the Miramar Landfill</h2>
            <p>
              The City of San Diego doesn&apos;t offer curbside bulky item pickup for homes. Instead, you can drop off
              mattresses and box springs free at the Miramar Landfill mattress collection site, weekdays from 7 a.m. to
              3 p.m. That covers neighborhoods like Pacific Beach, La Jolla, Point Loma, North Park and the rest of the City.
            </p>
            <p>
              Don&apos;t try to squeeze anything big into your carts. The City says furniture, appliances and anything over
              50 pounds can&apos;t go in them. For furniture and appliances, the City points residents to{" "}
              <a href="https://wastefreesd.org/" target="_blank" rel="noopener noreferrer">WasteFreeSD.org</a>, which
              lists places that take them.
            </p>
            <p>
              Condos and homes on private streets often have a private hauler instead of the City. If that&apos;s you, ask
              your HOA or property manager who collects your trash and check that hauler&apos;s bulky item rules.
            </p>

            <h2>Which cities pick up mattresses for free?</h2>
            <p>These haulers include free curbside bulky item pickups for homes:</p>
            <ul>
              {free.map((r) => (
                <li key={r.key}>
                  <strong>{r.label}</strong> ({r.hauler}): {r.summary.cost.replace(/^Free, /, "")}.
                  {r.summary.mattresses.startsWith("Ask") ? ` Ask ${r.hauler} about mattresses.` : ` Mattresses: ${r.summary.mattresses.toLowerCase()}.`}
                </li>
              ))}
            </ul>
            <p>
              EDCO&apos;s bulky item pages list furniture and appliances but don&apos;t mention mattresses, so check before
              you book. Everywhere else on the list below, pickup costs extra or you get a price when you book.
            </p>

            <h2>Bulky item and mattress pickup by city</h2>
            <p>
              Find your city to see whether pickup is free, what it costs and how to book. &quot;Ask EDCO&quot; means
              EDCO&apos;s bulky item page lists furniture and appliances but doesn&apos;t say either way about mattresses.
            </p>
          </div>
          <BulkyTable wide={false} />

          <div className="article">
            <h2>How to get a mattress ready for pickup</h2>
            <ul>
              <li><strong>Book first.</strong> Haulers that offer bulky pickup do it by request. A mattress at the curb without a booking usually just sits there.</li>
              <li><strong>Wrap it if your hauler asks.</strong> Republic Services in Carlsbad and WM want mattresses and box springs wrapped in plastic.</li>
              <li><strong>Set it out on time.</strong> Republic&apos;s Carlsbad flyer says to have items out before 7 a.m. on the scheduled day. EDCO in Del Mar asks for 6 a.m., usually on your regular collection day.</li>
              <li><strong>Put it where you agreed.</strong> Keep it off the sidewalk and away from your carts so it doesn&apos;t block the trash truck.</li>
            </ul>
            <p>
              If the mattress is still in good shape, consider donating or selling it before it goes to the landfill.
              Republic Services suggests the same on its bulky item flyer.
            </p>

            <h2>Other big items</h2>
            <p>
              The same bulky item pickups usually cover furniture and appliances too, within each hauler&apos;s item
              limit. Fridges and AC units can cost more because of the refrigerant. In Escondido, for example, they&apos;re
              priced separately from other items. For the rules in your area, see{" "}
              <Link href="/residential/trash-day#bulky">bulky item pickup by city</Link> on our trash day guide.
            </p>

            <PostFaqs faqs={faqs} />
          </div>

          <HomesCta
            eyebrow="Trash day, handled"
            title="We take your cans to the curb and back, every week"
            text="Doorstep Disposal rolls your trash, recycling and green waste cans out the evening before pickup and brings them back after, with a photo each time. Holiday weeks included."
          />
        </div>
      </article>
      <Footer />
    </>
  );
}
