import Link from "next/link";
import { IconChevronLeft, IconCreditCard, IconGift, IconHome, IconPlus, IconSettings, IconTrashX } from "@tabler/icons-react";
import { residential } from "@/config/residential";

// The signed-in portal's frame, in the same look as the /hosts/portal demo: navy sidebar on
// desktop, a top bar and bottom tabs on a phone. Tabs are links (?tab=...), so it all renders
// on the server and works the same in the admin "View as customer" preview.

export const P = {
  navy: "#1B4F72",
  navyDeep: "#143B56",
  teal: "#0E9AA7",
  tealDark: "#137F8C",
  tealSoft: "#7FDDE6",
  accent: "#C9622B",
  ink: "#1A1A1A",
  muted: "#6b7280",
  border: "#E7E2D8",
  page: "#eef1f4",
  green: "#15803d",
  amber: "#b45309",
  red: "#b91c1c",
};

export type TabId = "home" | "overflow" | "add" | "refer" | "billing" | "alerts";

const ALL_TABS: { id: TabId; label: string; short: string; icon: typeof IconHome }[] = [
  { id: "home", label: "Home", short: "Home", icon: IconHome },
  { id: "overflow", label: "Extra pickup", short: "Extra", icon: IconTrashX },
  { id: "add", label: "Add property", short: "Add", icon: IconPlus },
  { id: "refer", label: "Refer a friend", short: "Refer", icon: IconGift },
  { id: "billing", label: "Billing", short: "Billing", icon: IconCreditCard },
  { id: "alerts", label: "Alerts & team", short: "Alerts", icon: IconSettings },
];

export const tabsFor = (showOverflow: boolean) => ALL_TABS.filter((t) => t.id !== "overflow" || showOverflow);

function initials(name: string) {
  const parts = name.replace(/\(.*\)/, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span className="shrink-0 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ backgroundColor: P.accent, width: size, height: size }}>
      {initials(name)}
    </span>
  );
}

export function Shell({
  name,
  company,
  tab,
  showOverflow,
  title,
  subtitle,
  back,
  children,
}: {
  name: string;
  company: string | null;
  tab: TabId;
  showOverflow: boolean;
  title: string;
  subtitle?: string;
  back?: string; // href for a back arrow (property page)
  children: React.ReactNode;
}) {
  const tabs = tabsFor(showOverflow);
  const { contact } = residential;
  const person = name.replace(/\s*\(.*\)\s*/, "");

  return (
    <div className="min-h-dvh" style={{ backgroundColor: P.page }}>
      <div className="lg:flex">
        <aside
          className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-dvh text-white p-4"
          style={{ background: `linear-gradient(180deg, ${P.navy} 0%, ${P.navyDeep} 100%)` }}
        >
          <Link href="?tab=home" className="flex items-center gap-2.5 px-2 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/vwd-icon-white.png" alt="" aria-hidden="true" className="h-10 w-auto" />
            <span className="leading-tight">
              <span className="block font-bold text-[17px]">Doorstep Disposal</span>
              <span className="block text-[11px] uppercase tracking-[0.18em]" style={{ color: P.tealSoft }}>
                Your account
              </span>
            </span>
          </Link>
          <nav className="mt-6 space-y-1 flex-1">
            {tabs.map((t) => (
              <Link
                key={t.id}
                href={`?tab=${t.id}`}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-white/10"
                style={tab === t.id && !back ? { backgroundColor: P.teal, fontWeight: 600 } : { opacity: 0.85 }}
                aria-current={tab === t.id && !back ? "page" : undefined}
              >
                <t.icon size={18} /> {t.label}
              </Link>
            ))}
          </nav>
          <div className="rounded-xl p-3 text-xs" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <div className="font-semibold">Locally operated in San Diego</div>
            <div className="opacity-75">
              Call or text <a href={`tel:${contact.phoneHref}`} className="underline">{contact.phone}</a> anytime.
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 pb-24 lg:pb-8">
          {/* Top bar (phone) */}
          <header className="lg:hidden sticky top-0 z-30 text-white" style={{ backgroundColor: P.navy, paddingTop: "env(safe-area-inset-top, 0px)" }}>
            <div className="px-4 h-14 flex items-center gap-2.5">
              {back ? (
                <Link href={back} aria-label="Back" className="-ml-1 p-1">
                  <IconChevronLeft size={24} />
                </Link>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/logo/vwd-icon-white.png" alt="" aria-hidden="true" className="h-8 w-auto" />
              )}
              <div className="min-w-0 flex-1 leading-tight">
                <div className="font-semibold text-[15px] truncate">{back ? title : "Doorstep Disposal"}</div>
                <div className="text-[11px] truncate" style={{ color: P.tealSoft }}>
                  {back ? subtitle : company ?? person}
                </div>
              </div>
              <Avatar name={name} size={34} />
            </div>
          </header>

          <main className="max-w-5xl mx-auto p-4 lg:p-6 space-y-4">
            {/* Title row (desktop) */}
            <div className="hidden lg:flex bg-white rounded-2xl border px-4 py-3 items-center gap-3" style={{ borderColor: P.border }}>
              {back && (
                <Link href={back} aria-label="Back" className="p-1 rounded-lg hover:bg-black/5">
                  <IconChevronLeft size={22} />
                </Link>
              )}
              <div className="min-w-0">
                <div className="font-bold text-xl" style={{ color: P.navy }}>{title}</div>
                {subtitle && <div className="text-xs" style={{ color: P.muted }}>{subtitle}</div>}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Avatar name={name} />
                <div className="leading-tight">
                  <div className="text-sm font-semibold">{person}</div>
                  {company && <div className="text-[11px]" style={{ color: P.muted }}>{company}</div>}
                </div>
              </div>
            </div>
            {children}
          </main>
        </div>
      </div>

      {/* Bottom tabs (phone) */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t grid"
        style={{ borderColor: P.border, paddingBottom: "env(safe-area-inset-bottom, 0px)", gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((t) => {
          const active = tab === t.id && !back;
          return (
            <Link key={t.id} href={`?tab=${t.id}`} className="flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium" style={{ color: active ? P.teal : P.muted }}>
              <t.icon size={22} stroke={active ? 2.2 : 1.7} />
              {t.short}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// White card, as in the demo.
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-white rounded-2xl border p-4 ${className}`} style={{ borderColor: P.border }}>
      {children}
    </section>
  );
}

export function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap" style={{ color, backgroundColor: bg }}>
      {label}
    </span>
  );
}
