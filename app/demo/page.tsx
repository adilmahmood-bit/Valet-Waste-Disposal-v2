"use client";
import Link from "next/link";
import { IconBuildingSkyscraper, IconHome, IconTruck, IconHeadset, IconLayoutColumns, IconArrowRight, IconReportAnalytics } from "@tabler/icons-react";
import { useDemo, PROPERTY } from "@/lib/demo/store";
import { AttendantBanner, C, LogoMark, ResetButton, Wordmark } from "@/components/demo/ui";

const ROLES = [
  {
    href: "/demo/porter",
    title: "Attendant App",
    who: "For the porter on the route",
    icon: IconTruck,
    points: ["Clock in and property check-in", "QR scan and photo at every door", "Violation reports and resident callbacks"],
  },
  {
    href: "/demo/resident",
    title: "Resident App",
    who: "For residents at the property",
    icon: IconHome,
    points: ["Live attendant status", "Unlimited callbacks while we're on property", "Violation notices with photos"],
  },
  {
    href: "/demo/manager",
    title: "Property Manager Portal",
    who: "For the leasing office",
    icon: IconBuildingSkyscraper,
    points: ["Live map and tonight's progress", "Bulk trash requests: send a photo, get a quote", "Violation insights and service reports"],
  },
  {
    href: "/demo/dispatch",
    title: "Dispatch",
    who: "For the Valet Waste office",
    icon: IconHeadset,
    points: ["Quote bulk pickup requests", "Monitor callbacks across properties"],
  },
  {
    href: "/demo/report",
    title: "Nightly Report",
    who: "Emailed to managers after every service night",
    icon: IconReportAnalytics,
    points: ["Every door checked, with time stamps", "Trash pad and violation photos", "Callbacks, timeline, and month-to-date totals"],
  },
];

export default function DemoHome() {
  const s = useDemo();
  return (
    <div className="min-h-dvh" style={{ backgroundColor: C.surface }}>
      <header className="text-white" style={{ backgroundColor: C.navy }}>
        <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
          <div className="flex items-center gap-3">
            <LogoMark size={56} />
            <Wordmark />
          </div>
          <h1 className="font-heading text-3xl sm:text-5xl mt-8 leading-tight">
            Every door, every night.
            <br />
            <span style={{ color: C.tealSoft }}>Now you can see it happen.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-white/80">
            One app for your attendant, your residents, and your leasing office. Tap a role to try it. Open two roles in
            separate tabs or on two phones and they update together.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="max-w-md">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: C.muted }}>
            Right now at {PROPERTY.name}
          </div>
          <AttendantBanner a={s.attendant} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {ROLES.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="group bg-white rounded-2xl border p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow"
              style={{ borderColor: C.border }}
            >
              <div className="flex items-center gap-3">
                <span className="rounded-xl p-2.5" style={{ backgroundColor: "#e6f6f7", color: C.teal }}>
                  <r.icon size={24} />
                </span>
                <div>
                  <div className="font-heading text-lg" style={{ color: C.navy }}>
                    {r.title}
                  </div>
                  <div className="text-xs" style={{ color: C.muted }}>
                    {r.who}
                  </div>
                </div>
                <IconArrowRight className="ml-auto opacity-40 group-hover:opacity-100 transition" size={20} style={{ color: C.teal }} />
              </div>
              <ul className="text-sm space-y-1 text-gray-700">
                {r.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span style={{ color: C.teal }}>•</span>
                    {p}
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>

        <Link
          href="/demo/stage"
          className="hidden md:flex items-center gap-3 rounded-2xl p-5 text-white"
          style={{ backgroundColor: C.navyDeep }}
        >
          <IconLayoutColumns size={28} style={{ color: C.tealSoft }} />
          <div>
            <div className="font-heading text-lg">Presenter view</div>
            <div className="text-sm text-white/70">Attendant, resident, and manager side by side on one screen</div>
          </div>
          <IconArrowRight className="ml-auto" size={20} />
        </Link>

        <div className="flex items-center justify-between text-xs pt-2" style={{ color: C.muted }}>
          <span>
            Demo data only. Nothing here is saved to a server. ·{" "}
            <Link href="/demo/features" className="underline">
              Full feature list
            </Link>
          </span>
          <ResetButton />
        </div>
      </main>
    </div>
  );
}
