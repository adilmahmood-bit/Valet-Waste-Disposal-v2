import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Footer from "@/components/Footer";
import PorterCalculator from "@/components/blog/PorterCalculator";
import PollResults from "@/components/blog/PollResults";
import { postUrl, posts, SITE, formatPostDate as fmt } from "@/lib/blog";

const post = posts.find((p) => p.slug === "is-valet-trash-worth-it")!;
const url = postUrl(post.slug);

export const metadata: Metadata = {
  title: { absolute: post.seoTitle ?? post.title },
  description: post.description,
  alternates: { canonical: `/blog/${post.slug}` },
  openGraph: {
    title: post.title,
    description: post.description,
    url: `/blog/${post.slug}`,
    siteName: "Valet Waste Disposal",
    locale: "en_US",
    type: "article",
    publishedTime: post.published,
    modifiedTime: post.updated,
    images: [{ url: post.image.src, width: post.image.width, height: post.image.height, alt: post.image.alt }],
  },
  twitter: { card: "summary_large_image" },
};

// Questions below are shown on the page and repeated in FAQPage schema, word for word.
const faqs = [
  {
    q: "How much time do porters spend on apartment dumpster pads?",
    a: "It depends on the number of dumpster areas and how residents use them. Among San Diego communities we have talked with, we heard anywhere from 30 to 45 minutes three times a week at one property to about three hours every morning at a community with 13 dumpster areas.",
  },
  {
    q: "Does valet trash replace porters?",
    a: "No. Porters still have plenty to do. Valet trash takes the nightly dumpster pad work off their list, so their time goes back to make-readies, common areas and resident requests.",
  },
  {
    q: "What causes contamination fines at apartment communities?",
    a: "Usually the wrong material in a recycling container, such as bagged trash or food waste, or containers that overflow before pickup. Whether the fine comes from the hauler or the city depends on the area and the contract.",
  },
  {
    q: "How does valet trash work in an apartment?",
    a: "Each unit gets a lidded container. On service nights, residents set their tied trash bag out in the container just outside their door by a set time, usually early evening. An attendant then walks every floor, collects each bag, carries it to the dumpster or compactor and tidies the dumpster pad. Service usually runs three to five nights a week, and the property gets a report of every door serviced.",
  },
  {
    q: "How much do apartments pay for valet trash?",
    a: "Valet trash is usually billed as a flat monthly fee per unit, often called a per-door fee. The rate depends on the number of units, how many nights a week the service runs and how the property is laid out, such as stairs, elevators and the distance to the dumpsters. Many properties pass the fee through to residents, so the service costs the property little or nothing.",
  },
  {
    q: "Who pays for valet trash?",
    a: "The property pays the valet company and decides whether to fund it or pass some or all of the cost to residents. That is the owner's decision, and owners should check with their own counsel on resident fees.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      headline: post.title,
      description: post.description,
      image: `${SITE}${post.image.src}`,
      datePublished: post.published,
      dateModified: post.updated,
      // Credited to the company (the #org node on the homepage), not a named person.
      author: { "@id": `${SITE}/#org` },
      publisher: { "@id": `${SITE}/#org` },
      mainEntityOfPage: url,
      about: ["Valet trash", "Cost of valet trash", "Apartment waste management", "Dumpster pad maintenance", "Contamination fines"],
      spatialCoverage: { "@type": "AdministrativeArea", name: "San Diego County, CA" },
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ],
};

