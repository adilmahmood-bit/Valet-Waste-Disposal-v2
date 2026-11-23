// Who collects home trash in each city page's area, where residents look up their own
// pickup day, and the general collection rules. Days differ street by street, so pages never
// list a day: they link to the official lookup. Only add a rule that an official city or
// hauler page states, and record where it came from in the comment next to it.
// Naming the city's hauler is fine; never name competitors (other trash can valet services).
// Don't list haulers' or cities' phone numbers (Adil, 2026-11-16).

export type CollectionRules = {
  carts?: string; // which carts and how often, and whether they're collected the same day
  setOut?: string; // earliest / latest time carts go out
  bringIn?: string; // when carts must come back in
  // setOut and bringIn as one sentence, for city pages (Adil, 2026-11-23). Only where there's a
  // bring-in time; the account portal still shows setOut and bringIn separately.
  setOutAndIn?: string;
  placement?: string; // where carts go at the curb
  holidays?: string; // how holidays shift pickup
  bulky?: string; // bulky items and mattresses: whether the hauler picks them up, how, and what it costs
};

// Holidays shown in the holiday table on /residential/trash-day, in calendar order.
export const holidayNames = {
  newYears: "New Year's Day",
  mlk: "Martin Luther King Jr. Day",
  presidents: "Presidents' Day",
  memorial: "Memorial Day",
  independence: "Independence Day",
  labor: "Labor Day",
  veterans: "Veterans Day",
  thanksgiving: "Thanksgiving",
  christmas: "Christmas",
} as const;
export type Holiday = keyof typeof holidayNames;

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
  // Holidays that change pickup (no pickup that day, so the week shifts). Keep in step with rules.holidays.
  holidaysObserved: Holiday[];
  rules: CollectionRules;
  // Official page or flyer for the bulky item rule, linked after it on the city page.
  bulkyLink?: { href: string; label: string };
  // Short version of rules.bulky for the bulky item table on /residential/trash-day. Keep the two in step.
  bulkySummary?: BulkySummary;
};

// One row of the bulky item table: short cells, only what the hauler's page states.
export type BulkySummary = {
  curbside: boolean; // does the hauler pick bulky items up at the curb
  cost: string; // "Free, 3 a year, up to 5 items each", "Extra fee", etc.
  free?: boolean; // highlights the cost cell
  mattresses: string; // "Yes, wrapped in plastic", "Ask EDCO", etc.
};

export const sixHolidays: Holiday[] = ["newYears", "memorial", "independence", "labor", "thanksgiving", "christmas"];

// Source: sandiego.gov/environmental-services/collection/general and /collection/schedule (checked 2026-11-15;
// cart, hours and 2026 holiday text confirmed by Adil 2026-11-15).
const sanDiego: TrashCollector = {
  name: "The City of San Diego",
  who: "Most single-family homes here are served by the City of San Diego's Environmental Services Department.",
  lookupUrl: "https://getitdone.sandiego.gov/CollectionMapLookup",
  lookupLabel: "City of San Diego collection schedule lookup",
  holidaysObserved: ["newYears", "memorial", "labor", "thanksgiving", "christmas"],
  note: "If your address isn't in the city's lookup (common for condos and private streets), your home is served by a private hauler. Check with your HOA or property manager.",
  rules: {
    carts:
      "Gray trash and green organics carts are collected every week, and light blue recycling every other week on the same day as your trash, between 6 a.m. and 5:30 p.m. Bag loose trash. Don't put organics or recycling in plastic bags, even ones labeled compostable.",
    setOut: "Carts must be at the curb or alley by 6 a.m. on collection day.",
    bringIn: "Carts must be brought back in by 6 p.m. the same day, and stored out of view from the street.",
    setOutAndIn:
      "Carts must be at the curb or alley by 6 a.m. on collection day and brought back in by 6 p.m. the same day, then stored out of view from the street.",
    placement: "Wheels against the curb and handles facing your home, about 3 feet from other carts, parked cars, poles, trees and mailboxes.",
    holidays:
      "No pickup on New Year's Day, Memorial Day, Labor Day, Thanksgiving or Christmas. Starting on the holiday, pickup is one day later for the rest of that week, so a Friday pickup moves to Saturday.",
    // Source: sandiego.gov/environmental-services/recycling/residential/mattresses and
    // /recycling/residential/curbside, /collection/general (checked 2026-11-23).
    bulky:
      "The City of San Diego doesn't offer curbside bulky item pickup. Mattresses and box springs can be dropped off free at the Miramar Landfill mattress collection site, weekdays 7 a.m. to 3 p.m. For furniture and appliances, WasteFreeSD.org lists places that take them. Furniture, appliances and anything over 50 pounds can't go in your carts.",
  },
  bulkyLink: {
    href: "https://www.sandiego.gov/environmental-services/recycling/residential/mattresses",
    label: "City of San Diego mattress drop-off",
  },
  bulkySummary: { curbside: false, cost: "No pickup", mattresses: "Free drop-off at Miramar Landfill" },
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
  // Source: <city>.edcodisposal.com/residential-waste-services/curbside-pickup/bulky-item-pickup/
  // (checked 2026-11-23). Encinitas, Solana Beach, San Marcos and Vista all use this wording;
  // Del Mar and Coronado differ and set their own below.
  bulky: "EDCO picks up bulky items for an additional fee. Request a pickup through the contact form on EDCO's website for your city.",
};

