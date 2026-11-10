"use client";
import Link from "next/link";
import { useState } from "react";
import {
  IconHome,
  IconTrashX,
  IconPlus,
  IconCreditCard,
  IconSettings,
  IconChevronLeft,
  IconChevronRight,
  IconMapPin,
  IconLock,
  IconKey,
  IconPencil,
  IconPlayerPause,
  IconPlayerPlay,
  IconTrash,
  IconRecycle,
  IconLeaf,
  IconAlertTriangle,
  IconCalendarEvent,
  IconMinus,
  IconCamera,
  IconMessage,
  IconUserPlus,
  IconPlugConnected,
  IconReceipt,
  IconCircleCheck,
  IconGift,
  IconDots,
  IconFileText,
  IconCopy,
  IconMail,
  IconShare,
  IconChevronDown,
  IconX,
  IconScale,
} from "@tabler/icons-react";
import { Btn, C, Card, LogoMark, Pill } from "@/components/demo/ui";
import { ChargeOnFile, CurbPhoto, Lightbox, Modal, ReceiptLine, SquareCardForm } from "@/components/hostdemo/parts";
import { ProofModal } from "@/components/hostdemo/proof";
import {
  ALERTS,
  AREA_DAYS,
  CITY_RULES_CHECKED,
  CONTACT_PHONE,
  DAYS,
  PRICING,
  REFERRAL,
  SAVINGS_ASSUMPTIONS,
  Can,
  Day,
  HostState,
  Overflow,
  PlanId,
  Property,
  ReferralType,
  cityFor,
  compliance,
  completedServices,
  dayBefore,
  fmtDate,
  fmtDayTime,
  fmtTime,
  invoiceTotal,
  overflowPrice,
  planLabel,
  planPrice,
  referralCredits,
  referralLink,
  rulesFor,
  savings,
  trashDate,
  uid,
  update,
  useHostDemo,
  usd,
  weekCompliance,
} from "@/lib/hostdemo/data";
import { cityPages } from "@/components/residential/cities";

const TABS = [
  { id: "home", label: "Home", icon: IconHome },
  { id: "overflow", label: "Overflow", icon: IconTrashX },
  { id: "add", label: "Add property", icon: IconPlus },
  { id: "refer", label: "Refer & earn", icon: IconGift },
  { id: "billing", label: "Billing", icon: IconCreditCard },
  { id: "settings", label: "Alerts & team", icon: IconSettings },
] as const;
type Tab = (typeof TABS)[number]["id"];

const CAN_META: Record<Can, { label: string; icon: typeof IconTrash; color: string }> = {
  trash: { label: "Trash", icon: IconTrash, color: "#4B5563" },
  recycle: { label: "Recycling", icon: IconRecycle, color: "#1D4ED8" },
  green: { label: "Green waste", icon: IconLeaf, color: "#3F6212" },
};

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  scheduled: { label: "Scheduled", color: C.navy, bg: "#e0eef7" },
  out: { label: "Out at curb", color: C.amber, bg: "#fef3c7" },
  collected: { label: "Collected", color: C.teal, bg: "#dff5f7" },
  in: { label: "Back in", color: C.green, bg: "#dcfce7" },
  issue: { label: "Issue", color: C.red, bg: "#fee2e2" },
  paused: { label: "Paused", color: "#4b5563", bg: "#f3f4f6" },
  new: { label: "Scheduled · starts next trash day", color: C.navy, bg: "#e0eef7" },
};

type Photo = { seed: number; kind: "out" | "in"; cans: Can[]; at: number; photo?: string; title: string };

const statusKey = (p: Property) => (p.paused ? "paused" : p.isNew ? "new" : p.week.status);

// The newest photo for a property: this week's if there is one, else last pickup's.
function latestPhoto(p: Property): Photo | null {
  if (p.week.status === "in" && p.week.inAt) return { seed: p.seed, kind: "in", cans: p.cans, at: p.week.inAt, photo: p.photo, title: p.nickname };
  if (p.week.status === "out" && p.week.outAt) return { seed: p.seed, kind: "out", cans: p.cans, at: p.week.outAt, photo: p.photo, title: p.nickname };
  const last = p.history[0];
  return last ? { seed: p.seed, kind: "in", cans: p.cans, at: last.inAt, photo: p.photo, title: p.nickname } : null;
}

function timeline(p: Property) {
  if (p.isNew) return `First service: out ${dayBefore(p.trashDay)} evening, back in ${p.trashDay}`;
  if (p.paused) return "Service paused";
  if (p.week.status === "in") return `Out ${fmtDayTime(p.week.outAt!)} → Back in ${fmtDayTime(p.week.inAt!)}`;
  if (p.week.status === "out") return `Out ${fmtDayTime(p.week.outAt!)} → back in ${p.trashDay} after pickup`;
  return `Out ${dayBefore(p.trashDay)} evening → back in ${p.trashDay} after pickup`;
}

const openOverflow = (s: HostState, id: string) => s.overflows.find((o) => o.propertyId === id && o.status === "scheduled");

