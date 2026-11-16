// Who collects home trash in each city page's area, where residents look up their own
// pickup day, and the general collection rules. Days differ street by street, so pages never
// list a day: they link to the official lookup. Only add a rule that an official city or
// hauler page states, and record where it came from in the comment next to it.
// Naming the city's hauler is fine; never name competitors (other trash can valet services).

export type CollectionRules = {
  carts?: string; // which carts and how often, and whether they're collected the same day
  setOut?: string; // earliest / latest time carts go out
  bringIn?: string; // when carts must come back in
  placement?: string; // where carts go at the curb
  holidays?: string; // how holidays shift pickup
};

export type TrashCollector = {
  // Who does the pickup, as residents know it.
  name: string;
  // One sentence on who runs residential service.
  who: string;
  lookupUrl: string;
  lookupLabel: string;
  // Extra line shown under the link, if any.
  note?: string;
  // The hauler's collection-day map, saved at public/residential/trash-maps/<file>. Pickup days
  // can change, so pages show it as a guide and still point people to the lookup.
  map?: { src: string; width: number; height: number };
  rules: CollectionRules;
};

// Source: sandiego.gov/environmental-services/collection/general and /collection/schedule (checked 2026-11-15;
// cart, hours and 2026 holiday text confirmed by Adil 2026-11-15).
const sanDiego: TrashCollector = {
  name: "The City of San Diego",
  who: "Most single-family homes here are served by the City of San Diego's Environmental Services Department.",
  lookupUrl: "https://getitdone.sandiego.gov/CollectionMapLookup",
  lookupLabel: "City of San Diego collection schedule lookup",
  note: "If your address isn't in the city's lookup (common for condos and private streets), your home is served by a private hauler. Check with your HOA or property manager. City Environmental Services: 858-694-7000.",
  rules: {
    carts:
      "Gray trash and green organics carts are collected every week, and light blue recycling every other week on the same day as your trash, between 6 a.m. and 5:30 p.m. Bag loose trash. Don't put organics or recycling in plastic bags, even ones labeled compostable.",
    setOut: "Carts must be at the curb or alley by 6 a.m. on collection day.",
    bringIn: "Carts must be brought back in by 6 p.m. the same day, and stored out of view from the street.",
    placement: "Wheels against the curb and handles facing your home, about 3 feet from other carts, parked cars, poles, trees and mailboxes.",
    holidays:
      "No pickup on New Year's Day, Memorial Day, Labor Day, Thanksgiving or Christmas. Starting on the holiday, pickup is one day later for the rest of that week, so a Friday pickup moves to Saturday.",
  },
};

// Sources: EDCO service-schedules page for each city, and EDCO's "Proper Cart Placement"
// set-out graphic (edcostage.wpengine.com/wp-content/uploads/2022/06/Set-out-Instructions.jpg),
// confirmed by Adil 2026-11-15. EDCO publishes no bring-in time.
// Same rule for every EDCO city (Adil confirmed 2026-11-15). EDCO's page contradicts itself on
// Sunday holidays (one line says no delay, the example says Sunday delays), so pages don't say.
const edcoHolidays =
  "No pickup on New Year's Day, Memorial Day, Independence Day, Labor Day, Thanksgiving or Christmas. If your day falls on or after the holiday, it moves one day later that week, so Friday pickup moves to Saturday. Days before the holiday don't change, and a holiday on a Saturday doesn't delay pickup. On other holidays, like MLK Day, Presidents' Day, Cesar Chavez Day and Veterans Day, set your carts out as usual.";

const edcoRules: CollectionRules = {
  carts: "Trash and recycling are typically collected on the same day.",
  setOut: "Carts must be out by 6 a.m. on your service day at the latest.",
  placement:
    "On the street with wheels against the curb and the lid arrows pointing toward the street. Keep carts at least 2 feet from each other and from parked cars, trees, poles and mailboxes, and out of bike lanes.",
  holidays: edcoHolidays,
};

const edco = (
  city: string,
  sub: string,
  rules: CollectionRules = {},
  map?: TrashCollector["map"],
): TrashCollector => ({
  name: "EDCO",
  who: `Home trash, recycling and organics in ${city} are collected by EDCO, the city's contracted hauler.`,
  lookupUrl: `https://${sub}.edcodisposal.com/service-schedules/`,
  lookupLabel: `EDCO ${city} collection day lookup`,
  ...(map && { map }),
  rules: { ...edcoRules, ...rules },
});

// Maps from EDCO and the City of Del Mar, sent by Adil 2026-11-15.
const encinitas = edco("Encinitas", "encinitas", {}, { src: "/residential/trash-maps/encinitas.jpg", width: 1049, height: 774 });

