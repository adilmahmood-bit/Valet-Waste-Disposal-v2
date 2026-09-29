"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  IconLayoutDashboard,
  IconTruckLoading,
  IconAlertTriangle,
  IconChartBar,
  IconSpeakerphone,
  IconCamera,
  IconCheck,
  IconPhoneCall,
  IconMail,
  IconRecycle,
  IconMapPin,
  IconCreditCard,
  IconSearch,
  IconBuildingBank,
  IconFileInvoice,
  IconDownload,
  IconPhoto,
} from "@tabler/icons-react";
import {
  useDemo,
  update,
  uid,
  fmtTime,
  readPhoto,
  progress,
  violations,
  PROPERTY,
  unitsFor,
  DemoState,
  BulkRequest,
  now,
  ALL_UNITS,
  ENCLOSURES,
  serviceNights,
  serviceNightsThisMonth,
} from "@/lib/demo/store";
import { AttendantBanner, Btn, C, Card, LogoMark, PhotoThumb, Pill, ResetButton, StatusDot, Wordmark } from "@/components/demo/ui";
import PhotoReport from "@/components/demo/PhotoReport";
import SiteMap from "@/components/demo/SiteMap";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { id: "live", label: "Live tracking", icon: IconMapPin },
  { id: "violations", label: "Violations", icon: IconAlertTriangle },
  { id: "photos", label: "Photo report", icon: IconPhoto },
  { id: "bulk", label: "Bulk pickup", icon: IconTruckLoading },
  { id: "reports", label: "Service reports", icon: IconChartBar },
  { id: "messages", label: "Messages", icon: IconSpeakerphone },
  { id: "billing", label: "Plan & Billing", icon: IconCreditCard },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function ManagerPortal() {
  const s = useDemo();
  const [tab, setTab] = useState<Tab>("dashboard");
  const pendingQuotes = s.bulk.filter((b) => b.status === "quoted").length;
  const current = TABS.find((t) => t.id === tab)!;

  const badge = (id: Tab) =>
    id === "bulk" && pendingQuotes > 0 ? (
      <span className="ml-auto rounded-full px-1.5 text-[10px] font-bold text-white" style={{ backgroundColor: C.accent }}>
        {pendingQuotes}
      </span>
    ) : null;

  return (
    <div className="min-h-dvh lg:flex" style={{ backgroundColor: "#eef1f4" }}>
      {/* Sidebar (desktop) */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-dvh text-white p-4"
        style={{ background: `linear-gradient(180deg, ${C.navy} 0%, ${C.navyDeep} 100%)` }}
      >
        <Link href="/app" className="flex items-center gap-2 px-2 py-2">
          <LogoMark size={44} />
          <Wordmark small />
        </Link>
        <nav className="mt-6 space-y-1 flex-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition"
              style={tab === t.id ? { backgroundColor: C.teal, fontWeight: 600 } : { opacity: 0.8 }}
            >
              <t.icon size={18} /> {t.label}
              {badge(t.id)}
            </button>
          ))}
        </nav>
        <div className="rounded-xl p-3 text-xs" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          <div className="font-semibold">Need something?</div>
          <div className="opacity-70">Your account rep answers within the hour.</div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 lg:bg-transparent text-white lg:text-inherit" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <div className="lg:hidden" style={{ backgroundColor: C.navy }}>
            <div className="px-4 h-14 flex items-center gap-2">
              <Link href="/app">
                <LogoMark size={36} />
              </Link>
              <Wordmark small />
            </div>
            <nav className="px-2 flex overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap border-b-2"
                  style={{ borderColor: tab === t.id ? C.tealSoft : "transparent", opacity: tab === t.id ? 1 : 0.7 }}
                >
                  <t.icon size={16} /> {t.label}
                  {badge(t.id)}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 lg:p-6 space-y-4">
          <div className="bg-white rounded-2xl border px-4 py-3 flex flex-wrap items-center gap-3" style={{ borderColor: C.border }}>
            <div>
              <div className="font-heading text-xl" style={{ color: C.navy }}>
                {current.label}
              </div>
              <div className="text-xs" style={{ color: C.muted }}>
                {tab === "dashboard" ? `All properties · ${PORTFOLIO.length} sites` : PROPERTY.name}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ backgroundColor: C.accent }}>
                DK
              </span>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Dana K.</div>
                <div className="text-[11px]" style={{ color: C.muted }}>
                  Regional Manager
                </div>
              </div>
            </div>
          </div>

          {tab === "dashboard" && <Dashboard s={s} />}
          {tab === "live" && <Overview s={s} />}
          {tab === "bulk" && <Bulk s={s} />}
          {tab === "violations" && <Violations s={s} />}
          {tab === "photos" && <PhotoReport s={s} />}
          {tab === "reports" && <Reports />}
          {tab === "messages" && <Messages s={s} />}
          {tab === "billing" && <Billing s={s} />}
          <div className="text-center pt-4">
            <ResetButton />
          </div>
        </main>
      </div>
    </div>
  );
}

// ---------- Portfolio dashboard ----------

interface PropRow {
  name: string;
  address: string;
  units: number;
  buildings: number;
  serviced: number;
  bldgServiced: number;
  violations: number;
  callbacks: number;
  status: "Complete" | "In progress" | "Scheduled";
  checkIn?: string;
}

