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
} from "@/lib/demo/store";
import { AttendantBanner, Btn, C, Card, LogoMark, PhotoThumb, Pill, ResetButton, StatusDot, Wordmark } from "@/components/demo/ui";

const TABS = [
  { id: "overview", label: "Overview", icon: IconLayoutDashboard },
  { id: "bulk", label: "Bulk pickup", icon: IconTruckLoading },
  { id: "violations", label: "Violations", icon: IconAlertTriangle },
  { id: "reports", label: "Reports", icon: IconChartBar },
  { id: "messages", label: "Messages", icon: IconSpeakerphone },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function ManagerPortal() {
  const s = useDemo();
  const [tab, setTab] = useState<Tab>("overview");
  const pendingQuotes = s.bulk.filter((b) => b.status === "quoted").length;

  return (
    <div className="min-h-dvh" style={{ backgroundColor: C.surface }}>
      <header className="text-white sticky top-0 z-20" style={{ backgroundColor: C.navy, paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/demo" className="flex items-center gap-2">
            <LogoMark size={40} />
            <span className="hidden sm:block">
              <Wordmark small />
            </span>
          </Link>
          <div className="ml-auto text-right">
            <div className="font-semibold text-sm">{PROPERTY.name}</div>
            <div className="text-[11px]" style={{ color: C.tealSoft }}>
              Property Manager Portal · Dana K.
            </div>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-2 flex overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition"
              style={{ borderColor: tab === t.id ? C.tealSoft : "transparent", opacity: tab === t.id ? 1 : 0.7 }}
            >
              <t.icon size={16} /> {t.label}
              {t.id === "bulk" && pendingQuotes > 0 && (
                <span className="ml-1 rounded-full px-1.5 text-[10px] font-bold" style={{ backgroundColor: C.accent }}>
                  {pendingQuotes}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-4">
        {tab === "overview" && <Overview s={s} />}
        {tab === "bulk" && <Bulk s={s} />}
        {tab === "violations" && <Violations s={s} />}
        {tab === "reports" && <Reports s={s} />}
        {tab === "messages" && <Messages s={s} />}
        <div className="text-center pt-4">
          <ResetButton />
        </div>
      </main>
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
  return (
    <>
      <AttendantBanner a={s.attendant} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Doors serviced" value={`${p.done}`} sub={`of ${p.total} tonight`} />
        <Stat label="Violations" value={v.length} sub="tonight, with photos" color={v.length ? C.red : C.navy} />
        <Stat label="Callbacks" value={`${cbDone}/${s.callbacks.length}`} sub="resolved tonight" color={C.accent} />
        <Stat label="On-time rate" value="99.4%" sub="last 30 nights" color={C.green} />
      </div>
      <div className="grid lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
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
        <Card className="lg:col-span-2">
          <div className="font-heading mb-3" style={{ color: C.navy }}>
            Tonight&apos;s activity
          </div>
          <Activity s={s} />
        </Card>
      </div>
    </>
  );
}

const BLDG_POS: Record<string, { x: number; y: number }> = { A: { x: 40, y: 40 }, B: { x: 230, y: 40 }, C: { x: 135, y: 170 } };

function SiteMap({ s }: { s: DemoState }) {
  const at = s.attendant.status === "onsite" ? BLDG_POS[s.attendant.building ?? "A"] : null;
  return (
    <svg viewBox="0 0 420 290" className="w-full h-auto rounded-xl" style={{ backgroundColor: "#eef5f1" }}>
      <path d="M0 150 H420" stroke="#d6dbd4" strokeWidth="18" />
      <path d="M200 0 V290" stroke="#d6dbd4" strokeWidth="14" />
      <rect x="330" y="200" width="70" height="70" rx="6" fill="#e5e0d4" />
      <text x="365" y="240" textAnchor="middle" fontSize="10" fill="#7c776d">
        Compactor
      </text>
      {PROPERTY.buildings.map((b) => {
        const { x, y } = BLDG_POS[b];
        const units = PROPERTY.floors.flatMap((f) => unitsFor(b, f));
        const done = units.filter((u) => s.doors[u] && s.doors[u].status !== "pending").length;
        const viol = units.filter((u) => s.doors[u]?.status === "violation").length;
        const pct = done / units.length;
        return (
          <g key={b}>
            <rect x={x} y={y} width="150" height="90" rx="10" fill="#fff" stroke={C.navy} strokeWidth="2" />
            <rect x={x} y={y + 90 - 90 * pct} width="150" height={90 * pct} rx="10" fill={C.teal} opacity="0.25" />
            <text x={x + 75} y={y + 40} textAnchor="middle" fontSize="18" fontWeight="800" fill={C.navy}>
              Bldg {b}
            </text>
            <text x={x + 75} y={y + 60} textAnchor="middle" fontSize="11" fill="#4b5563">
              {done}/{units.length} doors{viol ? ` · ${viol} ⚠` : ""}
            </text>
          </g>
        );
      })}
      {at && (
        <g style={{ transition: "transform 1s ease", transform: `translate(${at.x + 140}px, ${at.y + 10}px)` }}>
          <circle r="16" fill={C.teal} opacity="0.3">
            <animate attributeName="r" values="8;20;8" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle r="8" fill={C.teal} stroke="#fff" strokeWidth="3" />
        </g>
      )}
    </svg>
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
        { id: uid(), createdAt: Date.now(), photo, category, location: location || "Not specified", notes, status: "submitted" },
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
            placeholder="Where is it? (e.g. Bldg A dumpster enclosure)"
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
  const byType: Record<string, number> = { "Not bagged": 14, "Bag leaking": 6, "Oversized item": 9, "Out after cutoff": 11, "Recycling mixed": 5 };
  tonight.forEach((v) => v.violation && (byType[v.violation] = (byType[v.violation] ?? 0) + 1));
  const max = Math.max(...Object.values(byType));
  const byBldg = { A: 17, B: 19, C: 9 };
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

function history() {
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (i + 1));
    const serviced = 118 + Math.floor(rnd() * 8);
    return {
      date: d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }),
      serviced,
      violations: Math.floor(rnd() * 4),
      callbacks: Math.floor(rnd() * 3),
      recycling: 60 + Math.floor(rnd() * 40),
      finished: `8:${String(20 + Math.floor(rnd() * 35)).padStart(2, "0")} PM`,
    };
  });
}

function Reports({ s }: { s: DemoState }) {
  const rows = history();
  const recyclingTotal = rows.reduce((n, r) => n + r.recycling, 0);
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Nights serviced" value="30/30" sub="this month" color={C.green} />
        <Stat label="Avg finish" value="8:41" sub="PM · window ends 9:00" />
        <Stat label="Recycling" value={`${(recyclingTotal / 1000).toFixed(1)}k`} sub="lb diverted, 14 days" color={C.teal} />
        <Stat label="Bulk pickups" value={s.bulk.filter((b) => b.status === "completed" || b.status === "approved").length} sub="this month" color={C.accent} />
      </div>
      <Card className="flex flex-wrap items-center gap-3">
        <IconMail size={22} style={{ color: C.teal }} />
        <div className="flex-1 min-w-[12rem]">
          <div className="font-semibold">Monthly service report</div>
          <div className="text-sm" style={{ color: C.muted }}>
            Emailed automatically on the 1st to Dana K. and the regional manager
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
              <th className="p-3">Doors</th>
              <th className="p-3">Finished</th>
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
                <td className="p-3">{r.serviced}/126</td>
                <td className="p-3 whitespace-nowrap">{r.finished}</td>
                <td className="p-3">{r.violations}</td>
                <td className="p-3">{r.callbacks}</td>
                <td className="p-3">{r.recycling} lb</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

// ---------- Messages ----------

function Messages({ s }: { s: DemoState }) {
  const [text, setText] = useState("");
  const send = () => {
    if (!text.trim()) return;
    update((st) => ({ ...st, broadcasts: [...st.broadcasts, { id: uid(), at: Date.now(), text: text.trim() }] }));
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
          Send to 126 units (app + text)
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
              {fmtTime(b.at)} · delivered to 126 units
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
