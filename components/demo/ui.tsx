"use client";
import Link from "next/link";
import { AttendantStatus, DemoState, fmtTime, resetDemo } from "@/lib/demo/store";

export const C = {
  navy: "#1B4F72",
  navyDeep: "#143B56",
  teal: "#0E9AA7",
  tealSoft: "#7FDDE6",
  accent: "#C9622B",
  ink: "#1A1A1A",
  muted: "#6b7280",
  surface: "#FAF8F4",
  border: "#E7E2D8",
  green: "#15803d",
  amber: "#b45309",
  red: "#b91c1c",
};

export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <svg viewBox="30 16 120 102" aria-hidden="true" style={{ width: size, height: "auto", display: "block" }}>
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="30" y="16" width="120" height="102" rx="20" strokeWidth="2.4" opacity="0.55" />
        <path d="M84 110 L130 110" strokeWidth="2.6" />
        <path d="M88 110 L88 30 L126 30 L126 110" />
        <rect x="95" y="38" width="24" height="28" strokeWidth="2.4" />
        <rect x="95" y="74" width="24" height="30" strokeWidth="2.4" />
        <path d="M60 80 L60 78.5 Q60 77 62 77 L64 77 Q66 77 66 78.5 L66 80" strokeWidth="2.6" />
        <path d="M53 82 L73 82" strokeWidth="3.2" />
        <path d="M54 86 L72 86 L69 106 Q69 110 65 110 L61 110 Q57 110 57 106 Z" strokeWidth="3" />
        <path d="M59.5 90 L59.5 105" strokeWidth="1.7" />
        <path d="M63 90 L63 105" strokeWidth="1.7" />
        <path d="M66.5 90 L66.5 105" strokeWidth="1.7" />
      </g>
      <circle cx="93" cy="70" r="2" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ small }: { small?: boolean }) {
  const s = small ? 12 : 15;
  return (
    <span className="flex flex-col leading-none" style={{ fontFamily: "var(--font-libre-franklin)" }}>
      <span style={{ fontWeight: 800, fontSize: s, letterSpacing: "-0.01em" }}>VALET WASTE</span>
      <span style={{ fontWeight: 500, fontSize: s, letterSpacing: "0.205em", marginTop: 2 }}>DISPOSAL</span>
    </span>
  );
}

export const STATUS_META: Record<AttendantStatus, { label: string; color: string; bg: string }> = {
  off: { label: "Attendant off duty", color: "#4b5563", bg: "#f3f4f6" },
  enroute: { label: "Attendant en route", color: C.amber, bg: "#fef3c7" },
  onsite: { label: "Attendant on property", color: C.green, bg: "#dcfce7" },
  done: { label: "Tonight's service complete", color: C.navy, bg: "#e0eef7" },
};

export function statusDetail(a: DemoState["attendant"]) {
  switch (a.status) {
    case "off":
      return "Next service tonight, 7:00 – 9:00 PM";
    case "enroute":
      return `${a.name} clocked in at ${fmtTime(a.clockIn)} · arriving shortly`;
    case "onsite":
      return `${a.name} · Building ${a.building ?? "A"} · since ${fmtTime(a.checkIn)}`;
    case "done":
      return `${a.name} checked out at ${fmtTime(a.checkOut)}`;
  }
}

export function StatusDot({ status, size = 10 }: { status: AttendantStatus; size?: number }) {
  const { color } = STATUS_META[status];
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      {status === "onsite" && (
        <span className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: color, opacity: 0.45 }} />
      )}
      <span className="relative rounded-full" style={{ width: size, height: size, backgroundColor: color }} />
    </span>
  );
}

export function AttendantBanner({ a }: { a: DemoState["attendant"] }) {
  const m = STATUS_META[a.status];
  return (
    <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ backgroundColor: m.bg }}>
      <StatusDot status={a.status} size={12} />
      <div className="min-w-0">
        <div className="font-semibold text-sm" style={{ color: m.color }}>
          {m.label}
        </div>
        <div className="text-xs text-gray-600 truncate">{statusDetail(a)}</div>
      </div>
    </div>
  );
}

export function Card({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`bg-white rounded-2xl border p-4 ${className}`} style={{ borderColor: C.border, ...style }}>
      {children}
    </div>
  );
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "navy" | "accent" | "ghost" | "danger";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: C.teal, color: "#fff" },
    navy: { backgroundColor: C.navy, color: "#fff" },
    accent: { backgroundColor: C.accent, color: "#fff" },
    ghost: { backgroundColor: "#fff", color: C.navy, border: `1px solid ${C.border}` },
    danger: { backgroundColor: "#fff", color: C.red, border: "1px solid #fecaca" },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-40 ${className}`}
      style={styles[variant]}
    >
      {children}
    </button>
  );
}

// Branded top bar used by the phone-style apps.
export function AppHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <header
      className="sticky z-20 text-white"
      style={{ top: 0, backgroundColor: C.navy, paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="flex items-center gap-2 px-4 h-14">
        <Link href="/demo" className="flex items-center gap-1.5" aria-label="Demo home">
          <LogoMark size={34} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="font-heading text-[15px] leading-tight truncate">{title}</div>
          {subtitle && (
            <div className="text-[11px] leading-tight truncate" style={{ color: C.tealSoft }}>
              {subtitle}
            </div>
          )}
        </div>
        {right}
      </div>
    </header>
  );
}

// Phone-width column; full screen on a phone, centered card on desktop.
export function PhoneApp({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh sm:py-6" style={{ backgroundColor: "#e9e5dc" }}>
      <div
        className="mx-auto w-full max-w-[430px] min-h-dvh sm:min-h-[860px] sm:rounded-[28px] sm:overflow-hidden sm:shadow-2xl flex flex-col"
        style={{ backgroundColor: C.surface }}
      >
        {children}
      </div>
    </div>
  );
}

export function ResetButton({ className = "" }: { className?: string }) {
  return (
    <button
      onClick={() => resetDemo()}
      className={`text-xs underline underline-offset-2 ${className}`}
      style={{ color: C.muted }}
    >
      Reset demo
    </button>
  );
}

export function Pill({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap" style={{ color, backgroundColor: bg }}>
      {children}
    </span>
  );
}

export function PhotoThumb({ src, alt, className = "" }: { src?: string; alt: string; className?: string }) {
  if (!src)
    return (
      <div className={`rounded-lg flex items-center justify-center text-[10px] text-gray-400 bg-gray-100 ${className}`}>No photo</div>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={`rounded-lg object-cover ${className}`} />;
}