function Photo({ src, alt, caption, w, h, narrow }: { src: string; alt: string; caption: string; w: number; h: number; narrow?: boolean }) {
  return (
    <figure className={`my-8 ${narrow ? "max-w-md mx-auto" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={w} height={h} loading="lazy" className="w-full h-auto rounded-2xl" />
      <figcaption className="mt-2 text-sm text-muted">{caption}</figcaption>
    </figure>
  );
}

export default function Page() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <article className="px-4 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link href="/" className="hover:text-teal">Home</Link> <span aria-hidden="true">/</span>{" "}
            <Link href="/blog" className="hover:text-teal">Blog</Link>
          </nav>

          <h1 className="font-heading text-4xl sm:text-5xl text-ink mt-4 leading-tight">{post.title}</h1>
          <p className="mt-4 text-lg text-ink-mid">
            What San Diego apartment managers told us about porters, dumpster pads and contamination fines, and how to
            put a number on it for your own property.
          </p>
          <p className="mt-4 text-sm text-muted">
            Updated <time dateTime={post.updated}>{fmt(post.updated)}</time> ·{" "}
            {post.readMinutes} min read
          </p>

          <div className="article mt-8">
            <aside className="key-points">
              <p className="font-bold text-ink">Key points</p>
              <ul>
                <li>At most garden-style communities we visit, porters clean the dumpster pads. That time rarely shows up as a waste cost.</li>
                <li>We heard everything from 30 to 45 minutes three times a week to about three hours every morning.</li>
                <li>Contamination fines often lead properties to add porter time. The fine shrinks, but the cost moves to payroll.</li>
                <li>Valet trash doesn&apos;t replace porters. It gives them their mornings back.</li>
              </ul>
            </aside>

            <p>
              Ask a property manager what trash costs and you&apos;ll usually hear the hauler invoice. Ask the maintenance team
              and you get a different answer: the first hour of the day spent on the dumpster pad.
            </p>
            <p>
              Over the past several months I&apos;ve walked dozens of apartment communities across San Diego County and talked
              with managers, maintenance supervisors and porters about how trash really works at their property. The same
              cost came up again and again, and almost nobody had a number for it.
            </p>

            <h2>How much porter time goes to the dumpster pad?</h2>
            <p>
              More than most budgets account for. When residents carry their own trash down, porters end up picking up
              bags left next to the dumpster, breaking down boxes, moving trash from full dumpsters to emptier ones and
              pulling the wrong items out of recycling. Here is what managers told us:
            </p>
            <ul>
              <li>At a garden-style community in the South Bay, a porter comes three times a week and spends 30 to 45 minutes cleaning the dumpster pads. The manager said they still deal with pests from overfilled dumpsters.</li>
              <li>At a 284-unit community with 13 dumpster areas, porters spend about three hours every morning sorting trash before it becomes a problem.</li>
              <li>At a three-story garden community with 16 dumpster pads, we heard porters are constantly working the pads.</li>
              <li>Another community told us their staff cleans 22 dumpsters every morning.</li>
            </ul>
            <p>
              None of these managers said their porters were doing a bad job. The pad work is simply what happens when
              hundreds of residents use a few shared dumpsters on their own schedule.
            </p>

            <h2>Why doesn&apos;t that cost show up anywhere?</h2>
            <p>
              Because it isn&apos;t on the waste invoice. The hauler bills for containers, pickups and fees. Porter time is
              paid through payroll or a maintenance contract, so it sits in a different budget line.
            </p>
            <p>
              I heard the same point in a recent industry webinar on multifamily waste spend. Procurement and waste
              leaders agreed that onsite labor is rarely counted when properties look at what waste really costs them.
              That matches what we hear in the field. Managers can tell us who cleans the pads, but rarely what it costs.
            </p>
            <p>
              The live poll during that webinar showed the same thing. Every attendee who answered said their organization
              rarely counts onsite labor in waste costs, and most pointed to overage and contamination fees as the hardest
              part of waste spend to see and predict.
            </p>
            <PollResults />

            <PorterCalculator />

            <h2>How contamination fines turn into porter hours</h2>
            <p>
              The clearest example came from the 284-unit community above. The manager told us they once received 10
              recycling violations in a single month, at $150 each. That&apos;s $1,500 in one month.
            </p>
            <p>
              Their fix was reasonable: they put porters on the dumpster areas every morning. Violations dropped to
              about one a month. But the sorting now takes about three porter hours a day. The fine got smaller. The cost
              didn&apos;t go away. It moved from the hauler invoice to payroll, where nobody tracks it as a waste cost.
            </p>
            <p>
              We heard versions of this elsewhere. One community said fines ran about $700 a month after a hauler change.
              Another said its trash fees were going up because of contamination fines, more frequent pickups and the
              porter time needed to clean up.
            </p>

            <h2>What the pad looks like before pickup</h2>
            <p>
              These photos are from two San Diego County communities. They show the
              two problems we see most: dumpsters filled past the rim, and recyclables that fill space they don&apos;t need to.
            </p>
            <Photo
              src="/blog/porter-time/overfilled-trash-dumpster-recyclables.jpg"
              alt="Trash dumpster filled to the rim with paper shopping bags, cardboard and bubble wrap"
              caption="A trash dumpster full of paper bags, cardboard and bubble wrap. One bag on top is printed with “recycle or repurpose this bag.”"
              w={1600}
              h={568}
            />
            <Photo
              src="/blog/porter-time/dumpster-lid-cannot-close.jpg"
              alt="Trash bags and an open shoe box piled above the rim of a dumpster so the lid can't close"
              caption="Bags piled above the rim, so the lid can't close. Open dumpsters can attract pests and let litter blow onto the pad."
              w={1600}
              h={424}
            />
            <Photo
              src="/blog/porter-time/recycling-bin-unbroken-boxes.jpg"
              alt="Recycling dumpster in an indoor trash room buried under boxes that were not broken down, with litter on the floor"
              caption="A recycling dumpster in an indoor trash room, buried under boxes nobody broke down. Someone has to flatten them before the next pickup."
              w={1200}
              h={1600}
              narrow
            />

            <h2>What San Diego managers try</h2>
            <p>Every property we visited was already doing something about it. The most common approaches:</p>
            <ul>
              <li><strong>Resident education.</strong> Signs, emails and move-in reminders. It helps, but residents change and habits slip.</li>
              <li><strong>Cameras or locks at the pad.</strong> Good for finding who left a mattress. They don&apos;t sort the recycling.</li>
              <li><strong>More pickups or bigger containers.</strong> Fixes overflow, but often one dumpster is full while the next one is half empty.</li>
              <li><strong>More porter time.</strong> It works, and it&apos;s the most common answer. It&apos;s also the cost that never shows up on the waste invoice.</li>
              <li><strong>Nightly doorstep pickup.</strong> Trash is collected at each door and taken to the dumpsters by our crew, so the pad is handled before the morning starts.</li>
            </ul>

            <h2>What changes with valet trash</h2>
            <p>
              Valet trash doesn&apos;t replace your porters. It changes what they spend the morning on. With our service,
              our staff picks up at each door five nights a week, Sunday through Thursday. Bags go into the dumpster, not
              next to it. On each visit we tidy the pad and level the dumpsters so trash is spread across them. Recycling
              is picked up twice a week, and every visit is logged with photos so the office can see what was done.
            </p>
            <p>
              The aim is a pad that&apos;s already handled when maintenance arrives. That usually means fewer overflow
              problems, fewer surprises on the waste invoice and porters who can go straight to make-readies, common areas
              and resident requests.
            </p>
            <Photo
              src="/blog/porter-time/leveled-dumpsters-report-sample.jpg"
              alt="Report card for one trash enclosure showing two dumpsters with closed lids, each dumpster's fill level on arrival and after leveling, and checks for trash leveled, pad swept and lids closed"
              caption="What a leveled enclosure looks like. Each visit records how full every dumpster was on arrival and after leveling. This is an example of the nightly dumpster pad report managers receive."
              w={722}
              h={852}
              narrow
            />

            <h2>What if residents don&apos;t want to pay?</h2>
            <p>
              It&apos;s the most common pushback we hear, and it&apos;s fair. But at most communities we&apos;ve visited,
              residents are already paying for trash. They just don&apos;t see what&apos;s in the number.
            </p>
            <p>
              Contamination fines, extra pickups, porter time on the pad and chute cleaning all have to be paid for
              somewhere. At many properties, those costs show up in a monthly trash fee that changes as they change. One property told us they were dropping valet trash. In the same breath, they said they would need to start charging a chute maintenance fee because they frequently break and jam with overuse.
            </p>
            <p>
              So the real question usually isn&apos;t whether residents pay for trash. It&apos;s what they get for it: a porter fee that rises with fines and cleanup, or a service that handles an annoying chore for them, nightly.
            </p>
            <p className="text-sm text-muted">
              How a property funds its waste program, and whether it passes any cost to residents, is the owner&apos;s
              decision. Check with your own counsel on resident fees.
            </p>

            <h2>When valet trash isn&apos;t the right fit</h2>
            <p>
              Not every property needs it. Managers at smaller communities with plenty of easy-to-reach dumpsters often told us
              they have no real trash problem, and they&apos;re right. Valet trash makes the most sense at multi-story
              garden communities without elevators or chutes, where residents carry trash down stairs and across the
              property every day. It matters even more at 55+ and independent-living communities, and at properties with lots of families. Seniors can struggle with heavy bags on the stairs, and when teenagers take out the trash, the bag doesn&apos;t always make it into the dumpster.
            </p>

            <h2>Frequently asked questions</h2>
            {faqs.map((f) => (
              <div key={f.q} className="faq">
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-3xl bg-navy p-8 sm:p-10 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-soft">Free 10-minute pad walk</p>
            <h2 className="font-heading text-2xl sm:text-3xl mt-2">A cleaner community, without more porter hours</h2>
            <p className="mt-3 text-white/85">
              Give me 10 minutes to walk your dumpster pads. I&apos;ll show you how nightly valet trash keeps the pads clean
              before your team arrives, so porter time goes to the rest of the property.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/#contact" className="btn-primary rounded-full px-5 py-2.5 text-sm font-semibold text-white">
                Book a pad walk
              </Link>
              <a href="tel:+16193248875" className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:border-white">
                Call or text 619-324-8875
              </a>
            </div>
          </div>
        </div>
      </article>
      <Footer />
    </>
  );
}
