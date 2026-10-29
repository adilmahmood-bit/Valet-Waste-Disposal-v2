// Content for the residential city pages (/residential/[slug]). Each page has its own local
// copy so the pages are useful on their own, not the same text with a city name swapped.
// Rules: no company names (that includes trash haulers), no unverifiable claims.
// ZIPs must be in residential.serviceZips.

export type CityPage = {
  slug: string;
  name: string;
  zips: string[];
  // Shown in the hero under the headline.
  intro: string;
  // "Living in X" section: what's different about bins here.
  localHeading: string;
  local: string[];
  neighborhoods: string[];
  // Short lines for the "Who uses it here" list.
  whoUsesIt: string[];
  faqs: { q: string; a: string }[];
  // True for areas where vacation rentals are a big share of homes; adds the hosts callout.
  strHeavy: boolean;
};

export const cityPages: CityPage[] = [
  {
    slug: "solana-beach",
    name: "Solana Beach",
    zips: ["92075"],
    intro:
      "Bin valet for Solana Beach homes. The evening before your trash day, we roll your trash, recycling and green waste bins to the curb. After the truck comes, we bring them back.",
    localHeading: "Trash day in Solana Beach",
    local: [
      "Solana Beach is a small coastal city with a lot of tight lots, narrow side yards and homes set back up a slope. Bins often live behind a gate or down a side path, which makes the weekly trip to the street a real chore.",
      "Near the coast, many homes are second homes or rentals that sit empty for part of the week. With weekly service, your bins still go out and come back whether anyone is home or not.",
    ],
    neighborhoods: ["Lomas Santa Fe", "Eden Gardens", "Seaside", "Fletcher Cove area", "North Rios"],
    whoUsesIt: [
      "Homeowners who'd rather not haul bins up and down a sloped driveway",
      "Owners of second homes who are only in town part of the year",
      "Vacation rental hosts between guest stays",
      "Older residents and anyone who finds heavy bins hard to move",
    ],
    faqs: [
      {
        q: "Do you need to be home in Solana Beach for service?",
        a: "No. Tell us where your bins are and add a gate code if you have one. We handle the rest whether you're home or away.",
      },
      {
        q: "My bins are behind a gate up a steep path. Can you still do it?",
        a: "Usually, yes. Check the steep driveway or stairs box when you sign up and we'll text you a price before service starts.",
      },
    ],
    strHeavy: false,
  },
  {
    slug: "carlsbad",
    name: "Carlsbad",
    zips: ["92008", "92009", "92010", "92011"],
    intro:
      "Bin valet for Carlsbad homes in all four ZIP codes. We take your trash, recycling and green waste bins to the curb the evening before pickup, then return them to their spot after collection.",
    localHeading: "Trash day in Carlsbad",
    local: [
      "Many Carlsbad neighborhoods have larger lots, long driveways and bins kept in a side yard or garage. That's a long walk with three full bins, every week.",
      "A lot of Carlsbad homes are in HOA communities, and many HOAs ask that bins not sit at the curb or in view any longer than needed. We bring yours back after pickup so they're out of sight again.",
    ],
    neighborhoods: ["La Costa", "Aviara", "Bressi Ranch", "Calavera Hills", "Olde Carlsbad", "Carlsbad Village", "Rancho Carrillo"],
    whoUsesIt: [
      "Busy families with long driveways and three or more bins",
      "HOA homeowners who want bins back out of view after pickup",
      "Frequent travelers who don't want bins left at the street",
      "Older residents and their families",
    ],
    faqs: [
      {
        q: "Do you serve all of Carlsbad?",
        a: "Yes. We serve all four Carlsbad ZIP codes: 92008, 92009, 92010 and 92011.",
      },
      {
        q: "My HOA has rules about when bins can be out. Can you work with that?",
        a: "Yes. Bins go out the evening before pickup and come back after collection. Add any HOA rules in your notes when you sign up.",
      },
    ],
    strHeavy: false,
  },
  {
    slug: "encinitas",
    name: "Encinitas",
    zips: ["92024", "92007"],
    intro:
      "Bin valet for Encinitas homes, from Leucadia to Olivenhain and Cardiff-by-the-Sea. We roll your bins to the curb the evening before trash day and bring them back after pickup.",
    localHeading: "Trash day in Encinitas",
    local: [
      "Encinitas covers a lot of ground. Homes near the coast in Leucadia and Cardiff often have tight side yards and street parking that makes bin placement tricky. Inland, Olivenhain homes can have long, steep driveways.",
      "Coastal Encinitas also has many vacation rentals and part-time homes. Weekly service keeps trash day on track whether the house is full or empty.",
    ],
    neighborhoods: ["Leucadia", "Old Encinitas", "New Encinitas", "Olivenhain", "Cardiff-by-the-Sea"],
    whoUsesIt: [
      "Olivenhain homeowners with long or steep driveways",
      "Coastal homeowners with tight side yards",
      "Vacation rental hosts in Leucadia and Cardiff",
      "Older residents who'd rather not move heavy bins",
    ],
    faqs: [
      {
        q: "Do you serve Cardiff-by-the-Sea?",
        a: "Yes. We serve Cardiff (92007) along with the rest of Encinitas (92024).",
      },
      {
        q: "My Olivenhain driveway is long and steep. What does that cost?",
        a: "Check the steep driveway or long walk box when you sign up. We'll look at it and text you a custom price before you start.",
      },
    ],
    strHeavy: true,
  },
  {
    slug: "mission-beach",
    name: "Mission Beach",
    zips: ["92109"],
    intro:
      "Bin valet for Mission Beach homes and vacation rentals. We get your bins out the evening before trash day and back after pickup, so they're not left sitting out between guests.",
    localHeading: "Trash day in Mission Beach",
    local: [
      "Mission Beach is one of San Diego's busiest short-term rental neighborhoods. Homes turn over guests every few days, and guests rarely know which day is trash day. Missed pickups mean overflowing bins for the next arrival.",
      "Many homes sit on narrow walk streets, the courts and places between Mission Boulevard and the boardwalk, with very little room to store or move bins. Tell us where your bins live and where they go for pickup, and we'll handle it each week.",
    ],
    neighborhoods: ["North Mission Beach", "South Mission Beach", "Bayside walk streets", "Ocean Front Walk"],
    whoUsesIt: [
      "Vacation rental hosts and property managers",
      "Owners of second homes",
      "Full-time residents on walk streets with tight bin space",
    ],
    faqs: [
      {
        q: "Can you handle bins for a Mission Beach short-term rental?",
        a: "Yes. That's one of the main reasons people use us here. Bins go out and come back every week, and guests don't need to do anything.",
      },
      {
        q: "My bins have to go somewhere other than the front of the house. Is that OK?",
        a: "Yes. Add a note about where your bins live and where they need to go for pickup when you sign up.",
      },
    ],
    strHeavy: true,
  },
  {
    slug: "pacific-beach",
    name: "Pacific Beach",
    zips: ["92109"],
    intro:
      "Bin valet for Pacific Beach homes, rentals and vacation properties. Bins to the curb the evening before trash day, back to their spot after pickup.",
    localHeading: "Trash day in Pacific Beach",
    local: [
      "Pacific Beach has a mix of family homes, long-term rentals and vacation rentals. In rental homes especially, nobody owns trash day, and bins get missed or left at the curb for days.",
      "Lots here are often small, with bins tucked down a side yard or in a back alley. We learn your setup once, then do it the same way every week.",
    ],
    neighborhoods: ["Crown Point", "North Pacific Beach", "Bird Rock border", "Sail Bay", "Mission Bay Park area"],
    whoUsesIt: [
      "Vacation rental hosts between guests",
      "Landlords who want trash day handled for their tenants",
      "Homeowners who travel or work long hours",
    ],
    faqs: [
      {
        q: "I'm a landlord. Can you service a rental I don't live in?",
        a: "Yes. Sign up with the rental's address and your own phone and email. We'll handle the bins without needing your tenants.",
      },
      {
        q: "Do you serve both Pacific Beach and Mission Beach?",
        a: "Yes. We serve the whole 92109 ZIP code, which includes both.",
      },
    ],
    strHeavy: true,
  },
  {
    slug: "la-jolla",
    name: "La Jolla",
    zips: ["92037"],
    intro:
      "Bin valet for La Jolla homes. We take your trash, recycling and green waste bins to the curb the evening before pickup and return them after collection.",
    localHeading: "Trash day in La Jolla",
    local: [
      "La Jolla has hillside streets, steep driveways and homes set far back from the road, especially around Mount Soledad and the Muirlands. Moving full bins down and back up every week is hard work.",
      "Many La Jolla homes are second homes or vacation rentals, so nobody is around on trash day. Weekly service keeps bins going out and coming back on schedule.",
    ],
    neighborhoods: ["La Jolla Shores", "Bird Rock", "Muirlands", "Mount Soledad", "La Jolla Village", "Windansea"],
    whoUsesIt: [
      "Hillside homeowners with steep or long driveways",
      "Owners of second homes who are away for stretches",
      "Vacation rental hosts",
      "Older residents and their families",
    ],
    faqs: [
      {
        q: "My La Jolla driveway is very steep. Can you still service it?",
        a: "Usually, yes. Check the steep driveway box when you sign up and we'll text you a price before service starts.",
      },
      {
        q: "I'm only in La Jolla part of the year. Does that work?",
        a: "Yes. Service runs whether you're home or not. Text us if you want to pause for a stretch.",
      },
    ],
    strHeavy: true,
  },
];

export const cityBySlug = (slug: string) => cityPages.find((c) => c.slug === slug);
