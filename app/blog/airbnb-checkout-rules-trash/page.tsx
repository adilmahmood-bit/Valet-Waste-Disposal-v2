import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Footer from "@/components/Footer";
import { HomesCta, PostFaqs, PostHeader } from "@/components/blog/PostParts";
import { getPost, postMetadata, postJsonLd } from "@/lib/blogPage";
import { isLive } from "@/lib/blog";
import { residential, planById, advertisedPrice, money } from "@/config/residential";

// Airbnb's house rules policy (airbnb.com/help/article/4168, read 2026-11-23): applies to bookings made
// on or after November 20, 2026. Quotes below are from that page. San Diego cart rules match trashDay.ts;
// the price comes from config/residential.ts like the /hosts page.
const post = getPost("airbnb-checkout-rules-trash");
export const metadata = postMetadata(post);

const POLICY = "https://www.airbnb.com/help/article/4168";
const weekly = planById("weekly")!;
const price = `${money(advertisedPrice(weekly))} a month per property for up to ${weekly.includedBins} cans with code ${residential.promo.label}`;

const faqs = [
  {
    q: "Can Airbnb hosts make guests take out the trash?",
    a: "Not anymore, for bookings made on or after November 20, 2026. Airbnb's house rules policy says hosts generally can't ask guests to do tasks that take significant effort or time or that a cleaner would normally do, and it names taking trash offsite as one of them.",
  },
  {
    q: "When do Airbnb's new checkout rules start?",
    a: "The house rules policy applies to all reservations booked on or after November 20, 2026. Bookings made before then aren't covered by that line, so for a while you'll have stays under both the old and new rules.",
  },
  {
    q: "Can I put trash instructions in my house manual or a sign?",
    a: "You can share helpful information, but Airbnb says house rules have to be shown in the house rules section of the listing when the guest books. Hosts can't add new rules after booking, including by message or with signs in the home.",
  },
  {
    q: "What happens if a host keeps breaking the checkout rules?",
    a: "Airbnb says it may start by educating the host, asking them to update the listing and issuing warnings. If it keeps happening, it can lead to a notice on the listing that flags the issue to guests, lower visibility in search, or other action under Airbnb's terms of service.",
  },
  {
    q: "Who rolls the trash cans to the curb at an Airbnb in San Diego?",
    a: "The host, or someone the host arranges. Carts have to be at the curb by 6 a.m. on collection day, and in the City of San Diego they must be back in by 6 p.m. the same day and stored out of view. Hosts usually cover it themselves, through a cleaner or neighbor, or with a valet trash service.",
  },
  {
    q: "How much does a valet trash service cost for an Airbnb in San Diego?",
    a: `With Doorstep Disposal, short-term rentals pay the same as homeowners: from ${price}. Each property keeps its own trash day and notes.`,
  },
];

const jsonLd = postJsonLd(post, faqs, ["Airbnb house rules policy", "Airbnb checkout tasks", "Short-term rental trash", "San Diego trash rules"]);

