import { residential, enabledPlans } from "@/config/residential";

// Structured data shared by the residential and /hosts pages. Every page names the same
// business ("Doorstep Disposal", run by Valet Waste Disposal) under one @id, so search
// engines and AI tools see a single brand instead of two competing names.
export const SITE = "https://yourdoorstepdisposal.com";
export const BRAND = "Doorstep Disposal";
export const PARENT = "Valet Waste Disposal";
export const BUSINESS_ID = `${SITE}/residential#business`;
// Doorstep Disposal's Google Business Profile (knowledge graph ID /g/11zkyrvklp, from the share
// link Adil sent 2026-11-23). Tells Google the site and the profile are the same business.
export const GOOGLE_PROFILE = "https://www.google.com/search?kgmid=/g/11zkyrvklp";

export const areaServed = () => residential.serviceCities.map((name) => ({ "@type": "City", name: `${name}, CA` }));

// Full business entity. Put it on one page per graph; elsewhere use businessRef().
export function residentialBusiness() {
  const { contact } = residential;
  return {
    "@type": "LocalBusiness",
    "@id": BUSINESS_ID,
    name: BRAND,
    alternateName: `${BRAND} - Trash-to-Curb`,
    description:
      "Trash-to-curb (trash can valet) service for homes and short-term rentals in San Diego and North County. We take trash, recycling and green waste cans to the curb the evening before pickup and bring them back after.",
    url: `${SITE}/residential`,
    telephone: `+1-${contact.phone}`,
    email: contact.email,
    image: `${SITE}/residential-hero-ranch.jpg`,
    address: { "@type": "PostalAddress", addressLocality: "San Diego", addressRegion: "CA", addressCountry: "US" },
    areaServed: areaServed(),
    sameAs: [GOOGLE_PROFILE],
    parentOrganization: { "@type": "Organization", "@id": `${SITE}/#org`, name: PARENT, url: SITE },
  };
}

export const businessRef = () => ({ "@id": BUSINESS_ID });

export function offers() {
  return enabledPlans().map((p) => ({
    "@type": "Offer",
    name: p.name,
    priceCurrency: "USD",
    price: p.basePrice,
    ...(p.billing === "monthly" && {
      priceSpecification: { "@type": "UnitPriceSpecification", price: p.basePrice, priceCurrency: "USD", unitText: "MONTH" },
    }),
  }));
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE}${it.path}` })),
  };
}

export const faqPage = (faqs: { q: string; a: string }[]) => ({
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});