const edco = (
  city: string,
  sub: string,
  rules: CollectionRules = {},
  map?: TrashCollector["map"],
  // EDCO's bulky pages don't mention mattresses, so the table says to ask.
  bulkySummary: BulkySummary = { curbside: true, cost: "Extra fee", mattresses: "Ask EDCO" },
): TrashCollector => ({
  name: "EDCO",
  who: `Home trash, recycling and organics in ${city} are collected by EDCO, the city's contracted hauler.`,
  lookupUrl: `https://${sub}.edcodisposal.com/service-schedules/`,
  lookupLabel: `EDCO ${city} collection day lookup`,
  holidaysObserved: sixHolidays,
  ...(map && { map }),
  rules: { ...edcoRules, ...rules },
  // EDCO's site answers 403 to command-line checks; open it in a browser to verify (works, 2026-11-23).
  bulkyLink: {
    href: `https://${sub}.edcodisposal.com/residential-waste-services/curbside-pickup/bulky-item-pickup/`,
    label: `EDCO ${city} bulky item pickup`,
  },
  bulkySummary,
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
    holidaysObserved: sixHolidays,
    rules: {
      carts: "Trash and recycling are picked up every week, and trash, recycling and organics all go out on the same day.", // confirmed by Adil 2026-11-15
      setOut: "Carts must be at the street by 6 a.m. on your service day at the latest.",
      bringIn: "Carts must be off the street by 11 p.m. that day.",
      setOutAndIn: "Carts must be at the street by 6 a.m. on your service day and off the street by 11 p.m. that day.",
      placement: "Wheels against the curb, with at least 2 feet between carts and 2 feet from parked cars, mailboxes and other obstacles. Keep carts out from under trees.",
      holidays:
        "WM observes New Year's Day, Memorial Day, Independence Day, Labor Day, Thanksgiving and Christmas. When one falls on a weekday, pickup for the rest of that week is one day later: after a Thursday holiday, Thursday pickup moves to Friday and Friday pickup moves to Saturday. Holidays on a Saturday or Sunday don't delay pickup.",
      // Source: wm.com Oceanside page ("Bulk Trash Pickup") and wm.com/us/en/home/bulk-trash-pickup (checked 2026-11-23).
      bulky:
        "WM offers bulky item pickup. Schedule it from your My WM account, and WM gives you a price before booking. Mattresses and box springs are accepted but must be wrapped in plastic.",
    },
    bulkyLink: { href: "https://www.wm.com/us/en/home/bulk-trash-pickup", label: "WM bulk trash pickup" },
    bulkySummary: { curbside: true, cost: "Price quoted before booking", mattresses: "Yes, wrapped in plastic" },
  },
  // Sources: republicservices.com/municipality/carlsbad-ca (checked 2026-11-15) and Republic's
  // Carlsbad Residential Service Guide (holiday page, set-out rules), confirmed by Adil 2026-11-15.
  carlsbad: {
    name: "Republic Services",
    who: "Home trash, recycling and organics in Carlsbad are collected by Republic Services, the city's contracted hauler.",
    lookupUrl: "https://www.republicservices.com/schedule", // Republic's schedule lookup for all locations, set by Adil 2026-11-15
    lookupLabel: "Republic Services pickup schedule lookup",
    note: "Enter your address to see your pickup days.",
    holidaysObserved: ["newYears", "thanksgiving", "christmas"],
    map: { src: "/residential/trash-maps/carlsbad.jpg", width: 1347, height: 1026 }, // sent by Adil 2026-11-16
    rules: {
      carts: "Trash and recycling are typically collected on the same day.",
      setOut: "Carts must be out by 6 a.m. on your service day at the latest.",
      placement: "Keep carts at least 1 foot apart from each other and 2 feet from other objects like parked cars, poles and mailboxes.",
      holidays:
        "No pickup on New Year's Day, Thanksgiving or Christmas. When one falls on a weekday, pickup is one day later for the rest of that week. Holidays on a weekend don't delay pickup. Other holidays don't change your day.",
      // Source: Republic's Carlsbad bulky item flyer (linked below, from republicservices.com/municipality/carlsbad-ca).
      // Adil confirmed it's current, 2026-11-23.
      bulky:
        "Each home gets three free bulky item pickups a year from Republic Services, with up to five items each time. Schedule it online from your Republic account. Mattresses and box springs are accepted if they're wrapped in plastic.",
    },
    // Our copy of Republic's flyer (downloaded 2026-11-23 from republicservices.com/municipality/carlsbad-ca,
    // "Bulky Item Collection"). Served from our site so it opens in the browser instead of downloading.
    // Re-download it if Republic updates the flyer.
    bulkyLink: {
      href: "/residential/flyers/carlsbad-bulky-item-pickup.pdf",
      label: "Republic Services Carlsbad bulky item flyer (PDF)",
    },
    bulkySummary: { curbside: true, cost: "Free, 3 a year, up to 5 items each", free: true, mattresses: "Yes, wrapped in plastic" },
  },
  encinitas,
  "cardiff-by-the-sea": { ...encinitas, who: "Cardiff-by-the-Sea is part of Encinitas, so home trash, recycling and organics are collected by EDCO, the city's contracted hauler." },
  // Source: solana-beach.edcodisposal.com organic-recycling page (checked 2026-11-15).
  "solana-beach": edco("Solana Beach", "solana-beach", {
    carts: "Trash and recycling are typically collected on the same day. Each home also gets a green 95-gallon organics cart, collected every week on your service day.",
  }),
  // Bulky: del-mar.edcodisposal.com bulky-item-pickup page (checked 2026-11-23).
  "del-mar": edco(
    "Del Mar",
    "del-mar",
    {
      bulky:
        "Each home gets three free bulky item pickups a year from EDCO, with up to five items each time. Request one through the contact form on EDCO Del Mar's website, and set items out by 6 a.m., usually on your regular collection day.",
    },
    { src: "/residential/trash-maps/del-mar.jpg", width: 1053, height: 736 },
    { curbside: true, cost: "Free, 3 a year, up to 5 items each", free: true, mattresses: "Ask EDCO" },
  ),
  // Bulky: coronado.edcodisposal.com bulky-item-pickup page (checked 2026-11-23). No fee stated.
  coronado: edco(
    "Coronado",
    "coronado",
    {
      bulky:
        "EDCO picks up large household items, including mattresses, sofas and appliances, by special arrangement. Request a pickup through the contact form on EDCO Coronado's website. It doesn't cover construction or remodeling debris.",
    },
    { src: "/residential/trash-maps/coronado.jpg", width: 700, height: 357 },
    { curbside: true, cost: "By arrangement", mattresses: "Yes" },
  ),
  // San Marcos and Vista added 2026-11-15; Adil confirmed EDCO serves both.
  "san-marcos": edco("San Marcos", "san-marcos", {}, { src: "/residential/trash-maps/san-marcos.jpg", width: 700, height: 506 }),
  vista: edco("Vista", "city-of-vista", {}, { src: "/residential/trash-maps/vista.jpg", width: 1400, height: 1074 }),
  // Source: poway.edcodisposal.com/service-schedules (checked 2026-11-20; link sent by Adil). Same
  // EDCO holiday rule. Used for holiday weeks on routes; no Poway city page yet.
  poway: edco("Poway", "poway"),
  "san-diego": sanDiego,
  "mission-beach": sanDiego,
  "pacific-beach": sanDiego,
  "la-jolla": sanDiego,
  "ocean-beach": sanDiego,
  "point-loma": sanDiego,
  "hillcrest-uptown": sanDiego,
  "north-park": sanDiego,
};

// Order the rules show in on city pages. Holidays first (Adil, 2026-11-16), bulky items second (2026-11-23).
export const ruleLabels: [keyof CollectionRules, string][] = [
  ["holidays", "Holiday weeks"],
  ["bulky", "Bulky items and mattresses pickup"],
  ["carts", "Carts"],
  // Shows setOutAndIn where there is one. Bring-in time and "Where carts go" left off city pages (Adil, 2026-11-23).
  ["setOut", "Setting carts out"],
];
