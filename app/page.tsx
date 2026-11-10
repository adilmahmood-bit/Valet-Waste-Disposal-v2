import type { Metadata } from "next";
import Link from "next/link";
import Hero from "@/components/Hero";
import PainPoints from "@/components/PainPoints";
import Services from "@/components/Services";
import StatsBar from "@/components/StatsBar";
import Compare from "@/components/Compare";
import HowItWorks from "@/components/HowItWorks";
import CTABand from "@/components/CTABand";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";

// Leads with "valet trash", the phrase property managers search for.
export const metadata: Metadata = {
  title: { absolute: "Valet Trash Service for San Diego Apartments | Valet Waste Disposal" },
  description:
    "Doorstep valet trash for San Diego County apartment communities. Nightly door-to-door trash pickup, photo-verified reports, recycling compliance and a clean trash pad every morning. Owner-operated, licensed and insured.",
  alternates: { canonical: "/" },
};

const SITE = "https://yourdoorstepdisposal.com";

// Site name and business details for search engines; Google uses these for the site name and sitelinks.
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE}/#website`, name: "Valet Waste Disposal", url: SITE, publisher: { "@id": `${SITE}/#org` } },
    {
      "@type": "Organization",
      "@id": `${SITE}/#org`,
      name: "Valet Waste Disposal",
      url: SITE,
      logo: `${SITE}/logo/vwd-logo-navy.png`,
      telephone: "+1-619-324-8875",
      email: "contact@valetwastedisposal.com",
      areaServed: "San Diego County, CA",
    },
    {
      "@type": "Service",
      name: "Valet trash service",
      serviceType: "Valet trash",
      description: "Nightly doorstep trash pickup for apartment communities, with photo-verified service reports.",
      provider: { "@id": `${SITE}/#org` },
      areaServed: { "@type": "AdministrativeArea", name: "San Diego County, CA" },
      url: SITE,
    },
  ],
};

// Plain-language summary in the words people search: valet trash, doorstep trash pickup,
// trash valet. Also points homeowners to the residential can-to-curb service.
function ValetTrashAbout() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-heading text-2xl sm:text-3xl mb-4" style={{ color: "#1B4F72" }}>
          Valet trash in San Diego County
        </h2>
        <p className="text-ink-mid leading-relaxed mb-4">
          Valet trash, also called doorstep trash pickup or trash valet service, means residents set a bagged container
          outside their door in the evening and a uniformed attendant collects it and carries it to the community&apos;s
          dumpster or compactor. No one hauls trash through the halls or leaves bags on the stairs.
        </p>
        <p className="text-ink-mid leading-relaxed mb-4">
          Valet Waste Disposal provides valet trash for apartment communities across San Diego County. Every night of
          service you get a GPS check-in, a photo-verified report, recycling sortation checks and a swept trash pad, so
          residents stay happy and you stay ahead of violations.
        </p>
        <p className="text-ink-mid leading-relaxed">
          Looking for trash can to curb service for a house or short-term rental instead?{" "}
          <Link href="/residential" className="font-semibold underline underline-offset-4" style={{ color: "#0E9AA7" }}>
            See our can-to-curb service for homes
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <JsonLd data={siteJsonLd} />
      <Hero />
      <PainPoints />
      <Services />
      <HowItWorks />
      <StatsBar />
      <Compare />
      <ValetTrashAbout />
      <CTABand />
      <Footer />
    </>
  );
}
