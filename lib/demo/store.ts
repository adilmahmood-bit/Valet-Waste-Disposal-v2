"use client";
import { useSyncExternalStore } from "react";

// Demo-only state. Lives in localStorage so every open tab/iframe on this
// device (porter, resident, manager, dispatch) sees the same night unfold.

export type AttendantStatus = "off" | "enroute" | "onsite" | "done";
export type DoorStatus = "pending" | "done" | "violation";
export type ViolationType =
  | "Not in bin"
  | "Bag leaking"
  | "Overflowing bin"
  | "Boxes not broken down"
  | "Oversized item"
  | "Out after cutoff"
  | "Recycling mixed";

export interface Door {
  status: DoorStatus;
  at?: number;
  violation?: ViolationType;
  note?: string;
  photo?: string;
}

export interface Callback {
  id: string;
  unit: string;
  reason: string;
  createdAt: number;
  status: "open" | "done";
  doneAt?: number;
}

export type BulkStatus = "submitted" | "quoted" | "approved" | "declined" | "completed";

export interface BulkRequest {
  id: string;
  createdAt: number;
  location: string;
  category: string;
  notes: string;
  photo?: string;
  status: BulkStatus;
  quote?: number;
  quoteNote?: string;
  scheduledFor?: string;
  completedAt?: number;
}

export interface Broadcast {
  id: string;
  at: number;
  text: string;
}

export type Channel = "email" | "text" | "push";

export const DOORSTEP_ALERTS = [
  { id: "setOut", label: "Set-out time begins" },
  { id: "hourBefore", label: "Collection starts in an hour" },
  { id: "onProperty", label: "Attendant arrives on property" },
  { id: "lastCall", label: "Last call alert" },
  { id: "violation", label: "Violation at my door" },
  { id: "pickedUp", label: "My trash was picked up" },
  { id: "callbackDone", label: "Callback completed" },
  { id: "complete", label: "Service complete for the night" },
] as const;
export type DoorstepAlert = (typeof DOORSTEP_ALERTS)[number]["id"];

export interface AlertPrefs {
  comms: boolean;
  service: Record<Channel, boolean>;
  community: Record<Channel, boolean>;
  doorstep: boolean;
  push: Record<DoorstepAlert, boolean>;
}

export function defaultAlerts(): AlertPrefs {
  return {
    comms: false,
    service: { email: false, text: false, push: false },
    community: { email: false, text: false, push: false },
    doorstep: false,
    push: Object.fromEntries(DOORSTEP_ALERTS.map((a) => [a.id, false])) as Record<DoorstepAlert, boolean>,
  };
}

export interface DemoState {
  attendant: {
    name: string;
    status: AttendantStatus;
    clockIn?: number;
    checkIn?: number;
    checkOut?: number;
    building?: string;
  };
  doors: Record<string, Door>;
  callbacks: Callback[];
  bulk: BulkRequest[];
  broadcasts: Broadcast[];
  alerts: AlertPrefs;
  lang: "en" | "es";
  residentLang: "en" | "es";
  pads: Record<string, Pad>;
  clock: { real: number; demo: number };
}

// Nightly trash pad / compactor check, one per enclosure (keyed by enclosure id).
export interface Pad {
  at: number;
  photo?: string;
  leveled: boolean;
  swept: boolean;
}

// Layout follows the property site map (public/demo/site-map.webp): six
// five-story buildings. `stacks` are the first-floor unit numbers shown on
// the map; floors 2–5 repeat each stack (5101 → 5201 … 5501): 120 units.
export const PROPERTY = {
  name: "Center City Apartments",
  address: "650 N Centre City Pkwy, Escondido, CA 92025",
  window: "7:00 – 9:00 PM",
  buildings: ["1", "2", "3", "4", "5", "6"],
  floors: [1, 2, 3, 4, 5],
  stacks: {
    "1": ["5101", "5105", "5106", "5108", "5109", "5111"],
    "2": ["2103", "2104", "2106", "2108"],
    "3": ["1101", "1104"],
    "4": ["3101", "3104"],
    "5": ["4101", "4104", "4105"],
    "6": ["6103", "6104", "6105", "6106", "6107", "6108", "6109"],
  } as Record<string, string[]>,
};

// Trash enclosures ("T" on the site map). x / y are percentages of the map image.
export const ENCLOSURES = [
  { id: "T1", buildings: ["1"], x: 15.5, y: 9.2 },
  { id: "T2", buildings: ["2"], x: 82.2, y: 21.9 },
  { id: "T3", buildings: ["5", "6"], x: 11.8, y: 51.5 },
  { id: "T4", buildings: ["3", "4"], x: 78.5, y: 73.1 },
];

export const enclosureFor = (building: string) => ENCLOSURES.find((e) => e.buildings.includes(building))!;

