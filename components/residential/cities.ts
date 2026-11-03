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
  // Banner photo at public/residential/cities/<slug>.jpg; `position` is the CSS object-position.
  photo?: { position?: string };
};

export const cityPages: CityPage[] = [
  {
    slug: "oceanside",
    name: "Oceanside",
    zips: ["92054", "92056", "92057", "92058"],
    intro:
      "Trash can valet for Oceanside homes, from the beach neighborhoods to the inland ZIPs. We roll your trash, recycling and green waste cans to the curb the evening before pickup and bring them back after.",
    localHeading: "Trash day in Oceanside",
    local: [
      "Near the coast, Oceanside has a lot of vacation rentals and second homes close to the pier and the Strand. Guests rarely know trash day, and cans left out for days are the first thing the next guest sees.",
      "Inland, many Oceanside neighborhoods have larger lots, long driveways and HOA rules about when cans can be out. We bring yours back after pickup so they're out of sight again.",
    ],
    neighborhoods: ["Downtown Oceanside", "South Oceanside", "Fire Mountain", "Loma Alta", "Rancho del Oro", "Ocean Hills"],
    whoUsesIt: [
      "Vacation rental hosts near the beach",
      "Owners of second homes",
      "HOA homeowners who want cans back out of view",
      "Older residents and their families",
    ],
    faqs: [
      {
        q: "Do you serve all of Oceanside?",
        a: "Yes. We serve all four Oceanside ZIP codes: 92054, 92056, 92057 and 92058.",
      },
      {
        q: "Can you handle cans for my Oceanside vacation rental?",
        a: "Yes. Cans go out and come back every week, and your guests don't need to do anything.",
      },
    ],
    strHeavy: true,
    photo: { position: "50% 55%" },
  },
  {
    slug: "solana-beach",
    name: "Solana Beach",
    zips: ["92075"],
    intro:
      "Trash can valet for Solana Beach homes. The evening before your trash day, we roll your trash, recycling and green waste cans to the curb. After the truck comes, we bring them back.",
    localHeading: "Trash day in Solana Beach",
    local: [
      "Solana Beach is a small coastal city with a lot of tight lots, narrow side yards and homes set back up a slope. Cans often live behind a gate or down a side path, which makes the weekly trip to the street a real chore.",
      "Near the coast, many homes are second homes or rentals that sit empty for part of the week. With weekly service, your trash cans still go out and come back whether anyone is home or not.",
    ],
    neighborhoods: ["Lomas Santa Fe", "Eden Gardens", "Seaside", "Fletcher Cove area", "North Rios"],
    whoUsesIt: [
      "Homeowners who'd rather not haul cans up and down a sloped driveway",
      "Owners of second homes who are only in town part of the year",
      "Vacation rental hosts between guest stays",
      "Older residents and anyone who finds heavy trash cans hard to move",
    ],
    faqs: [
      {
        q: "Do you need to be home in Solana Beach for service?",
        a: "No. Tell us where your trash cans are and add a gate code if you have one. We handle the rest whether you're home or away.",
      },
      {
        q: "My cans are behind a gate up a steep path. Can you still do it?",
        a: "Usually, yes. Check the steep driveway or stairs box when you sign up and we'll text you a price before service starts.",
      },
    ],
    strHeavy: false,
    photo: { position: "50% 50%" },
  },
  {
    slug: "del-mar",
    name: "Del Mar",
    zips: ["92014"],
    intro:
      "Trash can valet for Del Mar homes. We roll your trash, recycling and green waste cans to the curb the evening before pickup and bring them back after the truck comes.",
    localHeading: "Trash day in Del Mar",
    local: [
      "Del Mar packs a lot of homes onto hillsides and narrow beach lots. Many cans live behind a gate, down a side path or at the top of a steep driveway, and some streets have very little curb space on trash day.",
      "Plenty of Del Mar homes are second homes or are empty while owners travel. With weekly service, your trash cans go out and come back on schedule whether you're in town or not.",
    ],
    neighborhoods: ["Olde Del Mar", "Beach Colony", "Del Mar Heights", "Del Mar Terrace", "Crest Canyon area"],
    whoUsesIt: [
      "Hillside homeowners with steep driveways or stairs",
      "Owners of second homes who are away for stretches",
      "Beach-area homes with tight side yards",
      "Older residents and their families",
    ],
    faqs: [
      {
        q: "Do you serve all of Del Mar?",
        a: "Yes. We serve the 92014 ZIP code, which covers Del Mar and Del Mar Heights.",
      },
      {
        q: "There are stairs between my cans and the street. Can you still do it?",
        a: "Usually, yes. Check the stairs box when you sign up and we'll text you a price before service starts.",
      },
    ],
    strHeavy: false,
    photo: { position: "50% 50%" },
  },
  {
    slug: "carlsbad",
    name: "Carlsbad",
    zips: ["92008", "92009", "92010", "92011"],
    intro:
      "Trash can valet for Carlsbad homes in all four ZIP codes. We take your trash, recycling and green waste cans to the curb the evening before pickup, then return them to their spot after collection.",
    localHeading: "Trash day in Carlsbad",
    local: [
      "Many Carlsbad neighborhoods have larger lots, long driveways and cans kept in a side yard or garage. That's a long walk with three full cans, every week.",
      "A lot of Carlsbad homes are in HOA communities, and many HOAs ask that cans not sit at the curb or in view any longer than needed. We bring yours back after pickup so they're out of sight again.",
    ],
    neighborhoods: ["La Costa", "Aviara", "Bressi Ranch", "Calavera Hills", "Olde Carlsbad", "Carlsbad Village", "Rancho Carrillo"],
    whoUsesIt: [
      "Busy families with long driveways and three or more cans",
      "HOA homeowners who want cans back out of view after pickup",
      "Frequent travelers who don't want cans left at the street",
      "Older residents and their families",
    ],
    faqs: [
      {
        q: "Do you serve all of Carlsbad?",
        a: "Yes. We serve all four Carlsbad ZIP codes: 92008, 92009, 92010 and 92011.",
      },
      {
        q: "My HOA has rules about when cans can be out. Can you work with that?",
        a: "Yes. Cans go out the evening before pickup and come back after collection. Add any HOA rules in your notes when you sign up.",
      },
    ],
    strHeavy: false,
    photo: { position: "50% 45%" },
  },
  {
    slug: "encinitas",
    name: "Encinitas",
    zips: ["92024", "92007"],
    intro:
      "Trash can valet for Encinitas homes, from Leucadia to Olivenhain and Cardiff-by-the-Sea. We roll your trash cans to the curb the evening before trash day and bring them back after pickup.",
    localHeading: "Trash day in Encinitas",
    local: [
      "Encinitas covers a lot of ground. Homes near the coast in Leucadia and Cardiff often have tight side yards and street parking that makes can placement tricky. Inland, Olivenhain homes can have long, steep driveways.",
      "Coastal Encinitas also has many vacation rentals and part-time homes. Weekly service keeps trash day on track whether the house is full or empty.",
    ],
    neighborhoods: ["Leucadia", "Old Encinitas", "New Encinitas", "Olivenhain", "Cardiff-by-the-Sea"],
    whoUsesIt: [
      "Olivenhain homeowners with long or steep driveways",
      "Coastal homeowners with tight side yards",
      "Vacation rental hosts in Leucadia and Cardiff",
      "Older residents who'd rather not move heavy trash cans",
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
    photo: { position: "50% 50%" },
  },
  {
    slug: "cardiff-by-the-sea",
    name: "Cardiff-by-the-Sea",
    zips: ["92007"],
    intro:
      "Trash can valet for Cardiff-by-the-Sea homes. The evening before trash day, we take your trash cans to the curb. After pickup, we bring them back to their spot.",
    localHeading: "Trash day in Cardiff",
    local: [
      "Cardiff's streets climb from the coast up the hills above San Elijo Lagoon. Many homes have sloped driveways, tight side yards and cans tucked behind a fence, which makes the weekly haul to the curb a chore.",
      "Near the beach, a lot of Cardiff homes are vacation rentals or part-time homes. Weekly service keeps trash day on track between guests or while you're away.",
    ],
    neighborhoods: ["Cardiff Village", "Glen Park area", "Birmingham Drive area", "San Elijo Lagoon area"],
    whoUsesIt: [
      "Homeowners with sloped driveways or long side yards",
      "Vacation rental hosts near the beach",
      "Owners of part-time homes",
      "Older residents who'd rather not move heavy trash cans",
    ],
    faqs: [
      {
        q: "Is Cardiff part of your Encinitas service?",
        a: "Yes. Cardiff is part of Encinitas, and we serve its ZIP code, 92007, along with the rest of Encinitas (92024).",
      },
      {
        q: "Can you handle cans for my Cardiff vacation rental?",
        a: "Yes. Cans go out and come back every week, and your guests don't need to do anything.",
      },
    ],
    strHeavy: true,
    photo: { position: "50% 50%" },
  },
  {
    slug: "mission-beach",
    name: "Mission Beach",
    zips: ["92109"],
    intro:
      "Trash can valet for Mission Beach homes and vacation rentals. We get your trash cans out the evening before trash day and back after pickup, so they're not left sitting out between guests.",
    localHeading: "Trash day in Mission Beach",
    local: [
      "Mission Beach is one of San Diego's busiest short-term rental neighborhoods. Homes turn over guests every few days, and guests rarely know which day is trash day. Missed pickups mean overflowing cans for the next arrival.",
      "Many homes sit on narrow walk streets, the courts and places between Mission Boulevard and the boardwalk, with very little room to store or move cans. Tell us where your trash cans live and where they go for pickup, and we'll handle it each week.",
    ],
    neighborhoods: ["North Mission Beach", "South Mission Beach", "Bayside walk streets", "Ocean Front Walk"],
    whoUsesIt: [
      "Vacation rental hosts and property managers",
      "Owners of second homes",
      "Full-time residents on walk streets with tight can space",
    ],
    faqs: [
      {
        q: "Can you handle cans for a Mission Beach short-term rental?",
        a: "Yes. That's one of the main reasons people use us here. Cans go out and come back every week, and guests don't need to do anything.",
      },
      {
        q: "My cans have to go somewhere other than the front of the house. Is that OK?",
        a: "Yes. Add a note about where your trash cans live and where they need to go for pickup when you sign up.",
      },
    ],
    strHeavy: true,
    photo: { position: "50% 60%" },
  },
  {
    slug: "pacific-beach",
    name: "Pacific Beach",
    zips: ["92109"],
    intro:
      "Trash can valet for Pacific Beach homes, rentals and vacation properties. Cans to the curb the evening before trash day, back to their spot after pickup.",
    localHeading: "Trash day in Pacific Beach",
    local: [
      "Pacific Beach has a mix of family homes, long-term rentals and vacation rentals. In rental homes especially, nobody owns trash day, and cans get missed or left at the curb for days.",
      "Lots here are often small, with cans tucked down a side yard or in a back alley. We learn your setup once, then do it the same way every week.",
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
        a: "Yes. Sign up with the rental's address and your own phone and email. We'll handle the cans without needing your tenants.",
      },
      {
        q: "Do you serve both Pacific Beach and Mission Beach?",
        a: "Yes. We serve the whole 92109 ZIP code, which includes both.",
      },
    ],
    strHeavy: true,
    photo: { position: "50% 50%" },
  },
  {
    slug: "la-jolla",
    name: "La Jolla",
    zips: ["92037"],
    intro:
      "Trash can valet for La Jolla homes. We take your trash, recycling and green waste cans to the curb the evening before pickup and return them after collection.",
    localHeading: "Trash day in La Jolla",
    local: [
      "La Jolla has hillside streets, steep driveways and homes set far back from the road, especially around Mount Soledad and the Muirlands. Moving full cans down and back up every week is hard work.",
      "Many La Jolla homes are second homes or vacation rentals, so nobody is around on trash day. Weekly service keeps cans going out and coming back on schedule.",
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
    photo: { position: "50% 50%" },
  },
  {
    slug: "ocean-beach",
    name: "Ocean Beach",
    zips: ["92107"],
    intro:
      "Trash can valet for Ocean Beach homes and rentals. The evening before trash day, we take your cans to the curb. After pickup, we bring them back to their spot.",
    localHeading: "Trash day in Ocean Beach",
    local: [
      "Ocean Beach is packed with older cottages, small lots and narrow streets, and many cans live down a side yard or out by the alley. Getting three cans out and back every week takes more effort than it should.",
      "OB also has a lot of rentals and vacation rentals. When tenants or guests change, trash day is easy to miss. Weekly service keeps it on schedule no matter who is staying.",
    ],
    neighborhoods: ["Ocean Beach", "Sunset Cliffs", "OB Pier area", "Point Loma Heights"],
    whoUsesIt: [
      "Vacation rental hosts between guests",
      "Landlords who want trash day handled for their tenants",
      "Homeowners on tight lots and alleys",
      "Older residents who'd rather not move heavy trash cans",
    ],
    faqs: [
      {
        q: "My cans go out to the alley, not the street. Is that OK?",
        a: "Yes. Add a note about where your cans live and where they go for pickup when you sign up.",
      },
      {
        q: "Do you serve Sunset Cliffs?",
        a: "Yes. We serve the whole 92107 ZIP code, which includes Ocean Beach and Sunset Cliffs.",
      },
    ],
    strHeavy: true,
    photo: { position: "50% 55%" },
  },
  {
    slug: "point-loma",
    name: "Point Loma",
    zips: ["92106"],
    intro:
      "Trash can valet for Point Loma homes. We roll your trash, recycling and green waste cans to the curb the evening before pickup and bring them back after.",
    localHeading: "Trash day in Point Loma",
    local: [
      "Point Loma's streets climb up the peninsula, and a lot of homes sit on slopes with steep driveways or stairs between the cans and the street. That's a hard trip with full cans, every week.",
      "Many Point Loma households travel or are away for stretches. With weekly service, your cans go out and come back on schedule whether you're home or not.",
    ],
    neighborhoods: ["La Playa", "Loma Portal", "Roseville", "Fleetridge", "Wooded Area"],
    whoUsesIt: [
      "Hillside homeowners with steep driveways or stairs",
      "Frequent travelers",
      "Owners of second homes",
      "Older residents and their families",
    ],
    faqs: [
      {
        q: "Do you serve all of Point Loma?",
        a: "Yes. We serve the 92106 ZIP code. Ocean Beach and Sunset Cliffs (92107) are covered too.",
      },
      {
        q: "There are stairs between my cans and the street. Can you still do it?",
        a: "Usually, yes. Check the stairs box when you sign up and we'll text you a price before service starts.",
      },
    ],
    strHeavy: false,
    photo: { position: "50% 50%" },
  },
  {
    slug: "hillcrest-uptown",
    name: "Hillcrest & Uptown",
    zips: ["92103"],
    intro:
      "Trash can valet for Hillcrest, Mission Hills, Bankers Hill and the rest of Uptown. We take your cans to the curb the evening before trash day and bring them back after pickup.",
    localHeading: "Trash day in Uptown",
    local: [
      "Uptown has older homes on hillside streets and canyon edges, and on many blocks the cans go out to an alley instead of the street. Curb space is tight, and cans left out for days get in everyone's way.",
      "Many Uptown homes are rentals, duplexes or vacation rentals. When nobody owns trash day, cans get missed. We handle it the same way every week.",
    ],
    neighborhoods: ["Hillcrest", "Mission Hills", "Bankers Hill", "Middletown"],
    whoUsesIt: [
      "Vacation rental hosts",
      "Landlords with duplexes and small rentals",
      "Hillside homeowners with stairs or steep paths",
      "Busy professionals who travel",
    ],
    faqs: [
      {
        q: "Do you serve Mission Hills and Bankers Hill?",
        a: "Yes. We serve the whole 92103 ZIP code, which covers Hillcrest, Mission Hills, Bankers Hill and Middletown.",
      },
      {
        q: "My cans go out to the alley. Is that OK?",
        a: "Yes. Add a note about where your cans live and where they go for pickup when you sign up.",
      },
    ],
    strHeavy: true,
    photo: { position: "50% 50%" },
  },
  {
    slug: "north-park",
    name: "North Park",
    zips: ["92104"],
    intro:
      "Trash can valet for North Park homes. The evening before your trash day, we roll your trash, recycling and green waste cans out. After the truck comes, we bring them back.",
    localHeading: "Trash day in North Park",
    local: [
      "North Park is full of older bungalows, duplexes and homes with a unit out back, and on many blocks the cans go out to the alley. With several households sharing cans, it's easy for nobody to take them out.",
      "We learn where your cans live and where they go once, then do it the same way every week, so the alley stays clear and pickup doesn't get missed.",
    ],
    neighborhoods: ["North Park", "Burlingame", "Morley Field area", "30th Street area"],
    whoUsesIt: [
      "Landlords with duplexes or a back unit",
      "Homeowners on alley pickup",
      "Busy families",
      "Older residents who'd rather not move heavy trash cans",
    ],
    faqs: [
      {
        q: "Our property has two units that share cans. Can you handle that?",
        a: "Yes. Sign up the address, set the number of cans, and add a note about the setup.",
      },
      {
        q: "My cans go out to the alley. Is that OK?",
        a: "Yes. Add a note about where your cans live and where they go for pickup when you sign up.",
      },
    ],
    strHeavy: false,
    photo: { position: "50% 45%" },
  },
  {
    slug: "coronado",
    name: "Coronado",
    zips: ["92118"],
    intro:
      "Trash can valet for Coronado homes. We take your trash, recycling and green waste cans to the curb the evening before pickup and bring them back after collection.",
    localHeading: "Trash day in Coronado",
    local: [
      "Many Coronado homes are second homes or belong to owners who travel, so nobody is around on trash day. Weekly service keeps cans going out and coming back on schedule.",
      "In the Village, lots are close together and many cans go out to the alley. Tell us where yours live and where they go, and we'll do it the same way every week.",
    ],
    neighborhoods: ["Coronado Village", "Coronado Shores", "Coronado Cays", "Country Club area"],
    whoUsesIt: [
      "Owners of second homes",
      "Frequent travelers",
      "Older residents and their families",
      "Busy families",
    ],
    faqs: [
      {
        q: "Do you serve all of Coronado?",
        a: "Yes. We serve the 92118 ZIP code, from the Village to the Cays.",
      },
      {
        q: "I'm only in Coronado part of the year. Does that work?",
        a: "Yes. Service runs whether you're home or not. Text us if you want to pause for a stretch.",
      },
    ],
    strHeavy: false,
    photo: { position: "50% 50%" },
  },
];

export const cityBySlug = (slug: string) => cityPages.find((c) => c.slug === slug);