export default function Page() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <article className="px-4 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <PostHeader
            post={post}
            lede="Airbnb's new house rules policy takes the trash off the guest's checkout list. Here's what changed, when it starts, and how San Diego hosts can still get the cans to the curb and back every week."
          />

          <div className="article mt-8">
            <aside className="key-points">
              <p className="font-bold text-ink">Key points</p>
              <ul>
                <li>For bookings made on or after November 20, 2026, Airbnb hosts generally can&apos;t ask guests to take trash offsite.</li>
                <li>Stripping beds and washing and putting away dishes are off the list too.</li>
                <li>House rules must be on the listing at booking. No new rules by message or signs after booking.</li>
                <li>Trash day is now fully the host&apos;s job: cans out by 6 a.m., and back in by 6 p.m. in the City of San Diego.</li>
              </ul>
            </aside>

            <h2>What Airbnb changed</h2>
            <p>
              Airbnb&apos;s <a href={POLICY} target="_blank" rel="noopener noreferrer">house rules policy</a> now spells out
              what hosts can and can&apos;t ask of guests. It applies to all reservations booked on or after November 20,
              2026. The part that matters for trash: hosts are generally not allowed to ask guests to complete tasks that
              take significant effort or time, or that a cleaner would typically do. Airbnb names three examples:
            </p>
            <ul>
              <li>Stripping the bed</li>
              <li><strong>Taking trash offsite</strong></li>
              <li>Washing and putting away dishes</li>
            </ul>
            <p>
              The same policy says house rules have to be reasonable and shown in the house rules section of the listing
              when the guest books. Hosts can&apos;t add new rules after booking, whether by message, by a sign in the home
              or in person. Hosts also can&apos;t fine guests for breaking a rule.
            </p>

            <h2>What happens to hosts who ignore it</h2>
            <p>
              Airbnb says it starts with education, asking the host to update the listing, and warnings. If it keeps
              happening, the listing can get a notice that flags the issue to guests, lower visibility in search, or other
              action under Airbnb&apos;s terms of service. For a host who depends on bookings, a flagged listing or a drop
              in search costs far more than solving trash day another way.
            </p>

            <h2>Are there exceptions?</h2>
            <p>
              Airbnb says it may grant exceptions based on a listing&apos;s context, such as local laws or conditions. Its
              trash example is asking guests to use an animal-proof container in bear country. That&apos;s about how trash
              is thrown away, not who takes it out, and it doesn&apos;t apply to a typical San Diego home.
            </p>

            <h2>Why this matters more in San Diego</h2>
            <p>
              Taking trash out isn&apos;t just carrying a bag to the cart. On trash day the carts have to be at the curb by
              6 a.m. In the City of San Diego they must also be back in by 6 p.m. the same day and stored out of view from
              the street. In Oceanside, carts have to be off the street by 11 p.m. Guests were never a reliable way to meet
              those times, and now you can&apos;t make it their job at all.
            </p>
            <p>
              Checkout day and trash day rarely line up, either. A cleaner who comes on checkout day may never be there on
              trash day, and a rental can sit empty on the one morning the truck comes. Somebody has to cover both trips
              every week, booked or not.{" "}
              {isLive("when-to-put-trash-cans-out-san-diego") ? (
                <>
                  See our <Link href="/blog/when-to-put-trash-cans-out-san-diego">set-out and bring-in rules by city</Link>{" "}
                  for the times where your rental is.
                </>
              ) : (
                <>
                  Our <Link href="/residential/trash-day">trash day guide</Link> has the rules for every city.
                </>
              )}
            </p>

            <h2>How San Diego hosts are handling trash day now</h2>
            <ul>
              <li><strong>Do it yourself.</strong> Works if you live nearby and are around on trash day, every week.</li>
              <li><strong>Your cleaner.</strong> Works when turnovers land on trash day. Otherwise it&apos;s an extra trip, often two.</li>
              <li><strong>A neighbor.</strong> Common and often reliable, until they travel or move.</li>
              <li><strong>A valet trash service.</strong> Someone rolls the cans out the evening before and back after pickup every week, whoever is staying. That&apos;s what we do.</li>
            </ul>

            <h2>What to put on your listing</h2>
            <p>
              Since rules can&apos;t be added after booking, put anything about trash in your listing&apos;s house rules
              section, and keep it to what guests do inside. Something like:
            </p>
            <aside className="key-points">
              <p>
                <strong>Trash and recycling:</strong> Please put trash in the kitchen trash bin and cardboard, bottles and
                cans in the recycling bin. No need to take anything outside. We take care of trash day.
              </p>
            </aside>
            <p>
              Airbnb doesn&apos;t list indoor sorting as off-limits, but its policy has the final word, and what goes in
              recycling varies by city. Check both before you copy it.
            </p>

            <h2>Holiday weeks and bulky items</h2>
            <p>
              When your hauler observes a holiday on a weekday, pickup usually moves a day later for the rest of the week.
              Check the <Link href="/residential/trash-day#holidays">holiday schedule by city</Link> before holiday weekends.
              For furniture or a mattress a guest stay leaves behind, see{" "}
              <Link href="/blog/how-to-get-rid-of-a-mattress-san-diego">how to get rid of a mattress in San Diego</Link>.
            </p>

            <PostFaqs faqs={faqs} />

            <p className="text-sm text-muted">
              This post summarizes Airbnb&apos;s house rules policy as published on November 23, 2026. Airbnb can change
              it, so check the <a href={POLICY} target="_blank" rel="noopener noreferrer">current policy</a> before you
              update your listing.
            </p>
          </div>

          <HomesCta
            eyebrow="For Airbnb and Vrbo hosts"
            title="Your guests can't take the trash out. We can."
            text={`We roll your cans to the curb the evening before pickup and back after, whoever is staying, with a GPS-logged photo each time. From ${price}.`}
          />
          <p className="mt-4 text-center text-sm text-muted">
            More for hosts: <Link href="/hosts" className="font-semibold text-teal hover:underline">trash-to-curb for short-term rentals</Link>
          </p>
        </div>
      </article>
      <Footer />
    </>
  );
}
