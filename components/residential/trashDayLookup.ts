// Data for the "When is trash day in San Diego?" finder (/residential/trash-day). A city, neighborhood
// or ZIP that has one of our city pages goes to that page's trash-day box. Anywhere else in San Diego
// County gets a link to the hauler's (or city's) own lookup. Haulers checked 2026-11-16 against each
// city's trash page; confirm here when a city changes hauler.
import { cityPages } from "./cities";
import { trashCollectors } from "./trashDay";

export type OtherArea = {
  name: string;
  hauler: string;
  url: string;
  linkLabel: string;
  zips: string[];
  aliases?: string[];
  note?: string;
};

const edcoLookup = (sub: string) => `https://${sub}.edcodisposal.com/service-schedules/`;
const sdCity = trashCollectors["pacific-beach"]; // City of San Diego Environmental Services

// City of San Diego neighborhoods without a page of their own. Single-family homes here are served
// by the City (condos and private streets often use a private hauler; the lookup says which).
export const sanDiegoCity: OtherArea = {
  name: "San Diego",
  hauler: "The City of San Diego",
  url: sdCity.lookupUrl,
  linkLabel: "City of San Diego collection lookup",
  note: sdCity.note,
  zips: [
    "92101", "92102", "92105", "92108", "92110", "92111", "92113", "92114", "92115", "92116",
    "92117", "92119", "92120", "92121", "92122", "92123", "92124", "92126", "92127", "92128",
    "92129", "92130", "92131", "92139", "92154", "92173",
  ],
  aliases: [
    "city of san diego", "downtown", "downtown san diego", "little italy", "east village", "golden hill", "south park",
    "barrio logan", "logan heights", "city heights", "kensington", "normal heights", "talmadge", "college area",
    "rolando", "mission valley", "old town", "linda vista", "bay park", "bay ho", "clairemont", "mission bay",
    "kearny mesa", "serra mesa", "tierrasanta", "allied gardens", "del cerro", "san carlos", "university city",
    "utc", "sorrento valley", "mira mesa", "rancho penasquitos", "penasquitos", "rancho bernardo", "scripps ranch",
    "carmel valley", "carmel mountain", "carmel mountain ranch", "sabre springs", "torrey highlands",
    "black mountain ranch", "torrey pines", "encanto", "paradise hills", "skyline", "otay mesa", "san ysidro",
    "nestor", "egger highlands", "mira mesa", "miramar",
  ],
};

export const otherAreas: OtherArea[] = [
  sanDiegoCity,
  { name: "Escondido", hauler: "Escondido Disposal (EDCO)", url: "https://www.escondidodisposal.com/service-schedules/", linkLabel: "Escondido Disposal collection day lookup", zips: ["92025", "92026", "92027", "92029"] },
  { name: "Poway", hauler: "EDCO", url: edcoLookup("poway"), linkLabel: "EDCO Poway collection day lookup", zips: ["92064"] },
  // Republic Services' all-locations schedule lookup (Adil, 2026-11-15).
  { name: "Chula Vista", hauler: "Republic Services", url: "https://www.republicservices.com/schedule", linkLabel: "Republic Services pickup schedule", zips: ["91910", "91911", "91913", "91914", "91915"], aliases: ["eastlake", "otay ranch", "rancho del rey"] },
  { name: "El Cajon", hauler: "EDCO", url: edcoLookup("city-of-el-cajon"), linkLabel: "EDCO El Cajon collection day lookup", zips: ["92019", "92020", "92021"], aliases: ["fletcher hills"] },
  { name: "Imperial Beach", hauler: "EDCO", url: edcoLookup("imperial-beach"), linkLabel: "EDCO Imperial Beach collection day lookup", zips: ["91932"] },
  { name: "La Mesa", hauler: "EDCO", url: edcoLookup("la-mesa-city"), linkLabel: "EDCO La Mesa collection day lookup", zips: ["91941", "91942"] },
  { name: "Lemon Grove", hauler: "EDCO", url: edcoLookup("lemon-grove"), linkLabel: "EDCO Lemon Grove collection day lookup", zips: ["91945"] },
  { name: "National City", hauler: "EDCO", url: edcoLookup("national-city"), linkLabel: "EDCO National City collection day lookup", zips: ["91950"] },
  { name: "Santee", hauler: "Waste Management", url: "https://www.wm.com/us/en/location/ca/santee/trash-pickup-santee-ca", linkLabel: "WM Santee trash pickup page", zips: ["92071"] },
  // Unincorporated county: several haulers by community, listed in the County's guide.
  {
    name: "Unincorporated San Diego County",
    hauler: "a County-authorized hauler",
    url: "https://www.sandiegocounty.gov/content/dam/sdc/dpw/SOLID_WASTE_PLANNING_and_RECYCLING/Haulers%20By%20Area%20Guide_%20June%202025_V2.pdf",
    linkLabel: "County of San Diego haulers by area guide",
    note: "Find your community in the County's guide to see which company collects there, then check that company's site for your day.",
    zips: [
      "91901", "91902", "91905", "91906", "91916", "91917", "91934", "91935", "91948", "91962", "91963", "91977",
      "91978", "91980", "92003", "92004", "92028", "92036", "92040", "92059", "92060", "92061", "92065", "92066",
      "92067", "92070", "92082", "92086", "92091",
    ],
    aliases: [
      "rancho santa fe", "fairbanks ranch", "fallbrook", "bonsall", "valley center", "ramona", "julian", "alpine",
      "lakeside", "spring valley", "bonita", "jamul", "descanso", "pine valley", "campo", "boulevard", "borrego springs",
      "pala", "pauma valley", "dulzura", "potrero", "jacumba", "mount laguna", "warner springs", "santa ysabel",
      "ranchita", "palomar mountain", "harmony grove", "crest", "mount helix", "casa de oro", "rancho san diego",
    ],
  },
];

