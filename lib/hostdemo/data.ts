"use client";
import { useSyncExternalStore } from "react";
import { residential, planById, advertisedPrice } from "@/config/residential";

// Host portal preview (/hosts/portal). Sample data only, held in memory: a page refresh
// puts everything back. Nothing here talks to a server or charges a card.

// Prices for the demo, in one place. Monthly and annual follow the live residential plans
// (config/residential.ts) so the demo can't drift from the site.
export const PRICING = {
  monthlyPerProperty: advertisedPrice(planById("weekly")!),
  annualPerPropertyPerMonth: advertisedPrice(planById("annual")!), // founding 50
  overflowFirstBag: 49, // on-demand pickup: first bag
  overflowExtraBag: 20, // each bag after the first
  extraCartPull: 15, // per extra cart, per month, where EDCO is the only hauler
  overflowWeeklyPlan: 90, // per week, up to 2 properties
  foundingBadge: "Founding 50 pricing locked in",
};

export const overflowPrice = (bags: number) => PRICING.overflowFirstBag + Math.max(0, bags - 1) * PRICING.overflowExtraBag;

export const CONTACT_PHONE = residential.contact.phone;

// Curb rules by city, in one place. San Diego is from the City's published rules, checked
// Nov 2026: sandiego.gov/environmental-services/collection/general (6 AM / 6 PM, placement,
// §66.0105, holidays), the STRO Good Neighbor Guidelines and the STRO Host Operating
// Requirements. Encinitas and Solana Beach are from Adil's research (Nov 2026): EDCO holds an
// exclusive franchise in both, so we don't haul overflow there and offer an extra-cart pull.
// Solana Beach publishes no set-out times; its rules follow EDCO's Del Mar guide.
export interface CityRules {
  curbOut: string;
  curbIn: string;
  placement?: string;
  holiday?: string;
  strGuideline?: string;
  codeRef?: string;
  consequence?: string;
  source?: string;
  hauler?: string;
  extraCarts?: string;
  overflowAllowed?: boolean; // false where another hauler has an exclusive franchise
  verified: boolean;
  outBy: number; // minutes after midnight on collection day
  inBy: number; // minutes after midnight on collection day
}

const GENERAL_RULES: CityRules = {
  curbOut: "Cans out the evening before collection",
  curbIn: "Cans in the same day after collection",
  verified: false,
  outBy: 6 * 60,
  inBy: 24 * 60 - 1,
};

export const CITY_RULES: Record<string, CityRules> = {
  "San Diego": {
    source: "City of San Diego",
    curbOut: "Cans out by 6 AM on collection day",
    curbIn: "Cans in by 6 PM on collection day",
    placement: "3 ft spacing, wheels to the curb, handle facing the home",
    holiday: "On City-observed holidays, collection shifts one day later for the rest of the week",
    strGuideline: "Keep cans out of the street except on collection day, and tell guests the trash schedule.",
    codeRef: "SDMC §66.0105",
    consequence: "Hosts who don't meet STRO requirements risk enforcement, up to civil penalties and license revocation.",
    verified: true,
    outBy: 6 * 60,
    inBy: 18 * 60,
  },
  Encinitas: {
    source: "City of Encinitas trash guide; EDCO Encinitas",
    hauler: "EDCO (exclusive franchise)",
    curbOut: "Cans out by 6 AM on service day",
    curbIn: "No set time. Store carts out of public view except on collection days",
    placement: "Wheels to the curb, lid arrows facing the street, 2 ft from carts, cars, trees, poles and mailboxes",
    extraCarts: "Extra gray cart for a nominal fee; extra blue free; up to 2 extra green free",
    overflowAllowed: false,
    verified: true,
    outBy: 6 * 60,
    inBy: 24 * 60 - 1, // same day
  },
  "Solana Beach": {
    source: "City of Solana Beach; rules per EDCO Del Mar guide (same hauler)",
    hauler: "EDCO (exclusive franchise)",
    curbOut: "Cans out by 6 AM on service day, or the night before",
    curbIn: "Cans in the same day (the city publishes no deadline)",
    placement: "2 ft between carts, 3 ft from obstructions, lid arrows facing the street, not in bike lanes",
    holiday: "1-day delay for New Year's, Memorial Day, July 4th, Labor Day, Thanksgiving and Christmas",
    extraCarts: "Extra gray cart for a fee",
    overflowAllowed: false,
    verified: false,
    outBy: 6 * 60,
    inBy: 24 * 60 - 1,
  },
};