const PORTFOLIO_SEED: PropRow[] = [
  { name: "Harbor View Apartments", address: "1120 Harbor Dr, San Diego", units: 212, buildings: 4, serviced: 212, bldgServiced: 4, violations: 3, callbacks: 2, status: "Complete", checkIn: "6:58 PM" },
  { name: "Mission Hills Lofts", address: "3905 Goldfinch St, San Diego", units: 86, buildings: 2, serviced: 86, bldgServiced: 2, violations: 0, callbacks: 1, status: "Complete", checkIn: "7:02 PM" },
  { name: "Del Mar Terrace", address: "2250 Jimmy Durante Blvd, Del Mar", units: 164, buildings: 3, serviced: 97, bldgServiced: 1, violations: 1, callbacks: 0, status: "In progress", checkIn: "7:31 PM" },
  { name: "Chula Vista Commons", address: "780 Otay Lakes Rd, Chula Vista", units: 240, buildings: 6, serviced: 0, bldgServiced: 0, violations: 0, callbacks: 0, status: "Scheduled" },
];

// Center City Apartments is the live property driven by the demo; the rest are sample data.
function portfolio(s: DemoState): PropRow[] {
  const p = progress(s);
  const bldgDone = PROPERTY.buildings.filter((b) => PROPERTY.floors.flatMap((f) => unitsFor(b, f)).every((u) => s.doors[u] && s.doors[u].status !== "pending")).length;
  const a = s.attendant.status;
  const live: PropRow = {
    name: PROPERTY.name,
    address: PROPERTY.address,
    units: p.total,
    buildings: PROPERTY.buildings.length,
    serviced: p.done,
    bldgServiced: bldgDone,
    violations: violations(s).length,
    callbacks: s.callbacks.length,
    status: a === "done" ? "Complete" : a === "off" ? "Scheduled" : "In progress",
    checkIn: s.attendant.checkIn ? fmtTime(s.attendant.checkIn) : undefined,
  };
  return [live, ...PORTFOLIO_SEED];
}
const PORTFOLIO = [PROPERTY.name, ...PORTFOLIO_SEED.map((p) => p.name)];

// Nightly history for the trend chart (sample data, deterministic).
const PORTFOLIO_DOORS = ALL_UNITS.length + PORTFOLIO_SEED.reduce((n, p) => n + p.units, 0);

function trend(nights: number) {
  let seed = 11;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  return serviceNights(nights)
    .reverse()
    .map((d) => ({
      label: d.toLocaleDateString([], nights <= 7 ? { weekday: "short" } : { month: "numeric", day: "numeric" }),
      full: d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }),
      checked: PORTFOLIO_DOORS,
      setOut: Math.round(PORTFOLIO_DOORS * (0.82 + rnd() * 0.1)),
      violations: Math.floor(rnd() * 7),
    }));
}

function Ring({ value, total, color }: { value: number; total: number; color: string }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const pct = total ? value / total : 0;
  return (
    <svg viewBox="0 0 48 48" className="w-12 h-12 -rotate-90">
      <circle cx="24" cy="24" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
      <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
    </svg>
  );
}

