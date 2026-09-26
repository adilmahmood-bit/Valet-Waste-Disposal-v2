"use client";
import { useSyncExternalStore } from "react";

// Demo-only state. Lives in localStorage so every open tab/iframe on this
// device (porter, resident, manager, dispatch) sees the same night unfold.

export type AttendantStatus = "off" | "enroute" | "onsite" | "done";
export type DoorStatus = "pending" | "done" | "violation";
export type ViolationType = "Not bagged" | "Bag leaking" | "Oversized item" | "Out after cutoff" | "Recycling mixed";

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
}

export const PROPERTY = {
  name: "Oak Park Residences",
  address: "4410 Oak Park Dr, San Diego, CA",
  window: "7:00 – 9:00 PM",
  buildings: ["A", "B", "C"],
  floors: [1, 2, 3],
  perFloor: 14,
};

export const RESIDENT_UNIT = "B-214";

export function unitsFor(building: string, floor: number) {
  return Array.from({ length: PROPERTY.perFloor }, (_, i) => `${building}-${floor}${String(i + 1).padStart(2, "0")}`);
}

export const ALL_UNITS = PROPERTY.buildings.flatMap((b) => PROPERTY.floors.flatMap((f) => unitsFor(b, f)));

const KEY = "vwd-demo-v1";

function initial(): DemoState {
  return {
    attendant: { name: "Marco R.", status: "off" },
    doors: {},
    callbacks: [],
    bulk: [
      {
        id: "bk-seed",
        createdAt: Date.now() - 1000 * 60 * 60 * 26,
        location: "Building C — breezeway by C-110",
        category: "Move-out / furniture",
        notes: "Couch and two dressers left after move-out.",
        status: "completed",
        quote: 185,
        scheduledFor: "Yesterday",
        completedAt: Date.now() - 1000 * 60 * 60 * 20,
      },
    ],
    broadcasts: [],
    alerts: defaultAlerts(),
    lang: "en",
  };
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