export const overflowAllowed = (area: string) => rulesFor(area).overflowAllowed !== false;
export const haulerName = (area: string) => (rulesFor(area).hauler ?? "").split(" (")[0];
export const CITY_RULES_CHECKED = "Nov 2026";

const SAN_DIEGO_AREAS = ["Mission Beach", "Pacific Beach", "La Jolla", "Point Loma", "Ocean Beach", "North Park", "Hillcrest & Uptown"];
export const cityFor = (area: string) => (SAN_DIEGO_AREAS.includes(area) ? "San Diego" : area);
export const rulesFor = (area: string): CityRules => CITY_RULES[cityFor(area)] ?? GENERAL_RULES;

// Assumptions behind the "what trash would have cost you" card.
export const SAVINGS_ASSUMPTIONS = {
  junkRemovalPerVisit: 200, // typical minimum-load junk haul
  onDemandFirstBag: 80, // typical on-demand bag pickup
};

export const REFERRAL = {
  rewardReferrer: "1 month free",
  rewardFriend: "1 month free",
  code: "COASTLINE",
  creditPerMonth: advertisedPrice(planById("annual")!), // one free month, at the annual rate
};
// The real referral short link: /r records the code and lands on /residential.
export const referralLink = () => `yourdoorstepdisposal.com/r?ref=${REFERRAL.code}`;

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
export type Day = (typeof DAYS)[number];
export type Can = "trash" | "recycle" | "green";
export type PlanId = "monthly" | "annual";
export type WeekStatus = "scheduled" | "out" | "collected" | "in" | "issue";

export interface ServiceEvent {
  id: string;
  date: number; // trash day
  outAt: number;
  inAt: number;
  status: "completed" | "issue";
  note?: string;
  collectedAt?: number; // when the city truck came, if it's worth showing
}

export interface Property {
  id: string;
  nickname: string;
  address: string;
  area: string;
  trashDay: Day;
  cans: Can[];
  access: { location: string; code: string; padlock: boolean; notes: string };
  plan: PlanId;
  paused: boolean;
  week: { status: WeekStatus; outAt?: number; inAt?: number };
  history: ServiceEvent[];
  seed: number; // drives the drawn placeholder's look when there's no photo
  photo?: string; // public/hosts/portal/<photo>-out.jpg and -in.jpg
  isNew?: boolean; // added during the demo: service starts next trash day
  extraCarts?: number; // extra hauler carts we pull, billed at PRICING.extraCartPull
}

export interface Overflow {
  id: string;
  propertyId: string;
  option: "ondemand" | "weekly";
  bags: number;
  window: "next" | "24h";
  note: string;
  photo?: string;
  status: "scheduled" | "completed";
  createdAt: number;
  amount: number;
  receipt: string;
}

export interface Invoice {
  id: string;
  date: number;
  lines: { label: string; amount: number }[];
  receipt: string;
}

export interface Teammate {
  id: string;
  name: string;
  phone: string;
}

export const ALERTS = [
  { id: "out", label: "Cans out at the curb" },
  { id: "in", label: "Cans back in" },
  { id: "issues", label: "Issues" },
  { id: "holiday", label: "Holiday schedule changes" },
] as const;
export type AlertId = (typeof ALERTS)[number]["id"];

export type ReferralType = "host" | "neighbor" | "owner";
export interface Referral {
  id: string;
  name: string;
  type: ReferralType;
  status: "started" | "signed" | "invited";
  detail?: string; // e.g. "starts Tue"
  sameRoute?: string; // nickname of the served property on the same street
}

export interface HostState {
  account: { name: string; manager: string };
  properties: Property[];
  overflows: Overflow[];
  invoices: Invoice[];
  card: { brand: string; last4: string };
  alerts: Record<AlertId, { text: boolean; email: boolean }>;
  team: Teammate[];
  referrals: Referral[];
}

