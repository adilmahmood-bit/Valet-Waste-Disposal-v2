import type { PortalProperty, PortalVisit } from "@/lib/residential/portal-data";
import { shortDate, timeSD } from "@/lib/residential/portal-data";
import { addDays } from "@/lib/residential/schedule";
import { P } from "./Shell";

export type StatusKey = "scheduled" | "out" | "in" | "issue" | "paused" | "starting" | "quote" | "cancelled";

export const STATUS: Record<StatusKey, { label: string; color: string; bg: string }> = {
  scheduled: { label: "Scheduled", color: P.navy, bg: "#e0eef7" },
  out: { label: "Out at curb", color: P.amber, bg: "#fef3c7" },
  in: { label: "Back in", color: P.green, bg: "#dcfce7" },
  issue: { label: "Needs attention", color: P.red, bg: "#fee2e2" },
  paused: { label: "Paused", color: "#4b5563", bg: "#f3f4f6" },
  starting: { label: "Starting soon", color: P.navy, bg: "#e0eef7" },
  quote: { label: "Waiting on your price", color: P.amber, bg: "#fef3c7" },
  cancelled: { label: "Cancelled", color: "#4b5563", bg: "#f3f4f6" },
};

const bad = (v: PortalVisit | null) => !!v && (v.status === "missed" || v.status === "issue");

// This week's state for a property, from its visits and Routific.
export function statusOf(p: PortalProperty): StatusKey {
  const s = p.address.status;
  if (s === "cancelled") return "cancelled";
  if (s === "quote_needed") return "quote";
  if (s === "signed_up") return "starting";
  if (s === "paused") return "paused";
  const w = p.thisWeek;
  if (w && (bad(w.out) || bad(w.back))) return "issue";
  if (w?.back?.status === "done") return "in";
  if (w?.out?.status === "done") return "out";
  if (p.upcoming[0]?.rolledOut) return "out";
  if (p.upcoming[0]?.paused) return "paused";
  return "scheduled";
}

const dayTime = (iso: string) => `${new Date(iso).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", weekday: "short" })} ${timeSD(iso)}`;

// "Out Sun 5:42 PM → Back in Mon 11:10 AM", or the plan for the next pickup.
export function timelineOf(p: PortalProperty): string {
  const st = statusOf(p);
  const next = p.upcoming.find((u) => !u.paused);
  const w = p.thisWeek;
  if (st === "starting") return next ? `First service: out ${shortDate(addDays(next.pickup, -1))} evening, back in ${shortDate(next.pickup)}` : "We'll confirm your first service day";
  if (st === "quote") return "We'll text you a custom price";
  if (st === "paused") return next ? `Service paused · next pickup ${shortDate(next.pickup)}` : "Service paused";
  if (st === "cancelled") return "Service cancelled";
  if (w?.out?.status === "done" && w.back?.status === "done") return `Out ${dayTime(w.out.completedAt)} → Back in ${dayTime(w.back.completedAt)}`;
  if (w?.out?.status === "done") return `Out ${dayTime(w.out.completedAt)} → back in after pickup ${shortDate(w.pickup)}`;
  if (next) return `Out ${shortDate(addDays(next.pickup, -1))} evening → back in ${shortDate(next.pickup)} after pickup`;
  return "No pickups scheduled";
}

// The newest visit photo: this week's, else the latest one in the history.
export function latestPhotoOf(p: PortalProperty): { url: string; label: string; at: string } | null {
  const visits = [p.thisWeek?.back, p.thisWeek?.out, ...p.history.flatMap((h) => [h.back, h.out])];
  for (const v of visits) if (v?.photoUrl) return { url: v.photoUrl, label: v.type === "out" ? "Cans out" : "Back in", at: v.completedAt };
  return null;
}

export const photoTime = (iso: string) => dayTime(iso);