function Dashboard({ s }: { s: DemoState }) {
  const [range, setRange] = useState(7);
  const [q, setQ] = useState("");
  const rows = portfolio(s);
  const data = trend(range);
  const todayViol = rows.reduce((n, r) => n + r.violations, 0);
  const bldgTotal = rows.reduce((n, r) => n + r.buildings, 0);
  const bldgDone = rows.reduce((n, r) => n + r.bldgServiced, 0);
  const checkedIn = rows.filter((r) => r.checkIn).length;
  const openTasks = s.callbacks.filter((c) => c.status === "open").length + s.bulk.filter((b) => b.status === "submitted" || b.status === "quoted" || b.status === "approved").length;
  const totalTasks = s.callbacks.length + s.bulk.filter((b) => b.status !== "declined").length;
  const filtered = rows.filter((r) => (r.name + r.address).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      {/* Filters: one row above everything they scope */}
      <div className="flex flex-wrap gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setRange(d)}
            className="rounded-full px-3 py-1.5 text-sm border font-medium"
            style={range === d ? { backgroundColor: C.navy, color: "#fff", borderColor: C.navy } : { backgroundColor: "#fff", borderColor: C.border }}
          >
            Last {d} service nights
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold" style={{ color: C.muted }}>
                New violations tonight
              </div>
              <div className="font-heading text-4xl mt-1" style={{ color: todayViol ? C.red : C.navy }}>
                {todayViol}
              </div>
            </div>
            <span className="rounded-full p-2" style={{ backgroundColor: "#fee2e2", color: C.red }}>
              <IconAlertTriangle size={18} />
            </span>
          </div>
          <Spark values={data.map((d) => d.violations)} color={C.accent} />
          <div className="text-xs mt-1" style={{ color: C.muted }}>
            {data.reduce((n, d) => n + d.violations, 0)} in the last {range} nights, all with photos
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <TrendChart data={data} />
        </Card>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Buildings pending", v: bldgTotal - bldgDone, done: bldgDone, total: bldgTotal, color: C.teal },
            { label: "Check-in pending", v: rows.length - checkedIn, done: checkedIn, total: rows.length, color: C.accent },
            { label: "Open tasks", v: openTasks, done: totalTasks - openTasks, total: totalTasks, color: C.navy },
          ].map((k) => (
            <Card key={k.label} className="flex items-center justify-between !py-3">
              <div>
                <div className="text-sm font-semibold" style={{ color: C.muted }}>
                  {k.label}
                </div>
                <div className="font-heading text-2xl" style={{ color: C.navy }}>
                  {k.v}
                </div>
              </div>
              <Ring value={k.done} total={k.total} color={k.color} />
            </Card>
          ))}
      </div>

      <Card className="!p-0">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="font-heading text-lg" style={{ color: C.navy }}>
            Daily report · Tonight
          </div>
          <div className="ml-auto relative">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by property…"
              className="rounded-xl border pl-9 pr-3 py-2 text-sm w-56"
              style={{ borderColor: C.border }}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider" style={{ color: C.muted, backgroundColor: "#f8fafc" }}>
                <th className="p-3">#</th>
                <th className="p-3">Property</th>
                <th className="p-3">Status</th>
                <th className="p-3">Check-in</th>
                <th className="p-3">Doors checked</th>
                <th className="p-3">Buildings serviced</th>
                <th className="p-3">Violations</th>
                <th className="p-3">Callbacks</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const pill =
                  r.status === "Complete"
                    ? { color: C.green, bg: "#dcfce7" }
                    : r.status === "In progress"
                      ? { color: C.teal, bg: "#e6f6f7" }
                      : { color: "#4b5563", bg: "#f3f4f6" };
                return (
                  <tr key={r.name} className="border-t" style={{ borderColor: C.border }}>
                    <td className="p-3" style={{ color: C.muted }}>
                      {i + 1}
                    </td>
                    <td className="p-3 min-w-[12rem]">
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-xs" style={{ color: C.muted }}>
                        {r.address}
                      </div>
                    </td>
                    <td className="p-3">
                      <Pill {...pill}>{r.status}</Pill>
                    </td>
                    <td className="p-3 whitespace-nowrap">{r.checkIn ?? "—"}</td>
                    <td className="p-3 whitespace-nowrap">
                      <b>{r.serviced}</b> / {r.units}
                      <div className="h-1.5 w-20 rounded-full bg-gray-100 mt-1">
                        <div className="h-full rounded-full" style={{ width: `${(r.serviced / r.units) * 100}%`, backgroundColor: C.teal }} />
                      </div>
                    </td>
                    <td className="p-3">
                      {r.bldgServiced} / {r.buildings}
                    </td>
                    <td className="p-3" style={{ color: r.violations ? C.red : undefined }}>
                      {r.violations}
                    </td>
                    <td className="p-3">{r.callbacks}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 text-xs border-t" style={{ color: C.muted, borderColor: C.border }}>
          Showing {filtered.length} of {rows.length} properties · {PROPERTY.name} is live, the others are sample data
        </div>
      </Card>
    </>
  );
}