// ---------- helpers ----------

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const planPrice = (p: PlanId) => (p === "annual" ? PRICING.annualPerPropertyPerMonth : PRICING.monthlyPerProperty);
// A property's monthly total: its plan plus any extra carts we pull.
export const propertyMonthly = (p: { plan: PlanId; extraCarts?: number }) => planPrice(p.plan) + (p.extraCarts ?? 0) * PRICING.extraCartPull;
export const planLabel = (p: PlanId) => (p === "annual" ? "Annual" : "Monthly");
export const usd = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

export const uid = () => Math.random().toString(36).slice(2, 9);
export const receiptId = () => `#${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

// Monday 00:00 of the current week, local time.
function weekStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // Mon = 0
  return d.getTime() - dow * DAY;
}

// Midnight `n` calendar days after `t`. Calendar math, not 24-hour steps, so times stay
// right across daylight saving changes.
function addDays(t: number, n: number) {
  const d = new Date(t);
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Trash day `day` in the week `weeksAgo` before this one.
export function trashDate(day: Day, weeksAgo = 0) {
  return addDays(weekStart(), DAYS.indexOf(day) - weeksAgo * 7);
}

// `minutes` after midnight on the day `t` falls on, local time.
function at(t: number, minutes: number) {
  const d = new Date(t);
  d.setHours(0, minutes, 0, 0);
  return d.getTime();
}

// Small seeded random so the mock history looks varied but stays the same on every reset.
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

// Cans go out the evening before trash day (4:30–6:30 PM, never later) and come back in on trash day (8 AM–2 PM).
function times(day: number, rnd: () => number) {
  return {
    outAt: at(addDays(day, -1), 16 * 60 + 30 + Math.round(rnd() * 120)),
    inAt: at(day, 8 * 60 + Math.round(rnd() * 360)),
  };
}

export const fmtTime = (t: number) => new Date(t).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
export const fmtDay = (t: number) => new Date(t).toLocaleDateString("en-US", { weekday: "short" });
export const fmtDate = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
export const fmtDayTime = (t: number) => `${fmtDay(t)} ${fmtTime(t)}`;

// The day before a trash day, for "out the night before" copy.
export const dayBefore = (d: Day) => (d === "Mon" ? "Sun" : DAYS[DAYS.indexOf(d) - 1]);

// Trash day suggestion when adding a property. The real schedule comes from the city.
export const AREA_DAYS: Record<string, Day> = {
  "Mission Beach": "Mon",
  "Pacific Beach": "Tue",
  "La Jolla": "Wed",
  "Point Loma": "Thu",
  "Solana Beach": "Mon",
  Encinitas: "Tue",
  "Ocean Beach": "Fri",
  Carlsbad: "Thu",
  "Del Mar": "Wed",
  Oceanside: "Fri",
  "Cardiff-by-the-Sea": "Tue",
  Coronado: "Mon",
  "North Park": "Thu",
  "Hillcrest & Uptown": "Wed",
};

// ---------- seed data ----------

type Seed = Omit<Property, "history" | "week" | "paused"> & { weekStatus: WeekStatus };

const SEED: Seed[] = [
  { id: "p1", nickname: "Mission Beach Bungalow", address: "721 Ensenada Ct", area: "Mission Beach", trashDay: "Mon", cans: ["trash", "recycle"], access: { location: "Side gate", code: "", padlock: false, notes: "Side gate, no code" }, plan: "annual", seed: 1, photo: "mission-beach", weekStatus: "in" },
  { id: "p2", nickname: "PB Surf House", address: "4510 Everts St", area: "Pacific Beach", trashDay: "Tue", cans: ["trash", "recycle"], access: { location: "Side gate", code: "4821", padlock: false, notes: "Gate code 4821" }, plan: "annual", seed: 2, photo: "pb-surf-house", weekStatus: "out" },
  { id: "p3", nickname: "La Jolla Shores Retreat", address: "8300 Paseo del Ocaso", area: "La Jolla", trashDay: "Wed", cans: ["trash", "recycle"], access: { location: "Garage", code: "1199", padlock: false, notes: "Cans in garage, keypad 1199" }, plan: "monthly", seed: 3, photo: "la-jolla-shores", weekStatus: "scheduled" },
  { id: "p4", nickname: "Point Loma View", address: "3150 Talbot St", area: "Point Loma", trashDay: "Thu", cans: ["trash", "recycle"], access: { location: "Behind fence", code: "0730", padlock: true, notes: "Behind fence, padlock 0730" }, plan: "annual", seed: 4, photo: "point-loma-view", weekStatus: "scheduled" },
  { id: "p5", nickname: "Solana Beach Cottage", address: "610 S Sierra Ave", area: "Solana Beach", trashDay: "Mon", cans: ["trash", "recycle"], access: { location: "Side yard", code: "", padlock: false, notes: "Side yard" }, plan: "monthly", seed: 5, photo: "solana-beach-cottage", weekStatus: "in" },
  { id: "p6", nickname: "Encinitas Garden Home", address: "1450 Neptune Ave", area: "Encinitas", trashDay: "Tue", cans: ["trash", "recycle"], access: { location: "Left of driveway", code: "", padlock: false, notes: "Left of driveway" }, plan: "annual", seed: 6, photo: "encinitas-garden", weekStatus: "out" },
];

function buildProperty(s: Seed): Property {
  const rnd = rng(s.seed * 97);
  const history: ServiceEvent[] = [];
  for (let w = 1; w <= 8; w++) {
    let date = trashDate(s.trashDay, w);
    let note: string | undefined;
    let status: ServiceEvent["status"] = "completed";
    // One holiday shift and one issue across the portfolio, so the history looks real.
    if (s.id === "p3" && w === 4) {
      date = addDays(date, 1);
      note = "Collection moved +1 day (holiday week)";
    }
    if (s.id === "p4" && w === 3) {
      status = "issue";
      note = "Recycling can missing at curb on pickup day. Host notified by text.";
    }
    const t = times(date, rnd);
    let collectedAt: number | undefined;
    // The one late return: the city truck came late. (PB Surf House keeps a clean record.)
    if (s.id === "p1" && w === 2) {
      collectedAt = at(date, 17 * 60 + 20);
      t.inAt = at(date, 18 * 60 + 25);
      note = "City truck came late, collected 5:20 PM; cans returned 6:25 PM.";
    }
    history.push({ id: `${s.id}-w${w}`, date, ...t, status, note, collectedAt });
  }
  const today = trashDate(s.trashDay);
  const tw = times(today, rnd);
  const week: Property["week"] =
    s.weekStatus === "in" ? { status: "in", outAt: tw.outAt, inAt: tw.inAt } : s.weekStatus === "out" ? { status: "out", outAt: tw.outAt } : { status: "scheduled" };
  const { weekStatus: _w, ...rest } = s; // eslint-disable-line @typescript-eslint/no-unused-vars
  return { ...rest, paused: false, week, history };
}

function initial(): HostState {
  const properties = SEED.map(buildProperty);
  const monthly = properties.reduce((n, p) => n + planPrice(p.plan), 0);
  const ws = weekStart();
  const overflows: Overflow[] = [
    { id: "o1", propertyId: "p2", option: "ondemand", bags: 3, window: "24h", note: "Big group checkout", status: "completed", createdAt: ws - 9 * DAY, amount: overflowPrice(3), receipt: "#7KD2M" },
    { id: "o2", propertyId: "p1", option: "ondemand", bags: 2, window: "next", note: "", status: "completed", createdAt: ws - 23 * DAY, amount: overflowPrice(2), receipt: "#Q4XN8" },
    { id: "o3", propertyId: "p3", option: "ondemand", bags: 3, window: "24h", note: "Boxes from new furniture", status: "completed", createdAt: ws - 38 * DAY, amount: overflowPrice(3), receipt: "#B9TR3" },
  ];
  // Monthly invoices on the 1st for the last three months.
  const invoices: Invoice[] = [1, 2, 3].map((m) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - m + 1);
    d.setHours(9, 0, 0, 0);
    const lines = [{ label: `Can-to-curb service, ${properties.length} properties`, amount: monthly }];
    const ov = overflows[m - 1];
    if (ov) lines.push({ label: `Overflow pickup, ${properties.find((p) => p.id === ov.propertyId)!.nickname}`, amount: ov.amount });
    return { id: `inv${m}`, date: d.getTime(), lines, receipt: ["#9F3K2", "#2LPW7", "#M8VZ1"][m - 1] };
  });
  return {
    account: { name: "Coastline Stays", manager: "Alex Rivera" },
    properties,
    overflows,
    invoices,
    card: { brand: "Visa", last4: "4242" },
    alerts: { out: { text: true, email: false }, in: { text: true, email: false }, issues: { text: true, email: true }, holiday: { text: false, email: true } },
    team: [{ id: "t1", name: "Maria (cleaner)", phone: "(619) 555-0142" }],
    referrals: [
      { id: "r1", name: "Jamie L.", type: "host", status: "started" },
      { id: "r2", name: "Pat M.", type: "neighbor", status: "signed", detail: "starts Tue", sameRoute: "PB Surf House" },
      { id: "r3", name: "Sam K.", type: "host", status: "invited" },
    ],
  };
}

// ---------- store ----------

let state: HostState | null = null;
const listeners = new Set<() => void>();

export function update(fn: (s: HostState) => HostState) {
  state = fn(state ?? initial());
  listeners.forEach((l) => l());
}

export function resetDemo() {
  state = initial();
  listeners.forEach((l) => l());
}

// Null during server render: the mock data uses the visitor's clock, so it's built in the browser.
export function useHostDemo(): HostState | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => (state ??= initial()),
    () => null,
  );
}

export const invoiceTotal = (i: Invoice) => i.lines.reduce((n, l) => n + l.amount, 0);

// ---------- compliance ----------

export type Compliance = "ok" | "late";

// A service against the city's window: out before the deadline on collection day, back in
// by the cutoff. Holiday shifts are already in the event's date.
export function compliance(area: string, e: { date: number; outAt: number; inAt?: number }): Compliance {
  const r = rulesFor(area);
  const outOk = e.outAt <= at(e.date, r.outBy);
  const inOk = e.inAt === undefined || e.inAt <= at(e.date, r.inBy);
  return outOk && inOk ? "ok" : "late";
}

// Completed services newest first, including this week's once the cans are back in.
export function completedServices(p: Property): ServiceEvent[] {
  const now: ServiceEvent[] =
    p.week.status === "in" && p.week.outAt && p.week.inAt
      ? [{ id: `${p.id}-now`, date: trashDate(p.trashDay), outAt: p.week.outAt, inAt: p.week.inAt, status: "completed" }]
      : [];
  return [...now, ...p.history];
}

// The "this week" badge: this week's service so far, or "scheduled" until there is one.
export function weekCompliance(p: Property): Compliance | "scheduled" {
  if (p.isNew || p.paused || !p.week.outAt) return "scheduled";
  return compliance(p.area, { date: trashDate(p.trashDay), outAt: p.week.outAt, inAt: p.week.inAt });
}

// ---------- savings ----------

// Last 30 days of overflow pickups against a typical junk-removal visit for each.
export function savings(s: HostState) {
  const since = Date.now() - 30 * DAY;
  // Only where we can haul overflow (not where EDCO is the exclusive hauler).
  const recent = s.overflows.filter((o) => {
    const p = s.properties.find((x) => x.id === o.propertyId);
    return o.createdAt >= since && (!p || overflowAllowed(p.area));
  });
  const pickups = recent.length;
  const bags = recent.reduce((n, o) => n + o.bags, 0);
  const withUs = recent.reduce((n, o) => n + o.amount, 0);
  const without = pickups * SAVINGS_ASSUMPTIONS.junkRemovalPerVisit;
  return { pickups, bags, withUs, without, saved: without - withUs, missed: 0, complaints: 1 };
}

export const referralCredits = (s: HostState) => s.referrals.filter((r) => r.status === "started").length;