// Building label positions on the site map, in percent.
export const BUILDING_POS: Record<string, { x: number; y: number }> = {
  "1": { x: 25.5, y: 30 },
  "2": { x: 65.7, y: 27.8 },
  "3": { x: 70.4, y: 66.5 },
  "4": { x: 57.2, y: 67.3 },
  "5": { x: 39.8, y: 64.3 },
  "6": { x: 20.5, y: 65.8 },
};

export const RESIDENT_UNIT = "5-4105";

export function unitsFor(building: string, floor: number) {
  return PROPERTY.stacks[building].map((n) => `${building}-${n[0]}${floor}${n.slice(2)}`);
}

export const ALL_UNITS = PROPERTY.buildings.flatMap((b) => PROPERTY.floors.flatMap((f) => unitsFor(b, f)));

const KEY = "vwd-demo-v5";

// ---- Demo clock ----
// The demo always plays out on an evening, whatever time it's shown. Demo time
// runs 6x real time, so a 10-minute walkthrough covers an hour of service.
const SPEED = 6;

export function atToday(h: number, m: number, dayOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function initial(): DemoState {
  return {
    attendant: { name: "Marco R.", status: "off" },
    doors: {},
    callbacks: [],
    bulk: [
      {
        id: "bk-seed",
        createdAt: atToday(10, 20, -1),
        location: "Building 6 — breezeway by 6-6109",
        category: "Move-out / furniture",
        notes: "Mattress, wardrobe, fridge, and chairs left after move-out.",
        photo: "/demo/photos/bulk-1.jpg",
        status: "completed",
        quote: 185,
        scheduledFor: "Yesterday",
        completedAt: atToday(13, 5, -1),
      },
    ],
    broadcasts: [],
    alerts: defaultAlerts(),
    lang: "en",
    residentLang: "en",
    pads: {},
    clock: { real: Date.now(), demo: atToday(18, 30) },
  };
}

// Center City Apartments is serviced Sunday – Thursday.
export const SERVICE_DAYS = [0, 1, 2, 3, 4];

/** The last `n` scheduled service nights before tonight, most recent first. */
export function serviceNights(n: number) {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (out.length < n) {
    d.setDate(d.getDate() - 1);
    if (SERVICE_DAYS.includes(d.getDay())) out.push(new Date(d));
  }
  return out;
}

/** Scheduled service nights so far this month, tonight included if it's one. */
export function serviceNightsThisMonth() {
  const d = new Date();
  let n = 0;
  for (let day = 1; day <= d.getDate(); day++) if (SERVICE_DAYS.includes(new Date(d.getFullYear(), d.getMonth(), day).getDay())) n++;
  return n;
}

/** Current demo time (an evening timestamp), capped at 11:30 PM. */
export function now(s: DemoState = state) {
  return Math.min(s.clock.demo + (Date.now() - s.clock.real) * SPEED, atToday(23, 30));
}

/** Clock moved forward by `minutes` of demo time (e.g. finishing a whole building). */
export function advance(s: DemoState, minutes: number) {
  return { real: Date.now(), demo: Math.min(now(s) + minutes * 60000, atToday(23, 0)) };
}

/** Clock that reads at least h:m tonight, e.g. check-in never shows before 6:55 PM. */
export function clockAtLeast(s: DemoState, h: number, m: number) {
  return { real: Date.now(), demo: Math.max(now(s), atToday(h, m)) };
}

let state: DemoState = initial();
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...initial(), ...JSON.parse(raw) };
  } catch {}
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    try {
      state = e.newValue ? { ...initial(), ...JSON.parse(e.newValue) } : initial();
    } catch {
      state = initial();
    }
    listeners.forEach((l) => l());
  });
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded (large photos) — keep going in memory.
  }
  listeners.forEach((l) => l());
}

export function update(fn: (s: DemoState) => DemoState) {
  load();
  state = fn(state);
  save();
}

export function resetDemo() {
  state = initial();
  save();
}

const serverSnapshot = initial();

// True for the placeholder state rendered before localStorage is read.
export const isPlaceholder = (s: DemoState) => s === serverSnapshot;

export function useDemo(): DemoState {
  return useSyncExternalStore(
    (cb) => {
      load();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => {
      load();
      return state;
    },
    () => serverSnapshot,
  );
}

export const uid = () => Math.random().toString(36).slice(2, 9);

export function fmtTime(t?: number) {
  if (!t) return "—";
  return new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Downscale a photo so it fits in localStorage and syncs between tabs quickly.
export function readPhoto(file: File, max = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// Derived helpers
export function progress(s: DemoState) {
  const done = ALL_UNITS.filter((u) => s.doors[u]?.status && s.doors[u].status !== "pending").length;
  return { done, total: ALL_UNITS.length, pct: Math.round((done / ALL_UNITS.length) * 100) };
}

export function violations(s: DemoState) {
  return Object.entries(s.doors)
    .filter(([, d]) => d.status === "violation")
    .map(([unit, d]) => ({ unit, ...d }))
    .sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
}