export const normalizePlace = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Peñasquitos -> penasquitos
    .replace(/&/g, " ")
    .replace(/,?\s*(ca|calif|california)\.?$/, "")
    .replace(/^city of\s+/, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export type TrashDayMatch =
  | { kind: "page"; slug: string; name: string }
  | { kind: "pages"; name: string; pages: { slug: string; name: string }[]; other: OtherArea }
  | { kind: "other"; area: OtherArea; matched: string };

// Neighborhood pages inside the City of San Diego (they use the City's collection lookup).
const sdPages = cityPages.filter((c) => trashCollectors[c.slug]?.lookupUrl === sdCity.lookupUrl);

export function findTrashDay(raw: string): TrashDayMatch | null {
  const q = normalizePlace(raw);
  if (!q) return null;

  const zip = q.match(/\b(9[12]\d{3})\b/)?.[1];
  if (zip) {
    const pages = cityPages.filter((c) => c.zips.includes(zip));
    // Vista's page lists only the ZIPs we serve; its trash rules cover all of Vista.
    if (zip === "92084") return { kind: "page", slug: "vista", name: "Vista" };
    if (pages.length === 1) return { kind: "page", slug: pages[0].slug, name: pages[0].name };
    if (pages.length > 1) {
      // 92109 is Pacific Beach and Mission Beach; 92007 is Cardiff, which is part of Encinitas.
      return pages.some((p) => sdPages.includes(p))
        ? { kind: "pages", name: zip, pages: pages.map(({ slug, name }) => ({ slug, name })), other: sanDiegoCity }
        : { kind: "page", slug: pages[pages.length - 1].slug, name: pages[pages.length - 1].name };
    }
    const area = otherAreas.find((a) => a.zips.includes(zip));
    return area ? { kind: "other", area, matched: zip } : null;
  }

  // "San Diego" on its own: our neighborhood pages plus the City's lookup for everywhere else.
  if (q === "san diego" || q === "sd") {
    return { kind: "pages", name: "San Diego", pages: sdPages.map(({ slug, name }) => ({ slug, name })), other: sanDiegoCity };
  }

  const page =
    cityPages.find((c) => normalizePlace(c.name) === q || normalizePlace(c.slug.replace(/-/g, " ")) === q) ??
    cityPages.find((c) => c.name.split("&").some((part) => normalizePlace(part) === q)) ??
    cityPages.find((c) => c.neighborhoods.some((n) => normalizePlace(n.replace(/\barea\b/, "")) === q));
  if (page) return { kind: "page", slug: page.slug, name: page.name };

  const area = otherAreas.find((a) => normalizePlace(a.name) === q || a.aliases?.includes(q));
  return area ? { kind: "other", area, matched: raw.trim() } : null;
}

// Suggestions for the search box.
export const placeSuggestions = Array.from(
  new Set([
    ...cityPages.map((c) => c.name),
    ...otherAreas.filter((a) => a !== otherAreas[otherAreas.length - 1]).map((a) => a.name),
    "Rancho Santa Fe",
    "Fallbrook",
    "Ramona",
    "Lakeside",
    "Spring Valley",
    "Alpine",
    "Valley Center",
  ]),
).sort();
