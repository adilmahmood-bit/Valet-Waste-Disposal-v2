import type { Metadata } from "next";
import Hero from "@/components/Hero";
import PainPoints from "@/components/PainPoints";
import Services from "@/components/Services";
import StatsBar from "@/components/StatsBar";
import Compare from "@/components/Compare";
import HowItWorks from "@/components/HowItWorks";
import CTABand from "@/components/CTABand";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = { alternates: { canonical: "/" } };

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
  ],
};

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
      <CTABand />
      <Footer />
    </>
  );
}
