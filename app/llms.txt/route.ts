import { residential, enabledPlans, advertisedPrice, promoOn, money } from "@/config/residential";
import { cityPages } from "@/components/residential/cities";
import { faqs } from "@/components/residential/faq";
import { SITE } from "@/components/residential/schema";

// /llms.txt: a plain-text summary of the business for AI assistants and crawlers
// (see llmstxt.org). Built from config at build time, so prices, areas and contact
// details always match the site.
export const dynamic = "force-static";

function body() {
  const { contact, promo } = residential;
  const plans = enabledPlans()
    .map((p) => {
      const per = p.billing === "monthly" ? "/month" : "";
      const deal = promoOn(p) ? ` (${money(advertisedPrice(p))}${per} with code ${promo.label}, first ${promo.limit} customers)` : "";
      return `- ${p.name}: ${money(p.basePrice)}${per}${deal}. Up to ${p.includedBins} cans; extra cans ${money(p.extraBinPrice)} each${per}.`;
    })
    .join("\n");

  return `# Doorstep Disposal

> Doorstep Disposal is a trash-to-curb (trash can valet) service for homes and short-term rentals in San Diego and North County, California. Every week we take trash, recycling and green waste cans to the curb the evening before pickup and bring them back after. It is run by Valet Waste Disposal, a locally owned San Diego company that also provides nightly valet trash for apartment communities.

Contact: call or text ${contact.phone}, email ${contact.email}.

## Residential trash-to-curb service

- What it is: also called trash can valet, bin valet, can-to-curb or curbside trash can service.
- No one needs to be home. Customers tell us where the cans are kept and add a gate code if needed.
- We follow each city's holiday collection schedule.
- Staff are background-checked.
- Not included: trash can cleaning, bulky items, junk removal.
- Steep driveways, stairs or a long walk to the curb may get a custom quote.

Pricing:
${plans}

Service area: ${residential.serviceCities.join(", ")}.

## Airbnb, Vrbo and short-term rental hosts

Same service and price as homeowners. Guests don't need to know the trash day: cans go out the evening before pickup and come back after, logged by GPS with photos. Hosts can add several properties, each with its own trash day and notes.

## Apartment communities (valet trash)

Valet Waste Disposal provides nightly doorstep valet trash for apartment communities across San Diego County, with GPS check-ins, photo-verified service reports and recycling checks. Phone 619-324-8875.

## Pages

- [Trash-to-curb service for homes](${SITE}/residential)
- [Pricing](${SITE}/residential/pricing)
- [Service area and ZIP check](${SITE}/residential/service-area)
- [Airbnb and Vrbo hosts](${SITE}/hosts)
- [Service for seniors](${SITE}/residential/seniors)
- [FAQ](${SITE}/residential/faq)
- [Apartment valet trash](${SITE}/)

## City pages

${cityPages.map((c) => `- [${c.name}](${SITE}/residential/${c.slug})`).join("\n")}

## Common questions

${faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n")}
`;
}

export function GET() {
  return new Response(body(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