export default function HostPortal() {
  const s = useHostDemo();
  const [tab, setTab] = useState<Tab>("home");
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [overflowFor, setOverflowFor] = useState<string | null>(null);

  const go = (t: Tab) => {
    setTab(t);
    setPropertyId(null);
    if (t !== "overflow") setOverflowFor(null);
    window.scrollTo({ top: 0 });
  };
  const startOverflow = (id: string) => {
    setOverflowFor(id);
    setTab("overflow");
    setPropertyId(null);
    window.scrollTo({ top: 0 });
  };
  const openProperty = (id: string) => {
    setPropertyId(id);
    window.scrollTo({ top: 0 });
  };

  const property = s && propertyId ? s.properties.find((p) => p.id === propertyId) : undefined;
  const title = property ? property.nickname : TABS.find((t) => t.id === tab)!.label;

  return (
    <div className="min-h-dvh" style={{ backgroundColor: "#eef1f4" }}>
      <div className="lg:flex">
        {/* Sidebar (desktop) */}
        <aside
          className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-dvh text-white p-4"
          style={{ background: `linear-gradient(180deg, ${C.navy} 0%, ${C.navyDeep} 100%)` }}
        >
          <Link href="/hosts" className="flex items-center gap-2.5 px-2 py-2">
            <LogoMark size={40} />
            <span className="leading-tight">
              <span className="block font-heading text-[17px]">Doorstep Disposal</span>
              <span className="block text-[11px] uppercase tracking-[0.18em]" style={{ color: C.tealSoft }}>
                Host portal
              </span>
            </span>
          </Link>
          <nav className="mt-6 space-y-1 flex-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition"
                style={tab === t.id && !property ? { backgroundColor: C.teal, fontWeight: 600 } : { opacity: 0.85 }}
              >
                <t.icon size={18} /> {t.label}
              </button>
            ))}
          </nav>
          <div className="rounded-xl p-3 text-xs" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <div className="font-semibold">Locally operated in San Diego</div>
            <div className="opacity-75">Text {CONTACT_PHONE} anytime.</div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 pb-24 lg:pb-8">
          {/* Top bar (phone) */}
          <header className="lg:hidden sticky top-0 z-30 text-white" style={{ backgroundColor: C.navy, paddingTop: "env(safe-area-inset-top, 0px)" }}>
            <div className="px-4 h-14 flex items-center gap-2.5">
              {property ? (
                <button onClick={() => setPropertyId(null)} aria-label="Back" className="-ml-1 p-1">
                  <IconChevronLeft size={24} />
                </button>
              ) : (
                <Link href="/hosts" aria-label="Back to hosts page">
                  <LogoMark size={32} />
                </Link>
              )}
              <div className="min-w-0 flex-1 leading-tight">
                <div className="font-heading text-[15px] truncate">{property ? property.nickname : "Doorstep Disposal"}</div>
                <div className="text-[11px] truncate" style={{ color: C.tealSoft }}>
                  {property ? `${property.address} · ${property.area}` : s?.account.name ?? "Host portal"}
                </div>
              </div>
              <Avatar />
            </div>
          </header>

          <main className="max-w-5xl mx-auto p-4 lg:p-6 space-y-4">
            {/* Title row (desktop) */}
            <div className="hidden lg:flex bg-white rounded-2xl border px-4 py-3 items-center gap-3" style={{ borderColor: C.border }}>
              {property && (
                <button onClick={() => setPropertyId(null)} aria-label="Back" className="p-1 rounded-lg hover:bg-black/5">
                  <IconChevronLeft size={22} />
                </button>
              )}
              <div>
                <div className="font-heading text-xl" style={{ color: C.navy }}>
                  {title}
                </div>
                <div className="text-xs" style={{ color: C.muted }}>
                  {property ? `${property.address} · ${property.area}` : s ? `${s.account.name} · ${s.properties.length} properties` : ""}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Avatar />
                <div className="leading-tight">
                  <div className="text-sm font-semibold">{s?.account.manager}</div>
                  <div className="text-[11px]" style={{ color: C.muted }}>
                    Property manager
                  </div>
                </div>
              </div>
            </div>

            {!s ? (
              <Card className="text-center text-sm py-10" style={{ color: C.muted }}>
                Loading…
              </Card>
            ) : property ? (
              <PropertyDetail s={s} p={property} onOverflow={() => startOverflow(property.id)} />
            ) : tab === "home" ? (
              <Dashboard s={s} onOpen={openProperty} onOverflow={startOverflow} goOverflow={() => go("overflow")} goRefer={() => go("refer")} />
            ) : tab === "overflow" ? (
              <OverflowFlow key={overflowFor ?? "none"} s={s} initial={overflowFor} onHome={() => go("home")} />
            ) : tab === "add" ? (
              <AddProperty s={s} onDone={() => go("home")} />
            ) : tab === "refer" ? (
              <Refer s={s} />
            ) : tab === "billing" ? (
              <Billing s={s} />
            ) : (
              <Settings s={s} />
            )}
          </main>
        </div>
      </div>

      {/* Bottom tabs (phone) */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t grid grid-cols-6"
        style={{ borderColor: C.border, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {TABS.map((t) => {
          const active = tab === t.id && !property;
          return (
            <button key={t.id} onClick={() => go(t.id)} className="flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium" style={{ color: active ? C.teal : C.muted }}>
              <t.icon size={22} stroke={active ? 2.2 : 1.7} />
              {t.id === "add" ? "Add" : t.id === "settings" ? "Alerts" : t.id === "refer" ? "Refer" : t.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function Avatar() {
  return (
    <span className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ backgroundColor: C.accent }}>
      AR
    </span>
  );
}

function CanIcons({ cans, size = 16 }: { cans: Can[]; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {cans.map((c) => {
        const M = CAN_META[c];
        return <M.icon key={c} size={size} style={{ color: M.color }} aria-label={M.label} />;
      })}
    </span>
  );
}

function StatusPill({ p }: { p: Property }) {
  const m = STATUS[statusKey(p)];
  return <Pill color={m.color} bg={m.bg}>{m.label}</Pill>;
}

// ---------- Dashboard ----------

function Dashboard({
  s,
  onOpen,
  onOverflow,
  goOverflow,
  goRefer,
}: {
  s: HostState;
  onOpen: (id: string) => void;
  onOverflow: (id: string) => void;
  goOverflow: () => void;
  goRefer: () => void;
}) {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [proof, setProof] = useState<Property | null>(null);
  const [referBanner, setReferBanner] = useState(true);
  // Compliance of each property's most recent completed service.
  const withService = s.properties.filter((p) => completedServices(p).length > 0);
  const compliant = withService.filter((p) => compliance(p.area, completedServices(p)[0]) === "ok").length;
  const active = s.properties.filter((p) => !p.paused);
  const count = (st: string) => active.filter((p) => !p.isNew && p.week.status === st).length;
  const scheduled = active.filter((p) => p.isNew || p.week.status === "scheduled").length;
  const overflowCount = s.overflows.filter((o) => o.status === "scheduled").length;
  const chips = [
    `${s.properties.length} properties`,
    `${count("out")} out at curb`,
    `${count("in")} back in`,
    `${scheduled} scheduled`,
    `${count("issue")} issues`,
    `${compliant} of ${withService.length} compliant`,
    ...(overflowCount ? [`${overflowCount} overflow scheduled`] : []),
  ];

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl" style={{ color: C.navy }}>
          Hi {s.account.manager.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm sm:text-base">
          {active.length === s.properties.length
            ? `All ${s.properties.length} properties are covered this week.`
            : `${active.length} of ${s.properties.length} properties are covered this week.`}{" "}
          Your cans are handled.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((c) => (
            <span key={c} className="rounded-full bg-white border px-3 py-1 text-xs font-semibold" style={{ borderColor: C.border, color: C.navy }}>
              {c}
            </span>
          ))}
        </div>
      </div>

      <button onClick={goOverflow} className="w-full text-left rounded-2xl p-4 text-white flex items-center gap-3" style={{ background: `linear-gradient(120deg, ${C.teal}, ${C.navy})` }}>
        <IconTrashX size={30} className="shrink-0" />
        <span className="flex-1">
          <span className="block font-semibold">Need extra trash removed?</span>
          <span className="block text-sm opacity-90">Big checkout? We&apos;ll grab the extra bags. From {usd(PRICING.overflowFirstBag)}.</span>
        </span>
        <IconChevronRight size={22} />
      </button>

      {referBanner && (
        <div className="rounded-2xl border bg-white px-4 py-3 flex items-center gap-3" style={{ borderColor: C.border }}>
          <IconGift size={24} className="shrink-0" style={{ color: C.accent }} />
          <button onClick={goRefer} className="flex-1 text-left text-sm">
            <span className="font-semibold">Know another host or a neighbor?</span> Give them a free month, get one free.
          </button>
          <button onClick={() => setReferBanner(false)} aria-label="Dismiss" className="p-1 rounded-lg hover:bg-black/5">
            <IconX size={18} style={{ color: C.muted }} />
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {s.properties.map((p) => {
          const ph = latestPhoto(p);
          const ov = openOverflow(s, p.id);
          return (
            <div key={p.id} className="relative bg-white rounded-2xl border flex flex-col gap-3" style={{ borderColor: C.border }}>
              <div className="px-4 pt-4 flex items-start gap-2">
                <button onClick={() => onOpen(p.id)} className="flex-1 min-w-0 text-left flex items-start gap-1">
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold truncate">{p.nickname}</span>
                    <span className="block text-xs" style={{ color: C.muted }}>
                      {p.area} · Trash day {p.trashDay}
                    </span>
                  </span>
                  <IconChevronRight size={18} style={{ color: C.muted }} />
                </button>
                <button onClick={() => setMenu(menu === p.id ? null : p.id)} aria-label={`More for ${p.nickname}`} className="-mr-1 p-1 rounded-lg hover:bg-black/5">
                  <IconDots size={18} style={{ color: C.muted }} />
                </button>
                {menu === p.id && (
                  <div className="absolute right-3 top-11 z-10 w-64 rounded-xl border bg-white shadow-lg p-1" style={{ borderColor: C.border }}>
                    <button
                      onClick={() => {
                        setMenu(null);
                        setProof(p);
                      }}
                      className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-black/5 flex items-center gap-2"
                    >
                      <IconFileText size={16} style={{ color: C.teal }} />
                      Got a complaint? Download proof
                    </button>
                    <button
                      onClick={() => {
                        setMenu(null);
                        onOverflow(p.id);
                      }}
                      className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-black/5 flex items-center gap-2"
                    >
                      <IconTrashX size={16} style={{ color: C.teal }} />
                      Request overflow pickup
                    </button>
                  </div>
                )}
              </div>
              <div className="px-4 flex flex-wrap gap-1.5">
                <StatusPill p={p} />
                {ov && <Pill color={C.accent} bg="#fdf1ea">Overflow scheduled</Pill>}
              </div>
              <div className="px-4 -mt-1">
                <ComplianceBadge p={p} />
              </div>
              <div className="px-4 text-xs" style={{ color: C.ink }}>
                {timeline(p)}
              </div>
              <div className="px-4 flex items-center gap-3">
                {ph ? (
                  <button onClick={() => setPhoto(ph)} className="w-28 shrink-0 rounded-lg overflow-hidden border" style={{ borderColor: C.border }} aria-label={`Latest photo of ${p.nickname}`}>
                    <CurbPhoto seed={ph.seed} kind={ph.kind} cans={ph.cans} photo={ph.photo} />
                  </button>
                ) : (
                  <div className="w-28 shrink-0 aspect-[8/5] rounded-lg flex items-center justify-center text-[10px] bg-gray-100" style={{ color: C.muted }}>
                    First photo after service
                  </div>
                )}
                <div className="text-[11px] leading-snug" style={{ color: C.muted }}>
                  {ph ? (
                    <>
                      Latest photo
                      <br />
                      {fmtDayTime(ph.at)}
                    </>
                  ) : (
                    "Photos appear after each visit."
                  )}
                </div>
              </div>
              <div className="px-4 pb-4 mt-auto">
                <Btn variant="ghost" className="w-full !py-2.5" onClick={() => onOverflow(p.id)}>
                  Request overflow pickup
                </Btn>
              </div>
            </div>
          );
        })}
      </div>

      <SavingsCard s={s} />

      <CalendarSync />

      {photo && <Lightbox {...photo} onClose={() => setPhoto(null)} />}
      {proof && <ProofModal p={proof} onClose={() => setProof(null)} />}
    </>
  );
}

function ComplianceBadge({ p }: { p: Property }) {
  const c = weekCompliance(p);
  const m =
    c === "ok"
      ? { text: "✅ Compliant this week", color: C.green }
      : c === "late"
        ? { text: "⚠️ Late return this week", color: C.amber }
        : { text: "⏳ Scheduled", color: C.muted };
  return (
    <span className="text-[11px] font-semibold" style={{ color: m.color }}>
      {m.text}
    </span>
  );
}

function SavingsCard({ s }: { s: HostState }) {
  const [open, setOpen] = useState(() => typeof window === "undefined" || window.matchMedia("(min-width: 1024px)").matches);
  const v = savings(s);
  const rows: [React.ReactNode, React.ReactNode][] = [
    [
      <>
        Overflow pickups: {v.pickups} ({v.bags} bags) = <b>{usd(v.withUs)}</b>
      </>,
      <>
        On-demand junk removal: {v.pickups} × ~{usd(SAVINGS_ASSUMPTIONS.junkRemovalPerVisit)} = <b>~{usd(v.without)}</b>
      </>,
    ],
    [
      <>
        Missed trash days: <b>{v.missed}</b>
      </>,
      "Missed trash day → full cans at check-in",
    ],
    [
      <>
        Neighbor or city complaints handled with proof: <b>{v.complaints}</b>
      </>,
      "Potential fine or guest refund",
    ],
  ];
  return (
    <Card className="p-0 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-4 py-3 text-left" aria-expanded={open}>
        <IconScale size={24} className="shrink-0" style={{ color: C.teal }} />
        <span className="flex-1">
          <span className="block font-semibold">What trash would have cost you this month</span>
          {!open && (
            <span className="block text-sm" style={{ color: C.green }}>
              Estimated savings: <b>{usd(v.saved)}</b>
            </span>
          )}
        </span>
        <IconChevronDown size={20} className={`transition ${open ? "rotate-180" : ""}`} style={{ color: C.muted }} />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-x-3 text-[13px] sm:text-sm">
            <div className="font-semibold pb-2" style={{ color: C.teal }}>
              With Doorstep Disposal
            </div>
            <div className="font-semibold pb-2" style={{ color: C.muted }}>
              Without us (typical)
            </div>
            {rows.map(([a, b], i) => (
              <div key={i} className="contents">
                <div className="border-t py-2" style={{ borderColor: C.border }}>
                  {a}
                </div>
                <div className="border-t py-2" style={{ borderColor: C.border, color: C.muted }}>
                  {b}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl px-4 py-3" style={{ backgroundColor: "#ecfdf5" }}>
            <span className="text-sm" style={{ color: C.green }}>
              Estimated savings:
            </span>{" "}
            <span className="font-heading text-2xl" style={{ color: C.green }}>
              {usd(v.saved)}
            </span>{" "}
            <span className="text-sm" style={{ color: C.green }}>
              this month
            </span>
          </div>
          <p className="mt-2 text-[11px]" style={{ color: C.muted }}>
            Estimates based on typical on-demand junk removal pricing (about {usd(SAVINGS_ASSUMPTIONS.onDemandFirstBag)} for the first bag, and {usd(SAVINGS_ASSUMPTIONS.junkRemovalPerVisit)} or more for a minimum load). Your actual costs may vary.
          </p>
        </div>
      )}
    </Card>
  );
}

function CalendarSync() {
  return (
    <Card className="flex items-start gap-3">
      <IconPlugConnected size={26} className="shrink-0" style={{ color: C.teal }} />
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">Connect Airbnb / Vrbo / Hostaway / Guesty</span>
          <Pill color={C.navy} bg="#e0eef7">Coming soon</Pill>
        </div>
        <p className="mt-1 text-sm" style={{ color: C.muted }}>
          Big checkout? We&apos;ll suggest an overflow pickup automatically.
        </p>
      </div>
    </Card>
  );
}

// ---------- Property detail ----------

function PropertyDetail({ s, p, onOverflow }: { s: HostState; p: Property; onOverflow: () => void }) {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [editing, setEditing] = useState(false);
  const [editAccess, setEditAccess] = useState(false);
  const [proof, setProof] = useState(false);
  const ov = openOverflow(s, p.id);

  const rows = [
    ...(p.week.status === "in" && p.week.outAt && p.week.inAt ? [{ id: "now", date: p.week.inAt, outAt: p.week.outAt, inAt: p.week.inAt as number | undefined, status: "completed", note: "This week" }] : []),
    ...(p.week.status === "out" && p.week.outAt ? [{ id: "now", date: trashDate(p.trashDay), outAt: p.week.outAt, inAt: undefined as number | undefined, status: "out", note: "This week · back in after pickup" }] : []),
    ...p.history.map((h) => ({ ...h, inAt: h.inAt as number | undefined })),
  ];

  const togglePause = () => update((st) => ({ ...st, properties: st.properties.map((x) => (x.id === p.id ? { ...x, paused: !x.paused } : x)) }));

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-xl" style={{ color: C.navy }}>
              {p.nickname}
            </h1>
            <div className="text-sm" style={{ color: C.muted }}>
              {p.address} · {p.area}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <StatusPill p={p} />
            {ov && <Pill color={C.accent} bg="#fdf1ea">Overflow scheduled</Pill>}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Fact label="Trash day" value={`${p.trashDay} · out ${dayBefore(p.trashDay)} night`} />
          <Fact label="Cans" value={<CanIcons cans={p.cans} size={20} />} />
          <Fact label="Plan" value={`${planLabel(p.plan)} · ${usd(planPrice(p.plan))}/mo`} />
          <Fact label="This week" value={timeline(p)} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Btn variant="accent" onClick={onOverflow}>
            Request overflow pickup
          </Btn>
          <Btn variant="navy" onClick={() => setProof(true)}>
            📄 Proof of service
          </Btn>
          <Btn variant="ghost" onClick={togglePause}>
            <span className="inline-flex items-center gap-1.5">
              {p.paused ? <IconPlayerPlay size={16} /> : <IconPlayerPause size={16} />}
              {p.paused ? "Resume service" : "Pause service"}
            </span>
          </Btn>
          <Btn variant="ghost" onClick={() => setEditing(true)}>
            <span className="inline-flex items-center gap-1.5">
              <IconPencil size={16} /> Edit property
            </span>
          </Btn>
        </div>
        {p.paused && (
          <p className="mt-3 text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "#f3f4f6", color: "#4b5563" }}>
            Paused, for example while the property is between owners. Tap Resume when you&apos;re ready.
          </p>
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <h2 className="font-semibold flex-1">Access info</h2>
          {!editAccess && (
            <button onClick={() => setEditAccess(true)} className="text-sm font-semibold inline-flex items-center gap-1" style={{ color: C.teal }}>
              <IconPencil size={15} /> Edit
            </button>
          )}
        </div>
        {editAccess ? (
          <AccessForm p={p} onDone={() => setEditAccess(false)} />
        ) : (
          <div className="mt-3 grid sm:grid-cols-3 gap-3 text-sm">
            <Fact
              label={p.access.padlock ? "Padlock code" : "Gate / keypad code"}
              value={
                <span className="inline-flex items-center gap-1.5">
                  {p.access.padlock ? <IconLock size={16} /> : <IconKey size={16} />}
                  {p.access.code || "No code"}
                </span>
              }
            />
            <Fact label="Can location" value={<span className="inline-flex items-center gap-1.5"><IconMapPin size={16} /> {p.access.location || "-"}</span>} />
            <Fact label="Notes" value={p.access.notes || "-"} />
          </div>
        )}
      </Card>

      <CityRulesCard p={p} />

      <Card>
        <h2 className="font-semibold">Service timeline</h2>
        <p className="text-xs mt-0.5" style={{ color: C.muted }}>
          Last 8 weeks, newest first. Tap a photo to see it full size.
        </p>
        {rows.length === 0 ? (
          <p className="mt-4 text-sm" style={{ color: C.muted }}>
            No visits yet. Your first service is the evening before your next trash day.
          </p>
        ) : (
          <ul className="mt-3 divide-y" style={{ borderColor: C.border }}>
            {rows.map((r) => (
              <li key={r.id} className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{fmtDate(r.date)}</div>
                  <div className="text-xs" style={{ color: C.muted }}>
                    Out {fmtDayTime(r.outAt)}
                    {r.inAt ? ` · In ${fmtDayTime(r.inAt)}` : ""}
                  </div>
                  {r.inAt && (
                    <div className="text-[11px] font-semibold" style={{ color: compliance(p.area, { date: r.date, outAt: r.outAt, inAt: r.inAt }) === "ok" ? C.green : C.amber }}>
                      {compliance(p.area, { date: r.date, outAt: r.outAt, inAt: r.inAt }) === "ok" ? "✅ Within city rules" : "⚠️ Late return"}
                    </div>
                  )}
                  {r.note && (
                    <div className="mt-1 text-xs inline-flex items-center gap-1" style={{ color: r.status === "issue" ? C.red : r.id === "now" ? C.teal : C.amber }}>
                      {r.status === "issue" ? <IconAlertTriangle size={13} /> : <IconCalendarEvent size={13} />}
                      {r.note}
                    </div>
                  )}
                </div>
                <PhotoButton label="Out" onClick={() => setPhoto({ seed: p.seed, kind: "out", cans: p.cans, at: r.outAt, photo: p.photo, title: `${p.nickname} · out` })}>
                  <CurbPhoto seed={p.seed} kind="out" cans={p.cans} photo={p.photo} />
                </PhotoButton>
                {r.inAt ? (
                  <PhotoButton label="In" onClick={() => setPhoto({ seed: p.seed, kind: "in", cans: p.cans, at: r.inAt!, photo: p.photo, title: `${p.nickname} · back in` })}>
                    <CurbPhoto seed={p.seed} kind="in" cans={p.cans} photo={p.photo} />
                  </PhotoButton>
                ) : (
                  <div className="w-20 sm:w-24 shrink-0 aspect-[8/5] rounded-lg flex items-center justify-center text-[10px] text-center bg-gray-100" style={{ color: C.muted }}>
                    After pickup
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editing && (
        <Modal title="Edit property" onClose={() => setEditing(false)}>
          <PropertyForm initial={p} submitLabel="Save changes" onSubmit={(v) => {
            update((st) => ({ ...st, properties: st.properties.map((x) => (x.id === p.id ? { ...x, ...v } : x)) }));
            setEditing(false);
          }} />
        </Modal>
      )}
      {photo && <Lightbox {...photo} onClose={() => setPhoto(null)} />}
      {proof && <ProofModal p={p} onClose={() => setProof(false)} />}
    </>
  );
}

function CityRulesCard({ p }: { p: Property }) {
  const r = rulesFor(p.area);
  const city = cityFor(p.area);
  const last4 = completedServices(p).slice(0, 4).reverse();
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-semibold flex-1">City rules · {city}</h2>
        {!r.verified && <Pill color={C.amber} bg="#fef3c7">General guidance, confirm with your city</Pill>}
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        <li>✅ {r.curbOut}</li>
        <li>
          ✅ {r.curbIn}
          {r.codeRef ? ` (${r.codeRef})` : ""}
        </li>
        {r.placement && <li>📏 {r.placement}</li>}
        {r.holiday && <li>📅 {r.holiday}</li>}
        {r.strGuideline && (
          <li>
            🏖️ STR note: {r.strGuideline} {r.consequence}
          </li>
        )}
      </ul>
      {last4.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold mb-1.5" style={{ color: C.muted }}>
            Last {last4.length} weeks
          </div>
          <div className="flex gap-2">
            {last4.map((e) => {
              const ok = compliance(p.area, e) === "ok";
              return (
                <div key={e.id} className="flex-1 rounded-xl border bg-white px-2 py-2 text-center" style={{ borderColor: ok ? C.border : "#fcd34d" }} title={e.note}>
                  <div className="text-lg leading-none">{ok ? "✅" : "⚠️"}</div>
                  <div className="mt-1 text-[10.5px]" style={{ color: C.muted }}>
                    {fmtDate(e.date)}
                  </div>
                </div>
              );
            })}
          </div>
          {last4.some((e) => compliance(p.area, e) !== "ok") && (
            <p className="mt-2 text-xs" style={{ color: C.amber }}>
              {last4.find((e) => compliance(p.area, e) !== "ok")?.note}
            </p>
          )}
        </div>
      )}
      {r.verified && (
        <p className="mt-3 text-[11px]" style={{ color: C.muted }}>
          Source: {r.source}. Verified {CITY_RULES_CHECKED}.
        </p>
      )}
    </Card>
  );
}

function PhotoButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="relative w-20 sm:w-24 shrink-0 rounded-lg overflow-hidden border" style={{ borderColor: C.border }} aria-label={`${label} photo`}>
      {children}
      <span className="absolute left-1 bottom-1 rounded px-1 text-[9px] font-bold text-white" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
        {label}
      </span>
    </button>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider" style={{ color: C.muted }}>
        {label}
      </div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}

const input = "w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0E9AA7]";
const labelCls = "block text-xs font-semibold mb-1";

function AccessForm({ p, onDone }: { p: Property; onDone: () => void }) {
  const [a, setA] = useState(p.access);
  return (
    <form
      className="mt-3 grid sm:grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        update((st) => ({ ...st, properties: st.properties.map((x) => (x.id === p.id ? { ...x, access: a } : x)) }));
        onDone();
      }}
    >
      <AccessFields a={a} setA={setA} />
      <div className="sm:col-span-2 flex gap-2">
        <Btn type="submit">Save access info</Btn>
        <Btn variant="ghost" onClick={onDone}>
          Cancel
        </Btn>
      </div>
    </form>
  );
}

function AccessFields({ a, setA }: { a: Property["access"]; setA: (a: Property["access"]) => void }) {
  return (
    <>
      <div>
        <label className={labelCls}>Where the cans live</label>
        <input className={input} style={{ borderColor: C.border }} value={a.location} placeholder="Side yard, garage…" onChange={(e) => setA({ ...a, location: e.target.value })} />
      </div>
      <div>
        <label className={labelCls}>{a.padlock ? "Padlock code" : "Gate or keypad code"}</label>
        <input className={input} style={{ borderColor: C.border }} value={a.code} placeholder="Optional" onChange={(e) => setA({ ...a, code: e.target.value })} />
      </div>
      <label className="sm:col-span-2 flex items-center gap-2 text-sm">
        <input type="checkbox" className="h-4 w-4 accent-[#0E9AA7]" checked={a.padlock} onChange={(e) => setA({ ...a, padlock: e.target.checked })} />
        Cans are behind a padlock
      </label>
      <div className="sm:col-span-2">
        <label className={labelCls}>Notes for your attendant</label>
        <textarea rows={2} className={input} style={{ borderColor: C.border }} value={a.notes} onChange={(e) => setA({ ...a, notes: e.target.value })} />
      </div>
    </>
  );
}

// ---------- Add / edit property ----------

type PropertyFields = Pick<Property, "address" | "nickname" | "area" | "trashDay" | "cans" | "access" | "plan">;

function PropertyForm({ initial, submitLabel, onSubmit }: { initial?: Property; submitLabel: string; onSubmit: (v: PropertyFields) => void }) {
  const areas = cityPages.map((c) => c.name);
  const [v, setV] = useState<PropertyFields>(
    initial
      ? { address: initial.address, nickname: initial.nickname, area: initial.area, trashDay: initial.trashDay, cans: initial.cans, access: initial.access, plan: initial.plan }
      : { address: "", nickname: "", area: "", trashDay: "Mon", cans: ["trash", "recycle", "green"], access: { location: "", code: "", padlock: false, notes: "" }, plan: "annual" },
  );
  const [daySuggested, setDaySuggested] = useState(false);

  return (
    <form
      className="grid sm:grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(v);
      }}
    >
      <div className="sm:col-span-2">
        <label className={labelCls}>1. Address</label>
        <input required className={input} style={{ borderColor: C.border }} value={v.address} placeholder="123 Beach Ln" onChange={(e) => setV({ ...v, address: e.target.value })} />
      </div>
      <div>
        <label className={labelCls}>Area</label>
        <select
          required
          className={input}
          style={{ borderColor: C.border }}
          value={v.area}
          onChange={(e) => {
            const area = e.target.value;
            const day = AREA_DAYS[area];
            setV({ ...v, area, trashDay: day ?? v.trashDay });
            setDaySuggested(Boolean(day));
          }}
        >
          <option value="">Choose an area</option>
          {areas.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>2. Nickname</label>
        <input required className={input} style={{ borderColor: C.border }} value={v.nickname} placeholder="e.g. Del Mar Hideaway" onChange={(e) => setV({ ...v, nickname: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>3. Trash day</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button
              type="button"
              key={d}
              onClick={() => setV({ ...v, trashDay: d as Day })}
              className="rounded-xl border px-3.5 py-2 text-sm font-semibold"
              style={v.trashDay === d ? { backgroundColor: C.teal, borderColor: C.teal, color: "#fff" } : { borderColor: C.border, backgroundColor: "#fff" }}
            >
              {d}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs" style={{ color: C.muted }}>
          {daySuggested ? `Suggested for ${v.area}. ` : ""}We&apos;ll confirm with the city schedule.
        </p>
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>4. Cans</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CAN_META) as Can[]).map((c) => {
            const M = CAN_META[c];
            const on = v.cans.includes(c);
            return (
              <button
                type="button"
                key={c}
                onClick={() => setV({ ...v, cans: on ? v.cans.filter((x) => x !== c) : (["trash", "recycle", "green"] as Can[]).filter((x) => x === c || v.cans.includes(x)) })}
                className="rounded-xl border px-3 py-2 text-sm inline-flex items-center gap-1.5"
                style={on ? { borderColor: M.color, backgroundColor: "#fff", color: M.color, fontWeight: 600 } : { borderColor: C.border, backgroundColor: "#fff", color: C.muted }}
                aria-pressed={on}
              >
                <M.icon size={16} /> {M.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="sm:col-span-2 text-xs font-semibold -mb-1">5. Access</div>
      <AccessFields a={v.access} setA={(access) => setV({ ...v, access })} />
      <div className="sm:col-span-2">
        <label className={labelCls}>6. Plan</label>
        <div className="grid sm:grid-cols-2 gap-2">
          {(["annual", "monthly"] as PlanId[]).map((pl) => (
            <label key={pl} className="flex items-start gap-2 rounded-xl border bg-white p-3 cursor-pointer has-[:checked]:border-[#0E9AA7]" style={{ borderColor: C.border }}>
              <input type="radio" name="plan" className="mt-1 accent-[#0E9AA7]" checked={v.plan === pl} onChange={() => setV({ ...v, plan: pl })} />
              <span>
                <span className="block font-semibold text-sm">
                  {pl === "annual" ? "Annual" : "Monthly"} · {usd(planPrice(pl))}/mo
                </span>
                <span className="block text-xs" style={{ color: C.muted }}>
                  {pl === "annual" ? PRICING.foundingBadge : "Month-to-month"}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="sm:col-span-2">
        <Btn type="submit" className="w-full sm:w-auto" disabled={v.cans.length === 0}>
          {submitLabel}
        </Btn>
      </div>
    </form>
  );
}

function AddProperty({ s, onDone }: { s: HostState; onDone: () => void }) {
  return (
    <Card>
      <h1 className="font-heading text-xl" style={{ color: C.navy }}>
        Add a property
      </h1>
      <p className="text-sm mb-4" style={{ color: C.muted }}>
        Takes about a minute. Service starts on the next trash day.
      </p>
      <PropertyForm
        submitLabel="Add property"
        onSubmit={(v) => {
          update((st) => ({
            ...st,
            properties: [...st.properties, { ...v, id: uid(), paused: false, isNew: true, week: { status: "scheduled" }, history: [], seed: st.properties.length + 1 }],
          }));
          onDone();
        }}
      />
      <p className="mt-3 text-xs" style={{ color: C.muted }}>
        You&apos;ll have {s.properties.length + 1} properties on your account.
      </p>
    </Card>
  );
}

// ---------- Overflow pickup ----------

function OverflowFlow({ s, initial, onHome }: { s: HostState; initial: string | null; onHome: () => void }) {
  const [step, setStep] = useState(initial ? 2 : 1);
  const [propertyId, setPropertyId] = useState(initial ?? "");
  const [option, setOption] = useState<Overflow["option"]>("ondemand");
  const [bags, setBags] = useState(2);
  const [window_, setWindow] = useState<Overflow["window"]>("24h");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [otherCard, setOtherCard] = useState(false);
  const [done, setDone] = useState<Overflow | null>(null);

  const p = s.properties.find((x) => x.id === propertyId);
  const amount = option === "ondemand" ? overflowPrice(bags) : PRICING.overflowWeeklyPlan;
  const maxBags = 20;
  const when = (o: { window: Overflow["window"] }, prop: Property) =>
    o.window === "24h" ? "tomorrow by 2 PM" : `on the next service run (${dayBefore(prop.trashDay)} evening)`;

  const finish = (receipt: string, last4?: string) => {
    // Runs on confirm (an event), not during render.
    // eslint-disable-next-line react-hooks/purity
    const o: Overflow = { id: uid(), propertyId, option, bags, window: window_, note, photo, status: "scheduled", createdAt: Date.now(), amount, receipt };
    update((st) => ({ ...st, overflows: [o, ...st.overflows], card: last4 ? { ...st.card, last4 } : st.card }));
    setDone(o);
  };

  if (done && p)
    return (
      <Card className="text-center py-8">
        <IconCircleCheck size={52} className="mx-auto" style={{ color: C.green }} />
        <h1 className="mt-3 font-heading text-2xl" style={{ color: C.navy }}>
          Got it.
        </h1>
        <p className="mt-2 max-w-md mx-auto">
          We&apos;ll grab {done.bags} {done.bags === 1 ? "bag" : "bags"} from {p.nickname} {when(done, p)}. You&apos;ll get a photo when it&apos;s done.
        </p>
        <div className="mt-3">
          <ReceiptLine receipt={done.receipt} />
        </div>
        <p className="mt-2 text-xs" style={{ color: C.muted }}>
          {usd(done.amount)} {done.option === "weekly" ? "per week" : ""} · Overflow pickups are charged after completion.
        </p>
        <Btn className="mt-5" onClick={onHome}>
          Back to dashboard
        </Btn>
      </Card>
    );

  return (
    <>
      <Card>
        <h1 className="font-heading text-xl" style={{ color: C.navy }}>
          Request an overflow pickup
        </h1>
        <p className="text-sm" style={{ color: C.muted }}>
          Extra bags after a big checkout? We&apos;ll take them away.
        </p>
        <ol className="mt-4 flex gap-1.5" aria-label="Progress">
          {["Property", "Option", "Details", "Confirm"].map((l, i) => (
            <li key={l} className="flex-1">
              <div className="h-1.5 rounded-full" style={{ backgroundColor: i < step ? C.teal : "#e5e7eb" }} />
              <span className="mt-1 block text-[11px]" style={{ color: i + 1 === step ? C.ink : C.muted, fontWeight: i + 1 === step ? 600 : 400 }}>
                {l}
              </span>
            </li>
          ))}
        </ol>
      </Card>

      {step === 1 && (
        <Card className="space-y-2">
          <h2 className="font-semibold">Which property?</h2>
          {s.properties.map((x) => (
            <label key={x.id} className="flex items-center gap-3 rounded-xl border bg-white px-3 py-3 cursor-pointer has-[:checked]:border-[#0E9AA7] has-[:checked]:bg-[#f0fafb]" style={{ borderColor: C.border }}>
              <input type="radio" name="prop" className="accent-[#0E9AA7]" checked={propertyId === x.id} onChange={() => setPropertyId(x.id)} />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold truncate">{x.nickname}</span>
                <span className="block text-xs" style={{ color: C.muted }}>
                  {x.area} · Trash day {x.trashDay}
                </span>
              </span>
            </label>
          ))}
          <Btn className="w-full" disabled={!propertyId} onClick={() => setStep(2)}>
            Next
          </Btn>
        </Card>
      )}

      {step === 2 && p && (
        <Card className="space-y-3">
          <StepHeader title="Pick an option" sub={p.nickname} onBack={() => setStep(1)} />
          {[
            { id: "ondemand" as const, title: `On-demand pickup · ${usd(PRICING.overflowFirstBag)} first bag`, text: `${usd(PRICING.overflowExtraBag)} for each bag after that.` },
            { id: "weekly" as const, title: `Weekly overflow plan · ${usd(PRICING.overflowWeeklyPlan)}/week`, text: "All extra trash, up to 2 properties per week. Great for busy seasons." },
          ].map((o) => (
            <label key={o.id} className="flex items-start gap-3 rounded-xl border bg-white p-4 cursor-pointer has-[:checked]:border-[#0E9AA7] has-[:checked]:bg-[#f0fafb]" style={{ borderColor: C.border }}>
              <input
                type="radio"
                name="opt"
                className="mt-1 accent-[#0E9AA7]"
                checked={option === o.id}
                onChange={() => setOption(o.id)}
              />
              <span>
                <span className="block font-semibold">{o.title}</span>
                <span className="block text-sm" style={{ color: C.muted }}>
                  {o.text}
                </span>
              </span>
            </label>
          ))}
          <Btn className="w-full" onClick={() => setStep(3)}>
            Next
          </Btn>
        </Card>
      )}

      {step === 3 && p && (
        <Card className="space-y-4">
          <StepHeader title="Details" sub={p.nickname} onBack={() => setStep(2)} />
          <div>
            <div className={labelCls}>How many bags?</div>
            <div className="inline-flex items-center rounded-xl border bg-white" style={{ borderColor: C.border }}>
              <button onClick={() => setBags((b) => Math.max(1, b - 1))} className="p-3" aria-label="Fewer bags">
                <IconMinus size={18} />
              </button>
              <span className="w-12 text-center text-lg font-bold">{bags}</span>
              <button onClick={() => setBags((b) => Math.min(maxBags, b + 1))} className="p-3" aria-label="More bags">
                <IconPlus size={18} />
              </button>
            </div>
            {option === "ondemand" && (
              <p className="mt-1 text-xs" style={{ color: C.muted }}>
                {usd(PRICING.overflowFirstBag)} first bag + {usd(PRICING.overflowExtraBag)} each after: <b>{usd(overflowPrice(bags))}</b> for {bags} {bags === 1 ? "bag" : "bags"}.
              </p>
            )}
          </div>
          <div>
            <div className={labelCls}>When?</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                { id: "next" as const, label: "Next service run", sub: `${dayBefore(p.trashDay)} evening` },
                { id: "24h" as const, label: "Within 24 hrs", sub: "Tomorrow by 2 PM" },
              ].map((w) => (
                <label key={w.id} className="flex items-start gap-2 rounded-xl border bg-white p-3 cursor-pointer has-[:checked]:border-[#0E9AA7]" style={{ borderColor: C.border }}>
                  <input type="radio" name="win" className="mt-1 accent-[#0E9AA7]" checked={window_ === w.id} onChange={() => setWindow(w.id)} />
                  <span>
                    <span className="block text-sm font-semibold">{w.label}</span>
                    <span className="block text-xs" style={{ color: C.muted }}>
                      {w.sub}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Note (optional)</label>
            <textarea rows={2} className={input} style={{ borderColor: C.border }} value={note} placeholder="Bags are by the side gate" onChange={(e) => setNote(e.target.value)} />
          </div>
          <div>
            <div className={labelCls}>Photo (optional)</div>
            <label className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-sm cursor-pointer" style={{ borderColor: C.border }}>
              <IconCamera size={18} /> {photo ? "Change photo" : "Add a photo"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPhoto(URL.createObjectURL(f));
                }}
              />
            </label>
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Your overflow photo" className="mt-2 h-20 w-28 rounded-lg object-cover border" style={{ borderColor: C.border }} />
            )}
          </div>
          <Btn className="w-full" onClick={() => setStep(4)}>
            Review
          </Btn>
        </Card>
      )}

      {step === 4 && p && (
        <Card className="space-y-4">
          <StepHeader title="Confirm" sub="Charged to your card after completion" onBack={() => setStep(3)} />
          <dl className="rounded-xl bg-white border divide-y text-sm" style={{ borderColor: C.border }}>
            {[
              ["Property", p.nickname],
              ["Option", option === "ondemand" ? "On-demand pickup" : "Weekly overflow plan"],
              ["Bags", String(bags)],
              ["When", window_ === "24h" ? "Within 24 hrs (tomorrow by 2 PM)" : `Next service run (${dayBefore(p.trashDay)} evening)`],
              ...(note ? [["Note", note]] : []),
              ["Total", `${usd(amount)}${option === "weekly" ? "/week" : ""}`],
            ].map(([k, val]) => (
              <div key={k} className="flex gap-3 px-3 py-2.5" style={{ borderColor: C.border }}>
                <dt className="w-24 shrink-0" style={{ color: C.muted }}>
                  {k}
                </dt>
                <dd className="font-medium">{val}</dd>
              </div>
            ))}
          </dl>
          {otherCard ? (
            <SquareCardForm cta="Pay" amountLabel={usd(amount)} onDone={(r, last4) => finish(r, last4)} />
          ) : (
            <ChargeOnFile brand={s.card.brand} last4={s.card.last4} amountLabel={usd(amount)} onDone={(r) => finish(r)} onUseOther={() => setOtherCard(true)} />
          )}
        </Card>
      )}

      <Card>
        <h2 className="font-semibold">Past overflow pickups</h2>
        <ul className="mt-2 divide-y text-sm" style={{ borderColor: C.border }}>
          {s.overflows.map((o) => {
            const prop = s.properties.find((x) => x.id === o.propertyId);
            return (
              <li key={o.id} className="py-2.5 flex items-center gap-3" style={{ borderColor: C.border }}>
                <span className="flex-1 min-w-0">
                  <span className="block font-medium truncate">
                    {prop?.nickname}, {o.bags} {o.bags === 1 ? "bag" : "bags"}, {usd(o.amount)}
                  </span>
                  <span className="block text-xs" style={{ color: C.muted }}>
                    Requested {fmtDate(o.createdAt)}
                  </span>
                </span>
                {o.status === "completed" ? <Pill color={C.green} bg="#dcfce7">Completed</Pill> : <Pill color={C.accent} bg="#fdf1ea">Scheduled</Pill>}
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
}

function StepHeader({ title, sub, onBack }: { title: string; sub: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onBack} aria-label="Back" className="p-1 -ml-1 rounded-lg hover:bg-black/5">
        <IconChevronLeft size={20} />
      </button>
      <div>
        <h2 className="font-semibold leading-tight">{title}</h2>
        <div className="text-xs" style={{ color: C.muted }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

// ---------- Billing ----------

function Billing({ s }: { s: HostState }) {
  const [updating, setUpdating] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const total = s.properties.reduce((n, p) => n + planPrice(p.plan), 0);
  const inv = s.invoices.find((i) => i.id === receipt);
  const credits = referralCredits(s);
  const credit = credits * REFERRAL.creditPerMonth;
  const next = new Date();
  next.setMonth(next.getMonth() + 1, 1);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold" style={{ backgroundColor: "#fdf1ea", color: C.accent }}>
          {PRICING.foundingBadge} 🔒
        </span>
      </div>

      <Card>
        <h2 className="font-semibold">Card on file</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="rounded-md px-2 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: "#1A1F71" }}>
            {s.card.brand.toUpperCase()}
          </span>
          <span className="font-semibold">
            {s.card.brand} •••• {s.card.last4}
          </span>
          <Btn variant="ghost" className="ml-auto !py-2" onClick={() => setUpdating(true)}>
            Update card
          </Btn>
        </div>
        {saved && (
          <div className="mt-3">
            <ReceiptLine receipt={saved} />
          </div>
        )}
        <ul className="mt-3 text-xs space-y-1" style={{ color: C.muted }}>
          <li>Cards are charged monthly on the 1st.</li>
          <li>Annual plans can be billed upfront or monthly.</li>
          <li>Overflow pickups are charged after completion.</li>
        </ul>
      </Card>

      <Card>
        <h2 className="font-semibold">Plans</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs" style={{ color: C.muted }}>
                <th className="py-2 font-medium">Property</th>
                <th className="py-2 font-medium">Plan</th>
                <th className="py-2 font-medium text-right">Per month</th>
              </tr>
            </thead>
            <tbody>
              {s.properties.map((p) => (
                <tr key={p.id} className="border-t" style={{ borderColor: C.border }}>
                  <td className="py-2 pr-2">
                    {p.nickname}
                    {p.paused && <span className="text-xs" style={{ color: C.muted }}> (paused)</span>}
                  </td>
                  <td className="py-2 pr-2 whitespace-nowrap">{planLabel(p.plan)}</td>
                  <td className="py-2 text-right whitespace-nowrap">{usd(planPrice(p.plan))}</td>
                </tr>
              ))}
              <tr className="border-t font-semibold" style={{ borderColor: C.border }}>
                <td className="py-2" colSpan={2}>
                  Total
                </td>
                <td className="py-2 text-right">{usd(total)}/mo</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Next invoice · {next.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</h2>
        <ul className="mt-2 text-sm space-y-1.5">
          <li className="flex gap-3">
            <span className="flex-1">Can-to-curb service, {s.properties.length} properties</span>
            <span>{usd(total)}</span>
          </li>
          {credits > 0 && (
            <li className="flex gap-3" style={{ color: C.green }}>
              <span className="flex-1">
                Referral credit · {credits} free {credits === 1 ? "month" : "months"} 🎁
              </span>
              <span>−{usd(credit)}</span>
            </li>
          )}
          <li className="flex gap-3 pt-2 border-t font-semibold" style={{ borderColor: C.border }}>
            <span className="flex-1">Total</span>
            <span>{usd(Math.max(0, total - credit))}</span>
          </li>
        </ul>
      </Card>

      <Card>
        <h2 className="font-semibold">Invoices</h2>
        <ul className="mt-2 divide-y text-sm" style={{ borderColor: C.border }}>
          {s.invoices.map((i) => (
            <li key={i.id} className="py-2.5 flex items-center gap-3" style={{ borderColor: C.border }}>
              <IconReceipt size={18} style={{ color: C.muted }} />
              <span className="flex-1">
                {new Date(i.date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                <span className="block text-xs" style={{ color: C.muted }}>
                  Paid {fmtDate(i.date)} · {s.card.brand} •••• 4242
                </span>
              </span>
              <span className="font-semibold">{usd(invoiceTotal(i))}</span>
              <button onClick={() => setReceipt(i.id)} className="text-xs font-semibold underline underline-offset-2" style={{ color: C.teal }}>
                View receipt
              </button>
            </li>
          ))}
        </ul>
      </Card>

      {updating && (
        <Modal title="Update card" onClose={() => setUpdating(false)}>
          <SquareCardForm
            cta="Save card"
            onDone={(r, last4) => {
              update((st) => ({ ...st, card: { ...st.card, last4 } }));
              setSaved(r);
              setUpdating(false);
            }}
          />
        </Modal>
      )}
      {inv && (
        <Modal title="Receipt" onClose={() => setReceipt(null)}>
          <div className="rounded-2xl bg-white border p-4 text-sm" style={{ borderColor: C.border }}>
            <div className="flex items-center gap-2">
              <LogoMarkDark />
              <div>
                <div className="font-semibold">Doorstep Disposal</div>
                <div className="text-xs" style={{ color: C.muted }}>
                  {s.account.name}
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs" style={{ color: C.muted }}>
              {new Date(inv.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {fmtTime(inv.date)}
            </div>
            <ul className="mt-3 space-y-1.5">
              {inv.lines.map((l) => (
                <li key={l.label} className="flex gap-3">
                  <span className="flex-1">{l.label}</span>
                  <span>{usd(l.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t flex font-semibold" style={{ borderColor: C.border }}>
              <span className="flex-1">Total paid</span>
              <span>{usd(invoiceTotal(inv))}</span>
            </div>
            <div className="mt-3">
              <ReceiptLine receipt={inv.receipt} />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

// ---------- Refer & earn ----------

const REF_TYPES: Record<ReferralType, string> = { host: "Another host", neighbor: "Neighbor", owner: "Property owner" };

function Refer({ s }: { s: HostState }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [type, setType] = useState<ReferralType>("host");
  const [near, setNear] = useState("");
  const [toast, setToast] = useState("");
  const link = `https://${referralLink()}`;
  const message = `I use Doorstep Disposal for trash day at my rentals. Sign up with my link and we both get a month free: ${link}`;
  const credits = referralCredits(s);

  const copy = async (msg = "Link copied.") => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {}
    setToast(msg);
  };

  return (
    <>
      <Card className="text-center py-6">
        <IconGift size={40} className="mx-auto" style={{ color: C.accent }} />
        <h1 className="mt-2 font-heading text-2xl" style={{ color: C.navy }}>
          Give a free month, get a free month.
        </h1>
        <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: C.muted }}>
          When someone you refer starts service, you both get one month free. Neighbors on your street help us keep prices low.
        </p>
        <div className="mt-4 mx-auto max-w-md flex items-center gap-2 rounded-xl border bg-white pl-3 pr-1 py-1" style={{ borderColor: C.border }}>
          <span className="flex-1 min-w-0 truncate text-sm font-mono text-left">{referralLink()}</span>
          <Btn variant="navy" className="!py-2" onClick={() => copy()}>
            <span className="inline-flex items-center gap-1.5">
              <IconCopy size={15} /> Copy
            </span>
          </Btn>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <a href={`sms:?&body=${encodeURIComponent(message)}`} className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold" style={{ borderColor: C.border, color: C.navy }}>
            <IconMessage size={16} /> Text
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent("A free month of trash can valet")}&body=${encodeURIComponent(message)}`}
            className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"
            style={{ borderColor: C.border, color: C.navy }}
          >
            <IconMail size={16} /> Email
          </a>
          <button
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({ title: "Doorstep Disposal", text: message, url: link });
                  return;
                } catch {
                  return;
                }
              }
              copy();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"
            style={{ borderColor: C.border, color: C.navy }}
          >
            <IconShare size={16} /> Share
          </button>
        </div>
        {toast && (
          <p className="mt-3 inline-block rounded-xl px-3 py-2 text-sm font-medium" role="status" style={{ backgroundColor: "#ecfdf5", color: C.green }}>
            {toast}
          </p>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold">Quick refer</h2>
        <form
          className="mt-3 grid sm:grid-cols-2 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update((st) => ({
              ...st,
              referrals: [{ id: uid(), name: name.trim(), type, status: "invited", sameRoute: type === "neighbor" && near ? near : undefined }, ...st.referrals],
            }));
            setName("");
            setContact("");
            setNear("");
            setToast("Invite ready. Copy the link or text it to them.");
          }}
        >
          <input required className={input} style={{ borderColor: C.border }} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input required className={input} style={{ borderColor: C.border }} placeholder="Phone or email" value={contact} onChange={(e) => setContact(e.target.value)} />
          <select className={input} style={{ borderColor: C.border }} value={type} onChange={(e) => setType(e.target.value as ReferralType)}>
            {(Object.keys(REF_TYPES) as ReferralType[]).map((t) => (
              <option key={t} value={t}>
                {REF_TYPES[t]}
              </option>
            ))}
          </select>
          {type === "neighbor" ? (
            <select className={input} style={{ borderColor: C.border }} value={near} onChange={(e) => setNear(e.target.value)}>
              <option value="">Near which property? (optional)</option>
              {s.properties.map((p) => (
                <option key={p.id} value={p.nickname}>
                  {p.nickname}
                </option>
              ))}
            </select>
          ) : (
            <span className="hidden sm:block" />
          )}
          <Btn type="submit" className="sm:col-span-2">
            Create invite
          </Btn>
        </form>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold flex-1">Your referrals</h2>
          {credits > 0 && (
            <span className="text-sm font-semibold" style={{ color: C.green }}>
              {credits} free {credits === 1 ? "month" : "months"} earned · applied to your next invoice
            </span>
          )}
        </div>
        <ul className="mt-2 divide-y text-sm" style={{ borderColor: C.border }}>
          {s.referrals.map((r) => (
            <li key={r.id} className="py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1" style={{ borderColor: C.border }}>
              <span className="flex-1 min-w-[10rem]">
                <span className="block font-semibold">{r.name}</span>
                <span className="block text-xs" style={{ color: C.muted }}>
                  {r.type === "neighbor" ? "Neighbor" : r.type === "owner" ? "Property owner" : "Host"}
                  {r.sameRoute ? ` · ${r.sameRoute} street` : ""}
                </span>
              </span>
              {r.sameRoute && <Pill color={C.teal} bg="#dff5f7">📍 Same route</Pill>}
              <span className="text-xs font-semibold whitespace-nowrap" style={{ color: r.status === "started" ? C.green : r.status === "signed" ? C.amber : C.muted }}>
                {r.status === "started" ? "✅ Started service" : r.status === "signed" ? `⏳ Signed up${r.detail ? `, ${r.detail}` : ""}` : "✉️ Invited"}
              </span>
              <span className="w-full sm:w-36 text-xs sm:text-right" style={{ color: C.muted }}>
                {r.status === "started" ? `${REFERRAL.rewardReferrer} applied` : r.status === "signed" ? "Pending" : "—"}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function LogoMarkDark() {
  return (
    <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.navy }}>
      <LogoMark size={26} />
    </span>
  );
}

// ---------- Alerts & team ----------

function Settings({ s }: { s: HostState }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <>
      <Card>
        <h2 className="font-semibold">Notifications</h2>
        <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-2 items-center text-sm">
          <span />
          <span className="text-xs font-semibold" style={{ color: C.muted }}>
            Text
          </span>
          <span className="text-xs font-semibold" style={{ color: C.muted }}>
            Email
          </span>
          {ALERTS.map((a) => (
            <Row key={a.id}>
              <span>{a.label}</span>
              {(["text", "email"] as const).map((ch) => (
                <Toggle
                  key={ch}
                  on={s.alerts[a.id][ch]}
                  label={`${a.label} by ${ch}`}
                  onChange={(on) => update((st) => ({ ...st, alerts: { ...st.alerts, [a.id]: { ...st.alerts[a.id], [ch]: on } } }))}
                />
              ))}
            </Row>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Team access</h2>
        <p className="text-sm" style={{ color: C.muted }}>
          Invite a cleaner or co-host. They can request overflow pickups and view status.
        </p>
        <ul className="mt-3 divide-y text-sm" style={{ borderColor: C.border }}>
          {s.team.map((t) => (
            <li key={t.id} className="py-2.5 flex items-center gap-3" style={{ borderColor: C.border }}>
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: C.teal }}>
                {t.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-medium truncate">{t.name}</span>
                <span className="block text-xs" style={{ color: C.muted }}>
                  {t.phone} · Can request overflow / view status
                </span>
              </span>
              <button
                className="text-xs underline underline-offset-2"
                style={{ color: C.muted }}
                onClick={() => update((st) => ({ ...st, team: st.team.filter((x) => x.id !== t.id) }))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 grid sm:grid-cols-[1fr_1fr_auto] gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update((st) => ({ ...st, team: [...st.team, { id: uid(), name: name.trim(), phone: phone.trim() }] }));
            setName("");
            setPhone("");
          }}
        >
          <input required className={input} style={{ borderColor: C.border }} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input required className={input} style={{ borderColor: C.border }} placeholder="Mobile number" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Btn type="submit">
            <span className="inline-flex items-center gap-1.5">
              <IconUserPlus size={16} /> Invite
            </span>
          </Btn>
        </form>
      </Card>

      <CalendarSync />

      <Card className="flex items-start gap-3">
        <IconMessage size={26} className="shrink-0" style={{ color: C.teal }} />
        <div>
          <div className="font-semibold">Text Adil directly: {CONTACT_PHONE}</div>
          <div className="text-sm" style={{ color: C.muted }}>
            Locally operated in San Diego.
          </div>
        </div>
      </Card>
    </>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="relative w-11 h-6 rounded-full transition"
      style={{ backgroundColor: on ? C.teal : "#d1d5db" }}
    >
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: on ? 22 : 2 }} />
    </button>
  );
}