export const trashCollectors: Record<string, TrashCollector> = {
  // Sources: wm.com/us/local/ca/oceanside/residential (checked 2026-11-15) and WM of North
  // County's holiday schedule and set-out rules, confirmed by Adil 2026-11-15.
  oceanside: {
    name: "Waste Management",
    who: "The City of Oceanside contracts with WM for home trash, recycling and organics collection.",
    lookupUrl: "https://www.wm.com/us/en/location/ca/oceanside/trash-pickup-oceanside-ca", // link set by Adil 2026-11-15
    lookupLabel: "WM Oceanside trash pickup page",
    note: "WM customer service: (760) 439-2824.",
    rules: {
      carts: "Trash and recycling are picked up every week, and trash, recycling and organics all go out on the same day.", // confirmed by Adil 2026-11-15
      setOut: "Carts must be at the street by 6 a.m. on your service day at the latest.",
      bringIn: "Carts must be off the street by 11 p.m. that day.",
      placement: "Wheels against the curb, with at least 2 feet between carts and 2 feet from parked cars, mailboxes and other obstacles. Keep carts out from under trees.",
      holidays:
        "WM observes New Year's Day, Memorial Day, Independence Day, Labor Day, Thanksgiving and Christmas. When one falls on a weekday, pickup for the rest of that week is one day later: after a Thursday holiday, Thursday pickup moves to Friday and Friday pickup moves to Saturday. Holidays on a Saturday or Sunday don't delay pickup.",
    },
  },
  // Sources: republicservices.com/municipality/carlsbad-ca (checked 2026-11-15) and Republic's
  // Carlsbad Residential Service Guide (holiday page, set-out rules), confirmed by Adil 2026-11-15.
  carlsbad: {
    name: "Republic Services",
    who: "Home trash, recycling and organics in Carlsbad are collected by Republic Services, the city's contracted hauler.",
    lookupUrl: "https://www.republicservices.com/schedule", // Republic's schedule lookup for all locations, set by Adil 2026-11-15
    lookupLabel: "Republic Services pickup schedule lookup",
    note: "Enter your address to see your pickup days. Republic Services Carlsbad: (760) 332-6464.",
    map: { src: "/residential/trash-maps/carlsbad.jpg", width: 1347, height: 1026 }, // sent by Adil 2026-11-16
    rules: {
      carts: "Trash and recycling are typically collected on the same day.",
      setOut: "Carts must be out by 6 a.m. on your service day at the latest.",
      placement: "Keep carts at least 1 foot apart from each other and 2 feet from other objects like parked cars, poles and mailboxes.",
      holidays:
        "No pickup on New Year's Day, Thanksgiving or Christmas. When one falls on a weekday, pickup is one day later for the rest of that week. Holidays on a weekend don't delay pickup. Other holidays don't change your day.",
    },
  },
  encinitas,
  "cardiff-by-the-sea": { ...encinitas, who: "Cardiff-by-the-Sea is part of Encinitas, so home trash, recycling and organics are collected by EDCO, the city's contracted hauler." },
  // Source: solana-beach.edcodisposal.com organic-recycling page (checked 2026-11-15).
  "solana-beach": edco("Solana Beach", "solana-beach", {
    carts: "Trash and recycling are typically collected on the same day. Each home also gets a green 95-gallon organics cart, collected every week on your service day.",
  }),
  "del-mar": edco("Del Mar", "del-mar", {}, { src: "/residential/trash-maps/del-mar.jpg", width: 1053, height: 736 }),
  coronado: edco("Coronado", "coronado", {}, { src: "/residential/trash-maps/coronado.jpg", width: 700, height: 357 }),
  // San Marcos and Vista added 2026-11-15; Adil confirmed EDCO serves both.
  "san-marcos": edco("San Marcos", "san-marcos", {}, { src: "/residential/trash-maps/san-marcos.jpg", width: 700, height: 506 }),
  vista: edco("Vista", "city-of-vista", {}, { src: "/residential/trash-maps/vista.jpg", width: 1400, height: 1074 }),
  "mission-beach": sanDiego,
  "pacific-beach": sanDiego,
  "la-jolla": sanDiego,
  "ocean-beach": sanDiego,
  "point-loma": sanDiego,
  "hillcrest-uptown": sanDiego,
  "north-park": sanDiego,
};

// Order the rules show in on city pages. Holidays first (Adil, 2026-11-16).
export const ruleLabels: [keyof CollectionRules, string][] = [
  ["holidays", "Holiday weeks"],
  ["carts", "Carts"],
  ["setOut", "Setting carts out"],
  ["bringIn", "Bringing carts in"],
  ["placement", "Where carts go"],
];
