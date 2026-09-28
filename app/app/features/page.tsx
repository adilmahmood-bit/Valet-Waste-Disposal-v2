import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "App Features | Valet Waste Disposal",
  description:
    "Every feature in the Valet Waste Disposal attendant, resident, and property manager apps, in plain text.",
  robots: { index: true, follow: true },
};

// Plain, server-rendered text so crawlers and AI tools can read the whole
// feature set without clicking through the interactive demo.
const SECTIONS: { title: string; path: string; intro: string; features: [string, string][] }[] = [
  {
    title: "Attendant App",
    path: "/app/porter",
    intro: "Used by the porter on the route each night. Works on any phone browser.",
    features: [
      ["Clock in / clock out", "Starts the shift and records the time for timesheets."],
      ["Geofenced property check-in", "Attendant checks in when within range of the property; check-out marks the night complete."],
      ["Route by building and floor", "Every door on the property, grouped by building and floor, with live progress (doors done / total)."],
      ["QR code door verification", "Scan the QR tag at each door to mark it serviced with a timestamp."],
      ["Violation reporting", "Types: not in bin, bag leaking, overflowing bin, boxes not broken down, oversized item, out after cutoff, recycling mixed. Includes a note and photo."],
      ["Resident callback alerts", "Callback requests from residents appear at the top of the route; one tap marks them picked up."],
      ["Finish building", "Marks all remaining doors in a building as serviced."],
      ["Trash pad / compactor proof", "At each trash enclosure, the attendant photographs the pad and compactor and checks off “compactor leveled” and “pad swept.” The photos go to the manager’s photo report and the nightly service report."],
      ["English / Spanish", "The whole attendant app switches between English and Spanish."],
    ],
  },
  {
    title: "Resident App",
    path: "/app/resident",
    intro: "Used by residents of the property.",
    features: [
      ["Live attendant status", "Off duty → En route → On property (with building and arrival time) → Service complete."],
      ["Tonight at your door", "Shows whether the resident's trash was picked up, and when, or why it wasn't collected."],
      ["Violation notices with photo", "Shows the attendant's photo, the reason, and the note."],
      ["Call attendant back", "Unlimited callbacks while the attendant is on the property. Reasons: missed pickup, fixed my violation, got home late, extra bag."],
      ["Alerts & notifications", "All alerts start off. Communication preferences (email / text / push) cover service updates and leasing office announcements. Doorstep push alerts: set-out time begins, collection starts in an hour, attendant arrives, last call, violation at my door, trash picked up, callback completed, service complete."],
      ["Push notification banners", "When an alert the resident turned on happens, a notification appears."],
      ["Leasing office messages", "Announcements sent by the property manager."],
      ["Pickup guidelines", "Set-out window, bag rules, recycling, and how to request a bulk pickup."],
      ["English / Spanish", "The resident app has its own language toggle."],
    ],
  },
  {
    title: "Property Manager Portal",
    path: "/app/manager",
    intro: "Used by leasing offices and regional managers, on a desktop or a phone.",
    features: [
      ["Portfolio dashboard", "Covers all properties. Shows new violations with a trend, a chart of doors checked vs. doors set out per service night (the axis starts at zero), buildings pending, check-ins pending, and open tasks."],
      ["Daily report table", "For each property: status, check-in time, doors checked, buildings serviced, violations, and callbacks. Searchable."],
      ["Live tracking", "The property’s own site map, showing each building’s progress, each trash enclosure’s status, and where the attendant is. Shows tonight’s doors checked, pads and compactors cleared (with photos), when the hallways were clear, violations, and a live activity feed."],
      ["Violations", "Violations by type and by building for the last 30 days, plus tonight's violations with photos."],
      ["Photo report", "Trash pad and compactor checks for each enclosure each night, violation photos, and bulk pickup photos. Filter by type, night, and building. Each photo shows a time stamp and geofence check; violation photos also show the door QR scan."],
      ["Bulk pickup requests", "The manager sends a photo, category, and location. Valet Waste Disposal sends back a quote, and the manager approves or declines it. Progress is tracked through to removal."],
      ["Service reports", "Scheduled nights only (Sunday – Thursday). For each night: doors checked (every door, every night, e.g. 120/120), doors where residents set trash out, when the hallways were clear, pads leveled, violations, callbacks, and recycling in pounds. Shows the average time trash sits in hallways (from 6:00 PM set-out to cleared). The monthly report is emailed automatically to the regional manager and the site manager."],
      ["Messages", "Broadcast to all residents by app and text. Includes a log of resident callbacks."],
      ["Plan & Billing", "Nightly valet plan (Sunday – Thursday) at $12.50 per unit per month. Resident callbacks are included, and approved bulk pickups are added to the invoice. Resident billing: an option to pass the fee through to residents at cost, plus a per-unit CSV export for the resident ledger or billing company. Also shows the payment method and past invoices."],
    ],
  },
  {
    title: "Dispatch (Valet Waste Disposal office)",
    path: "/app/dispatch",
    intro: "Used by our office.",
    features: [
      ["Quote bulk pickups", "Review the manager's photo, then set the price, pickup window, and notes, and send the quote."],
      ["Complete bulk pickups", "Mark approved jobs as removed."],
      ["Callback monitor", "See every resident callback and its status."],
    ],
  },
];

export default function Features() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10" style={{ backgroundColor: "#FAF8F4" }}>
      <p className="text-sm" style={{ color: "#0E9AA7" }}>
        <Link href="/app">← Back to the interactive demo</Link>
      </p>
      <h1 className="font-heading text-3xl mt-2" style={{ color: "#1B4F72" }}>
        Valet Waste Disposal App: Features
      </h1>
      <p className="mt-3 text-gray-700">
        One app with three views: the attendant on the route, the residents at each door, and the property manager&apos;s
        office. The interactive demo at <Link href="/app" className="underline">/app</Link> uses sample data for a
        120-unit property (Center City Apartments: 6 five-story buildings and 4 trash enclosures). Geofence, QR scans, texts, and emailed reports are simulated
        in the demo.
      </p>

      {SECTIONS.map((s) => (
        <section key={s.title} className="mt-10">
          <h2 className="font-heading text-2xl" style={{ color: "#1B4F72" }}>
            {s.title}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {s.intro} Try it: <Link href={s.path} className="underline">{s.path}</Link>
          </p>
          <ul className="mt-4 space-y-3">
            {s.features.map(([name, desc]) => (
              <li key={name}>
                <strong>{name}</strong>: {desc}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