function Spark({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(1, ...values);
  const w = 200;
  const h = 44;
  const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * w, h - 4 - (v / max) * (h - 8)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-11 mt-2" preserveAspectRatio="none" aria-hidden="true">
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={color} opacity="0.12" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// Doors checked is constant (every door, every night), so it's a dashed
// reference line; doors set out is the one data series. Axis starts at zero.
// Violations live in their own card: a 0–6 count doesn't share this scale.
function TrendChart({ data }: { data: ReturnType<typeof trend> }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 560;
  const H = 200;
  const pad = { l: 40, r: 16, t: 16, b: 28 };
  const vals = data.map((d) => d.setOut);
  const lo = 0;
  const hi = Math.ceil((PORTFOLIO_DOORS * 1.08) / 100) * 100;
  const x = (i: number) => pad.l + (i / Math.max(1, data.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const path = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(d.setOut).toFixed(1)}`).join(" ");
  const ticks = [0, Math.round(hi / 2), hi];
  const labelEvery = Math.ceil(data.length / 7);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };
  const h = hover !== null ? data[hover] : null;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="font-heading" style={{ color: C.navy }}>
          Doors per service night
        </div>
        <div className="text-xs" style={{ color: C.muted }}>
          All properties · {data.length} nights
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-xs mt-1" style={{ color: C.muted }}>
        <span className="flex items-center gap-1.5">
          <span className="w-4 border-t-2 border-dashed" style={{ borderColor: C.ink }} /> Checked ({PORTFOLIO_DOORS}, every door)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5" style={{ backgroundColor: C.teal }} /> Trash set out by residents
        </span>
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto touch-none"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label={`All ${PORTFOLIO_DOORS} doors checked each of ${data.length} nights; trash set out at between ${Math.min(...vals)} and ${Math.max(...vals)} doors`}
        >
          <line x1={pad.l} x2={W - pad.r} y1={y(PORTFOLIO_DOORS)} y2={y(PORTFOLIO_DOORS)} stroke={C.ink} strokeOpacity="0.6" strokeWidth="1.5" strokeDasharray="5 4" />
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#e5e7eb" />
              <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill={C.muted}>
                {t}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % labelEvery === 0 || i === data.length - 1 ? (
              <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill={C.muted}>
                {d.label}
              </text>
            ) : null,
          )}
          <path d={`${path} L${x(data.length - 1)} ${H - pad.b} L${x(0)} ${H - pad.b} Z`} fill={C.teal} opacity="0.08" />
          <path d={path} fill="none" stroke={C.teal} strokeWidth="2" strokeLinejoin="round" />
          <circle cx={x(data.length - 1)} cy={y(vals[vals.length - 1])} r="4" fill={C.teal} stroke="#fff" strokeWidth="2" />
          {hover !== null && (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke={C.ink} strokeOpacity="0.25" />
              <circle cx={x(hover)} cy={y(data[hover].setOut)} r="5" fill={C.teal} stroke="#fff" strokeWidth="2" />
            </>
          )}
        </svg>
        {h && hover !== null && (
          <div
            className="absolute pointer-events-none bg-white rounded-lg shadow-lg border px-3 py-2 text-xs"
            style={{ borderColor: C.border, top: 4, left: `${(x(hover) / W) * 100}%`, transform: hover > data.length / 2 ? "translateX(-105%)" : "translateX(8px)" }}
          >
            <div style={{ color: C.muted }}>{h.full}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-3 border-t-2 border-dashed" style={{ borderColor: C.ink }} />
              <b className="text-sm">
                {h.checked}/{h.checked}
              </b>{" "}
              checked
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5" style={{ backgroundColor: C.teal }} />
              <b className="text-sm">{h.setOut}</b> set out
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5" style={{ backgroundColor: C.accent }} />
              <b className="text-sm">{h.violations}</b> violations
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Plan & billing ----------

const RATE = 12.5; // per-unit monthly rate

// Per-unit statement for managers who bill residents (at cost) for valet trash.
function exportUnits(s: DemoState) {
  const month = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const rows = [["Unit", "Building", "Month", "Valet trash fee (at cost)", "Callbacks this month", "Violations tonight"]];
  for (const u of ALL_UNITS)
    rows.push([
      u,
      u[0],
      month,
      RATE.toFixed(2),
      String(s.callbacks.filter((c) => c.unit === u).length),
      s.doors[u]?.status === "violation" ? "1" : "0",
    ]);
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `center-city-apartments-valet-trash-per-unit-${new Date().toISOString().slice(0, 7)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function Billing({ s }: { s: DemoState }) {
  const [passThrough, setPassThrough] = useState(false);
  const units = ALL_UNITS.length;
  const base = units * RATE;
  const bulkLines = s.bulk.filter((b) => b.status === "approved" || b.status === "completed");
  const bulkTotal = bulkLines.reduce((n, b) => n + (b.quote ?? 0), 0);
  const callbacksMonth = 23 + s.callbacks.length;
  const next = new Date();
  next.setMonth(next.getMonth() + 1, 1);
  const invoices = [1, 2, 3, 4].map((m) => {
    const d = new Date();
    d.setMonth(d.getMonth() - m, 1);
    return { id: `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-OPR`, date: d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }), amount: base + [185, 0, 370, 95][m - 1] };
  });
  const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div className="grid lg:grid-cols-3 gap-4 items-start">
      <Card className="lg:col-span-2 space-y-4">
        <div className="flex flex-wrap items-start gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
              Current plan
            </div>
            <div className="font-heading text-2xl" style={{ color: C.navy }}>
              Nightly Valet · 5 nights/week
            </div>
            <div className="text-sm" style={{ color: C.muted }}>
              {PROPERTY.name} · {units} units · Sun – Thu, {PROPERTY.window}
            </div>
          </div>
          <span className="ml-auto">
            <Pill color={C.green} bg="#dcfce7">
              Active
            </Pill>
          </span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            ["Door-to-door pickup", "Every scheduled night"],
            ["Resident callbacks", "Unlimited while on property"],
            ["Recycling", "Included, reported monthly"],
            ["Violation reporting", "Photo + resident notice"],
            ["Manager portal", "Unlimited users"],
            ["Support", "Same-day response"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl p-3" style={{ backgroundColor: C.surface }}>
              <div className="text-sm font-semibold flex items-center gap-1.5">
                <IconCheck size={14} style={{ color: C.teal }} /> {k}
              </div>
              <div className="text-xs" style={{ color: C.muted }}>
                {v}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="font-heading mb-2" style={{ color: C.navy }}>
            This month so far
          </div>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-t" style={{ borderColor: C.border }}>
                <td className="py-2.5">
                  Valet service · {units} units × {money(RATE)}
                </td>
                <td className="py-2.5 text-right font-semibold">{money(base)}</td>
              </tr>
              <tr className="border-t" style={{ borderColor: C.border }}>
                <td className="py-2.5">Resident callbacks · {callbacksMonth} this month</td>
                <td className="py-2.5 text-right" style={{ color: C.green }}>
                  Included
                </td>
              </tr>
              {bulkLines.map((b) => (
                <tr key={b.id} className="border-t" style={{ borderColor: C.border }}>
                  <td className="py-2.5">
                    Bulk pickup · {b.category}
                    <span className="text-xs ml-2" style={{ color: C.muted }}>
                      {b.status === "completed" ? "removed" : `scheduled ${b.scheduledFor}`}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-semibold">{money(b.quote ?? 0)}</td>
                </tr>
              ))}
              <tr className="border-t-2" style={{ borderColor: C.navy }}>
                <td className="py-3 font-heading" style={{ color: C.navy }}>
                  Estimated next invoice · {next.toLocaleDateString([], { month: "short", day: "numeric" })}
                </td>
                <td className="py-3 text-right font-heading text-lg" style={{ color: C.navy }}>
                  {money(base + bulkTotal)}
                </td>
              </tr>
              {passThrough && (
                <>
                  <tr>
                    <td className="py-1.5 text-sm" style={{ color: C.muted }}>
                      Recovered from residents at cost · {units} × {money(RATE)}
                    </td>
                    <td className="py-1.5 text-right text-sm" style={{ color: C.green }}>
                      −{money(base)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-sm font-semibold">Net cost to property</td>
                    <td className="py-1.5 text-right text-sm font-semibold">{money(bulkTotal)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="font-heading" style={{ color: C.navy }}>
              Resident billing
            </div>
            <button
              role="switch"
              aria-checked={passThrough}
              aria-label="Pass valet fee through to residents"
              onClick={() => setPassThrough(!passThrough)}
              className="relative w-12 h-7 rounded-full transition-colors shrink-0"
              style={{ backgroundColor: passThrough ? C.teal : "#d1d5db" }}
            >
              <span className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: passThrough ? 24 : 4 }} />
            </button>
          </div>
          <div className="text-sm">
            Pass the valet fee through to residents <b>at cost</b>: {money(RATE)} per unit per month, the same rate the property pays.
          </div>
          <div className="text-xs" style={{ color: C.muted }}>
            The per-unit export lists each unit&apos;s valet fee for the month, ready for your resident ledger or utility billing
            company. It documents that resident charges match the actual cost of service.
          </div>
          <Btn variant="ghost" className="w-full flex items-center justify-center gap-2" onClick={() => exportUnits(s)}>
            <IconDownload size={16} /> Download per-unit CSV ({units} units)
          </Btn>
        </Card>

        <Card className="space-y-2">
          <div className="font-heading" style={{ color: C.navy }}>
            Payment method
          </div>
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: C.surface }}>
            <IconBuildingBank size={22} style={{ color: C.navy }} />
            <div className="text-sm">
              <div className="font-semibold">ACH bank transfer</div>
              <div className="text-xs" style={{ color: C.muted }}>
                Operating account ending 6021
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Autopay on the 1st</span>
            <Pill color={C.green} bg="#dcfce7">
              On
            </Pill>
          </div>
          <div className="text-xs" style={{ color: C.muted }}>
            Net 15 terms · invoices emailed to accounts payable
          </div>
        </Card>

        <Card>
          <div className="font-heading mb-2" style={{ color: C.navy }}>
            Invoices
          </div>
          <ul className="text-sm">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center gap-2 py-2 border-t first:border-t-0" style={{ borderColor: C.border }}>
                <IconFileInvoice size={18} style={{ color: C.muted }} />
                <span className="flex-1">
                  <span className="font-medium">{inv.date}</span>
                  <span className="block text-xs" style={{ color: C.muted }}>
                    {inv.id}
                  </span>
                </span>
                <span className="font-semibold">{money(inv.amount)}</span>
                <Pill color={C.green} bg="#dcfce7">
                  Paid
                </Pill>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, color = C.navy }: { label: string; value: React.ReactNode; sub?: string; color?: string }) {
  return (
    <Card>
      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
        {label}
      </div>
      <div className="font-heading text-3xl mt-1" style={{ color }}>
        {value}
      </div>
      {sub && (
        <div className="text-xs mt-0.5" style={{ color: C.muted }}>
          {sub}
        </div>
      )}
    </Card>
  );
}

function Overview({ s }: { s: DemoState }) {
  const p = progress(s);
  const v = violations(s);
  const cbDone = s.callbacks.filter((c) => c.status === "done").length;
  const pads = Object.values(s.pads);
  const a = s.attendant;
  const setOutAt = new Date(a.checkOut ?? now(s));
  setOutAt.setHours(18, 0, 0, 0);
  const outMin = a.checkOut ? Math.round((a.checkOut - setOutAt.getTime()) / 60000) : 0;
  return (
    <>
      <AttendantBanner a={a} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Doors checked" value={`${p.done}`} sub={`of ${p.total} tonight`} />
        <Stat
          label="Pads & compactors"
          value={`${pads.length}/${ENCLOSURES.length}`}
          sub={pads.length ? `enclosures clear, ${pads.filter((x) => x.leveled).length} leveled · photos in report` : "photo check at each trash enclosure"}
          color={pads.length === ENCLOSURES.length ? C.green : C.navy}
        />
        <Stat
          label="Hallways"
          value={a.status === "done" ? fmtTime(a.checkOut) : a.status === "off" ? "—" : "Clearing"}
          sub={
            a.status === "done"
              ? `all clear · trash out ${Math.floor(outMin / 60)}h ${outMin % 60}m after 6:00 PM set-out`
              : a.status === "off"
                ? "set-out opens 6:00 PM"
                : "trash out since 6:00 PM"
          }
          color={a.status === "done" ? C.green : C.navy}
        />
        <Stat label="Violations" value={v.length} sub={`tonight, with photos · ${cbDone}/${s.callbacks.length} callbacks done`} color={v.length ? C.red : C.navy} />
      </div>
      <div className="grid gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="font-heading" style={{ color: C.navy }}>
              Live property map
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: C.muted }}>
              <StatusDot status={s.attendant.status} /> {s.attendant.name}
            </div>
          </div>
          <SiteMap s={s} />
        </Card>
        <Card>
          <div className="font-heading mb-3" style={{ color: C.navy }}>
            Tonight&apos;s activity
          </div>
          <Activity s={s} />
        </Card>
      </div>
    </>
  );
}

function Activity({ s }: { s: DemoState }) {
  const a = s.attendant;
  const ev: { t: number; text: string; color: string }[] = [];
  if (a.clockIn) ev.push({ t: a.clockIn, text: `${a.name} clocked in`, color: C.muted });
  if (a.checkIn) ev.push({ t: a.checkIn, text: `Checked in on property (geofence verified)`, color: C.green });
  if (a.checkOut) ev.push({ t: a.checkOut, text: `Service complete, checked out`, color: C.navy });
  for (const v of violations(s)) ev.push({ t: v.at ?? 0, text: `Violation at ${v.unit}: ${v.violation}`, color: C.red });
  for (const c of s.callbacks) {
    ev.push({ t: c.createdAt, text: `${c.unit} requested a callback`, color: C.accent });
    if (c.doneAt) ev.push({ t: c.doneAt, text: `Callback picked up at ${c.unit}`, color: C.green });
  }
  for (const [b, p] of Object.entries(s.pads))
    ev.push({ t: p.at, text: `Enclosure ${b} pad clear${p.leveled ? " · compactor leveled" : ""} (photo)`, color: C.green });
  for (const b of s.bulk.filter((x) => x.status !== "completed")) ev.push({ t: b.createdAt, text: `Bulk pickup requested: ${b.category}`, color: C.navy });
  ev.sort((x, y) => y.t - x.t);
  if (!ev.length) return <div className="text-sm" style={{ color: C.muted }}>Waiting for tonight&apos;s shift to start.</div>;
  return (
    <ul className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
      {ev.slice(0, 14).map((e, i) => (
        <li key={i} className="flex gap-2 text-sm">
          <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
          <span className="flex-1">{e.text}</span>
          <span className="text-xs whitespace-nowrap" style={{ color: C.muted }}>
            {fmtTime(e.t)}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ---------- Bulk pickup ----------

const CATEGORIES = ["Move-out / furniture", "Mattress / box spring", "Appliance", "Construction debris", "Other"];

const BULK_STEPS: { key: BulkRequest["status"][]; label: string }[] = [
  { key: ["submitted", "quoted", "approved", "completed"], label: "Photo sent" },
  { key: ["quoted", "approved", "completed"], label: "Quote received" },
  { key: ["approved", "completed"], label: "Approved" },
  { key: ["completed"], label: "Removed" },
];

function Bulk({ s }: { s: DemoState }) {
  const [photo, setPhoto] = useState<string>();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo) return;
    update((st) => ({
      ...st,
      bulk: [
        { id: uid(), createdAt: now(), photo, category, location: location || "Not specified", notes, status: "submitted" },
        ...st.bulk,
      ],
    }));
    setPhoto(undefined);
    setLocation("");
    setNotes("");
  };

  return (
    <div className="grid lg:grid-cols-5 gap-4 items-start">
      <Card className="lg:col-span-2 space-y-3">
        <div className="font-heading text-lg" style={{ color: C.navy }}>
          Request a bulk pickup
        </div>
        <p className="text-sm" style={{ color: C.muted }}>
          Snap a photo of the items. We&apos;ll send back a quote, usually within the hour.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={async (e) => e.target.files?.[0] && setPhoto(await readPhoto(e.target.files[0]))} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 overflow-hidden"
            style={{ borderColor: photo ? C.teal : C.border, color: C.muted }}
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Bulk items" className="w-full h-full object-cover" />
            ) : (
              <>
                <IconCamera size={32} style={{ color: C.teal }} />
                <span className="text-sm font-semibold">Take or upload a photo</span>
              </>
            )}
          </button>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-white" style={{ borderColor: C.border }}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where is it? (e.g. enclosure T3 by Building 6)"
            className="w-full rounded-xl border p-3 text-sm"
            style={{ borderColor: C.border }}
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything we should know? (optional)"
            rows={2}
            className="w-full rounded-xl border p-3 text-sm"
            style={{ borderColor: C.border }}
          />
          <Btn type="submit" className="w-full" disabled={!photo}>
            Send for quote
          </Btn>
        </form>
      </Card>

      <div className="lg:col-span-3 space-y-3">
        {s.bulk.map((b) => (
          <BulkCard key={b.id} b={b} />
        ))}
      </div>
    </div>
  );
}

function BulkCard({ b }: { b: BulkRequest }) {
  const setStatus = (status: BulkRequest["status"]) => update((st) => ({ ...st, bulk: st.bulk.map((x) => (x.id === b.id ? { ...x, status } : x)) }));
  return (
    <Card className="space-y-3">
      <div className="flex gap-3">
        <PhotoThumb src={b.photo} alt={b.category} className="w-20 h-20 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold">{b.category}</div>
          <div className="text-sm text-gray-600 truncate">{b.location}</div>
          {b.notes && <div className="text-xs text-gray-500 truncate">{b.notes}</div>}
          <div className="text-xs mt-1" style={{ color: C.muted }}>
            Requested {new Date(b.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}, {fmtTime(b.createdAt)}
          </div>
        </div>
        {b.status === "declined" && (
          <Pill color="#4b5563" bg="#f3f4f6">
            Declined
          </Pill>
        )}
      </div>

      {b.status !== "declined" && (
        <div className="grid grid-cols-4 gap-1">
          {BULK_STEPS.map((st) => {
            const on = st.key.includes(b.status);
            return (
              <div key={st.label} className="text-center">
                <div className="h-1.5 rounded-full" style={{ backgroundColor: on ? C.teal : "#e5e7eb" }} />
                <div className="text-[10px] mt-1 font-medium" style={{ color: on ? C.navy : C.muted }}>
                  {st.label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {b.status === "submitted" && <div className="text-sm" style={{ color: C.muted }}>Waiting for a quote from Valet Waste Disposal…</div>}

      {b.status === "quoted" && (
        <div className="rounded-xl p-3 flex flex-wrap items-center gap-3" style={{ backgroundColor: "#e6f6f7" }}>
          <div className="flex-1 min-w-[10rem]">
            <div className="font-heading text-2xl" style={{ color: C.navy }}>
              ${b.quote}
            </div>
            <div className="text-xs text-gray-600">
              {b.quoteNote} {b.scheduledFor && `· Pickup ${b.scheduledFor}`}
            </div>
          </div>
          <Btn variant="ghost" className="!py-2" onClick={() => setStatus("declined")}>
            Decline
          </Btn>
          <Btn className="!py-2" onClick={() => setStatus("approved")}>
            Approve quote
          </Btn>
        </div>
      )}

      {b.status === "approved" && (
        <div className="text-sm flex items-center gap-2" style={{ color: C.green }}>
          <IconCheck size={16} /> Approved ${b.quote} · scheduled {b.scheduledFor}
        </div>
      )}
      {b.status === "completed" && (
        <div className="text-sm flex items-center gap-2" style={{ color: C.green }}>
          <IconCheck size={16} /> Removed · ${b.quote} billed to property
        </div>
      )}
    </Card>
  );
}

// ---------- Violations ----------

function Violations({ s }: { s: DemoState }) {
  const tonight = violations(s);
  // 30-day history seed plus tonight
  const byType: Record<string, number> = {
    "Not in bin": 12,
    "Overflowing bin": 8,
    "Boxes not broken down": 10,
    "Bag leaking": 6,
    "Out after cutoff": 9,
    "Oversized item": 4,
    "Recycling mixed": 3,
  };
  tonight.forEach((v) => v.violation && (byType[v.violation] = (byType[v.violation] ?? 0) + 1));
  const max = Math.max(...Object.values(byType));
  const byBldg: Record<string, number> = { "1": 9, "2": 7, "3": 3, "4": 4, "5": 6, "6": 11 };
  return (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <Card>
        <div className="font-heading mb-3" style={{ color: C.navy }}>
          Violations by type · last 30 days
        </div>
        <div className="space-y-2.5">
          {Object.entries(byType)
            .sort((x, y) => y[1] - x[1])
            .map(([k, n]) => (
              <div key={k} className="text-sm">
                <div className="flex justify-between mb-1">
                  <span>{k}</span>
                  <span className="font-semibold">{n}</span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-100">
                  <div className="h-full rounded-full" style={{ width: `${(n / max) * 100}%`, backgroundColor: C.accent }} />
                </div>
              </div>
            ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {Object.entries(byBldg).map(([b, n]) => (
            <div key={b} className="rounded-xl p-3 text-center" style={{ backgroundColor: C.surface }}>
              <div className="font-heading text-xl" style={{ color: C.navy }}>
                {n}
              </div>
              <div className="text-xs" style={{ color: C.muted }}>
                Bldg {b}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="font-heading mb-3" style={{ color: C.navy }}>
          Tonight
        </div>
        {tonight.length === 0 ? (
          <div className="text-sm" style={{ color: C.muted }}>
            No violations reported yet tonight.
          </div>
        ) : (
          <ul className="space-y-3">
            {tonight.map((v) => (
              <li key={v.unit} className="flex gap-3">
                <PhotoThumb src={v.photo} alt={`Violation ${v.unit}`} className="w-16 h-16 shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold">
                    {v.unit} · <span style={{ color: C.red }}>{v.violation}</span>
                  </div>
                  {v.note && <div className="text-gray-600">{v.note}</div>}
                  <div className="text-xs" style={{ color: C.muted }}>
                    {fmtTime(v.at)} · resident notified by text
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ---------- Reports ----------

// Scheduled nights only (Sun – Thu). Every door is checked every night;
// "set out" is how many residents actually put trash out.
function history() {
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  return serviceNights(14).map((d) => {
    const finishMin = 20 * 60 + 2 + Math.floor(rnd() * 20); // 8:02 – 8:21 PM
    const row = {
      date: d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }),
      checked: ALL_UNITS.length,
      setOut: Math.round(ALL_UNITS.length * (0.82 + rnd() * 0.12)),
      violations: Math.floor(rnd() * 4),
      callbacks: Math.floor(rnd() * 3),
      recycling: 280 + Math.floor(rnd() * 60),
      finishMin,
      pads: ENCLOSURES.length,
    };
    // The sample nightly report (public/app/nightly-report.html) is for this
    // night; keep the numbers identical so the two can be compared side by side.
    if (d.getFullYear() === 2026 && d.getMonth() === 8 && d.getDate() === 24)
      Object.assign(row, { setOut: 106, finishMin: 20 * 60 + 10, violations: 4, callbacks: 2, recycling: 310 });
    return row;
  });
}

const clockStr = (min: number) => `${Math.floor(min / 60) - 12}:${String(min % 60).padStart(2, "0")} PM`;
const SET_OUT_START = 18 * 60; // residents set trash out from 6:00 PM

function Reports() {
  const rows = history();
  const recyclingTotal = rows.reduce((n, r) => n + r.recycling, 0);
  const avgFinish = Math.round(rows.reduce((n, r) => n + r.finishMin, 0) / rows.length);
  const outFor = avgFinish - SET_OUT_START;
  const nights = serviceNightsThisMonth();
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Nights serviced" value={`${nights}/${nights}`} sub="scheduled nights this month (Sun – Thu)" color={C.green} />
        <Stat
          label="Hallways clear by"
          value={clockStr(avgFinish).replace(" PM", "")}
          sub={`PM avg · trash out ${Math.floor(outFor / 60)}h ${outFor % 60}m from 6:00 PM set-out`}
        />
        <Stat label="Recycling" value={`${(recyclingTotal / 1000).toFixed(1)}k`} sub="lb diverted, last 14 nights" color={C.teal} />
        <Stat label="Pads & compactors" value={`${rows.length * ENCLOSURES.length}`} sub="photo-verified checks, 14 nights" color={C.navy} />
      </div>
      <Card className="flex flex-wrap items-center gap-3">
        <IconMail size={22} style={{ color: C.teal }} />
        <div className="flex-1 min-w-[12rem]">
          <div className="font-semibold">Monthly service report</div>
          <div className="text-sm" style={{ color: C.muted }}>
            Emailed automatically on the 1st to Dana K. and the site manager. Includes door checks, pad photos, violations, and recycling.
          </div>
        </div>
        <Pill color={C.green} bg="#dcfce7">
          Auto-send on
        </Pill>
      </Card>
      <Card className="!p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider" style={{ color: C.muted }}>
              <th className="p-3">Night</th>
              <th className="p-3">Doors checked</th>
              <th className="p-3">Set out</th>
              <th className="p-3">Hallways clear</th>
              <th className="p-3">Pads</th>
              <th className="p-3">Violations</th>
              <th className="p-3">Callbacks</th>
              <th className="p-3">
                <span className="inline-flex items-center gap-1">
                  <IconRecycle size={14} /> Recycling
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.date} className="border-t" style={{ borderColor: C.border }}>
                <td className="p-3 whitespace-nowrap">{r.date}</td>
                <td className="p-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1" style={{ color: C.green }}>
                    <IconCheck size={14} /> {r.checked}/{r.checked}
                  </span>
                </td>
                <td className="p-3">{r.setOut}</td>
                <td className="p-3 whitespace-nowrap">{clockStr(r.finishMin)}</td>
                <td className="p-3 whitespace-nowrap">
                  {r.pads}/{r.pads} leveled
                </td>
                <td className="p-3">{r.violations}</td>
                <td className="p-3">{r.callbacks}</td>
                <td className="p-3">{r.recycling} lb</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-xs" style={{ color: C.muted }}>
        Every door is checked every scheduled night. &ldquo;Set out&rdquo; counts doors where a resident put trash out. Hallways clear is when the attendant
        checked out with all doors done.
      </p>
    </>
  );
}

// ---------- Messages ----------

function Messages({ s }: { s: DemoState }) {
  const [text, setText] = useState("");
  const send = () => {
    if (!text.trim()) return;
    update((st) => ({ ...st, broadcasts: [...st.broadcasts, { id: uid(), at: now(), text: text.trim() }] }));
    setText("");
  };
  const presets = ["No trash service Thursday for the holiday.", "Reminder: please tie all bags before setting them out.", "Pool area closed Saturday for maintenance."];
  return (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <Card className="space-y-3">
        <div className="font-heading text-lg" style={{ color: C.navy }}>
          Message all residents
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button key={p} onClick={() => setText(p)} className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: C.border }}>
              {p}
            </button>
          ))}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="w-full rounded-xl border p-3 text-sm" style={{ borderColor: C.border }} placeholder="Type a message…" />
        <Btn className="w-full" onClick={send} disabled={!text.trim()}>
          Send to {ALL_UNITS.length} units (app + text)
        </Btn>
      </Card>
      <Card className="space-y-3">
        <div className="font-heading" style={{ color: C.navy }}>
          Sent
        </div>
        {s.broadcasts.length === 0 && <div className="text-sm" style={{ color: C.muted }}>No messages yet.</div>}
        {[...s.broadcasts].reverse().map((b) => (
          <div key={b.id} className="text-sm border-l-4 pl-3" style={{ borderColor: C.teal }}>
            {b.text}
            <div className="text-xs" style={{ color: C.muted }}>
              {fmtTime(b.at)} · delivered to {ALL_UNITS.length} units
            </div>
          </div>
        ))}
        {s.callbacks.length > 0 && (
          <div className="pt-2 border-t" style={{ borderColor: C.border }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: C.muted }}>
              <IconPhoneCall size={14} /> Resident callbacks tonight
            </div>
            {s.callbacks.map((c) => (
              <div key={c.id} className="text-sm flex justify-between py-1">
                <span>
                  {c.unit} · {c.reason}
                </span>
                <span style={{ color: c.status === "done" ? C.green : C.accent }}>{c.status === "done" ? `Done ${fmtTime(c.doneAt)}` : "Open"}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
