"use client";
import { useEffect, useRef, useState } from "react";
import { IconPhoneCall, IconCheck, IconAlertTriangle, IconSpeakerphone, IconInfoCircle, IconClock, IconBell, IconArrowLeft } from "@tabler/icons-react";
import {
  useDemo,
  update,
  uid,
  fmtTime,
  RESIDENT_UNIT,
  PROPERTY,
  DOORSTEP_ALERTS,
  DoorstepAlert,
  Channel,
  AlertPrefs,
  DemoState,
} from "@/lib/demo/store";
import { AppHeader, Btn, C, Card, LogoMark, PhoneApp, PhotoThumb, Pill, ResetButton, STATUS_META, StatusDot, statusDetail } from "@/components/demo/ui";

const REASONS = ["Missed pickup", "Fixed my violation", "Got home late", "Extra bag"];

// Simulated push notifications: compare each new state to the last one and
// raise a banner only for alerts the resident has switched on.
function usePushBanners(s: DemoState) {
  const prev = useRef<DemoState | null>(null);
  const [banner, setBanner] = useState<{ id: number; title: string; body: string } | null>(null);

  useEffect(() => {
    const p = prev.current;
    prev.current = s;
    if (!p) return;
    const on = (k: DoorstepAlert) => s.alerts.doorstep && s.alerts.push[k];
    const show = (title: string, body: string) => setBanner({ id: Date.now(), title, body });
    const door = s.doors[RESIDENT_UNIT];
    const pDoor = p.doors[RESIDENT_UNIT];
    const first = s.attendant.name.split(" ")[0];

    if (s.attendant.status === "onsite" && p.attendant.status !== "onsite" && on("onProperty"))
      show("Your attendant is here", `${first} is on property. Missed pickup? Tap to call them back.`);
    if (s.attendant.status === "done" && p.attendant.status !== "done" && on("complete"))
      show("Service complete", "Tonight's valet trash service is finished. See you tomorrow.");
    if (door?.status === "violation" && pDoor?.status !== "violation" && on("violation"))
      show("Trash not collected", `${door.violation}. Fix it and call your attendant back.`);
    if (door?.status === "done" && pDoor?.status !== "done" && on("pickedUp"))
      show("Picked up ✓", `Your trash was collected at ${fmtTime(door.at)}.`);
    const doneNow = s.callbacks.find((c) => c.unit === RESIDENT_UNIT && c.status === "done" && p.callbacks.find((x) => x.id === c.id)?.status === "open");
    if (doneNow && on("callbackDone")) show("Callback complete", `${first} picked up your trash at ${fmtTime(doneNow.doneAt)}.`);
    if (s.broadcasts.length > p.broadcasts.length && s.alerts.comms && s.alerts.community.push)
      show("From your leasing office", s.broadcasts[s.broadcasts.length - 1].text);
  }, [s]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 6000);
    return () => clearTimeout(t);
  }, [banner]);

  return [banner, () => setBanner(null)] as const;
}

export default function ResidentApp() {
  const s = useDemo();
  const [view, setView] = useState<"home" | "alerts">("home");
  const [banner, dismiss] = usePushBanners(s);
  const alertsOn = s.alerts.doorstep && Object.values(s.alerts.push).some(Boolean);

  return (
    <PhoneApp>
      <AppHeader
        title={view === "alerts" ? "Alerts & notifications" : PROPERTY.name}
        subtitle={`Unit ${RESIDENT_UNIT} · Valet trash`}
        right={
          <button
            onClick={() => setView(view === "home" ? "alerts" : "home")}
            className="relative rounded-full p-2 border border-white/30"
            aria-label={view === "home" ? "Alert settings" : "Back"}
          >
            {view === "home" ? <IconBell size={18} /> : <IconArrowLeft size={18} />}
            {view === "home" && alertsOn && <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: C.tealSoft }} />}
          </button>
        }
      />
      {view === "home" ? <Home s={s} openAlerts={() => setView("alerts")} /> : <AlertSettings prefs={s.alerts} />}

      {banner && (
        <button
          key={banner.id}
          onClick={dismiss}
          className="fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-[406px] text-left rounded-2xl p-3 flex gap-3 shadow-2xl backdrop-blur animate-[slidein_0.35s_ease-out]"
          style={{ top: "calc(0.75rem + env(safe-area-inset-top, 0px))", backgroundColor: "rgba(255,255,255,0.96)", border: `1px solid ${C.border}` }}
        >
          <span className="rounded-xl p-1.5 text-white shrink-0 self-start" style={{ backgroundColor: C.navy }}>
            <LogoMark size={26} />
          </span>
          <span className="min-w-0">
            <span className="flex justify-between text-[11px]" style={{ color: C.muted }}>
              <span>VALET WASTE DISPOSAL</span>
              <span>now</span>
            </span>
            <span className="block font-semibold text-sm">{banner.title}</span>
            <span className="block text-sm text-gray-600">{banner.body}</span>
          </span>
        </button>
      )}
    </PhoneApp>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className="relative w-14 h-8 rounded-full transition-colors shrink-0"
      style={{ backgroundColor: on ? C.teal : "#d1d5db" }}
    >
      <span className="absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all" style={{ left: on ? 28 : 4 }} />
    </button>
  );
}

function OnOff({ on, onChange, disabled, label }: { on: boolean; onChange: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      aria-pressed={on}
      aria-label={label}
      className="w-16 py-2 rounded-full text-xs font-semibold border transition disabled:opacity-35"
      style={on ? { backgroundColor: C.navy, color: "#fff", borderColor: C.navy } : { backgroundColor: "#fff", color: C.navy, borderColor: "#cbd5e1" }}
    >
      {on ? "On" : "Off"}
    </button>
  );
}

function AlertSettings({ prefs }: { prefs: AlertPrefs }) {
  const set = (fn: (a: AlertPrefs) => AlertPrefs) => update((st) => ({ ...st, alerts: fn(st.alerts) }));
  const channels: Channel[] = ["email", "text", "push"];
  const commRows = [
    { key: "service" as const, label: "Service updates and reminders" },
    { key: "community" as const, label: "Leasing office announcements" },
  ];

  return (
    <div className="flex-1 pb-6">
      <section className="bg-white border-b" style={{ borderColor: C.border }}>
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <div className="font-heading text-lg" style={{ color: C.navy }}>
            Communication Preferences
          </div>
          <Toggle label="Communication preferences" on={prefs.comms} onChange={() => set((a) => ({ ...a, comms: !a.comms }))} />
        </div>
        <div className="grid grid-cols-[1fr_repeat(3,4.25rem)] items-center px-4 py-2 text-sm font-semibold" style={{ backgroundColor: "#f3f6f8", color: C.navy }}>
          <span />
          <span className="text-center">Email</span>
          <span className="text-center">Text</span>
          <span className="text-center">Push</span>
        </div>
        {commRows.map((r) => (
          <div key={r.key} className="grid grid-cols-[1fr_repeat(3,4.25rem)] items-center px-4 py-3 border-t" style={{ borderColor: C.border }}>
            <span className="text-sm pr-2" style={{ color: C.navy }}>
              {r.label}
            </span>
            {channels.map((ch) => (
              <span key={ch} className="flex justify-center">
                <OnOff
                  label={`${r.label} by ${ch}`}
                  on={prefs.comms && prefs[r.key][ch]}
                  disabled={!prefs.comms}
                  onChange={() => set((a) => ({ ...a, [r.key]: { ...a[r.key], [ch]: !a[r.key][ch] } }))}
                />
              </span>
            ))}
          </div>
        ))}
      </section>

      <section className="bg-white border-b mt-3" style={{ borderColor: C.border }}>
        <div className="flex items-center justify-between gap-3 px-4 py-4 border-t" style={{ borderColor: C.border }}>
          <div className="font-heading text-lg" style={{ color: C.navy }}>
            Doorstep Collection Notifications
          </div>
          <Toggle label="Doorstep collection notifications" on={prefs.doorstep} onChange={() => set((a) => ({ ...a, doorstep: !a.doorstep }))} />
        </div>
        <div className="flex justify-end px-4 py-2 text-sm font-semibold" style={{ backgroundColor: "#f3f6f8", color: C.navy }}>
          <span className="w-16 text-center">Push</span>
        </div>
        {DOORSTEP_ALERTS.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: C.border }}>
            <span className="text-sm" style={{ color: C.navy }}>
              {r.label}
            </span>
            <OnOff
              label={r.label}
              on={prefs.doorstep && prefs.push[r.id]}
              disabled={!prefs.doorstep}
              onChange={() => set((a) => ({ ...a, push: { ...a.push, [r.id]: !a.push[r.id] } }))}
            />
          </div>
        ))}
      </section>

      <p className="text-xs px-4 pt-4" style={{ color: C.muted }}>
        All alerts start off. Turn on the ones you want. You can change them anytime. Standard text message rates may apply.
      </p>
    </div>
  );
}

function Home({ s, openAlerts }: { s: DemoState; openAlerts: () => void }) {
  const a = s.attendant;
  const [reason, setReason] = useState(REASONS[0]);
  const door = s.doors[RESIDENT_UNIT];
  const mine = s.callbacks.filter((c) => c.unit === RESIDENT_UNIT);
  const openCb = mine.find((c) => c.status === "open");
  const lastDone = [...mine].reverse().find((c) => c.status === "done");
  const onsite = a.status === "onsite";
  const meta = STATUS_META[a.status];

  const callBack = () =>
    update((st) => ({
      ...st,
      callbacks: [...st.callbacks, { id: uid(), unit: RESIDENT_UNIT, reason, createdAt: Date.now(), status: "open" }],
    }));

  const anyAlert = s.alerts.doorstep && Object.values(s.alerts.push).some(Boolean);

  return (
      <div className="flex-1 p-4 space-y-4">
        {/* Attendant status: the hero of the resident app */}
        <div className="rounded-3xl p-5 text-center space-y-2" style={{ backgroundColor: meta.bg }}>
          <div className="flex justify-center">
            <StatusDot status={a.status} size={18} />
          </div>
          <div className="font-heading text-xl" style={{ color: meta.color }}>
            {meta.label}
          </div>
          <div className="text-sm text-gray-600">{statusDetail(a)}</div>
          <div className="flex justify-center gap-1.5 pt-2">
            {(["enroute", "onsite", "done"] as const).map((k, i) => {
              const order = ["off", "enroute", "onsite", "done"].indexOf(a.status);
              return (
                <span
                  key={k}
                  className="h-1.5 w-10 rounded-full"
                  style={{ backgroundColor: order > i ? meta.color : "rgba(0,0,0,0.1)" }}
                />
              );
            })}
          </div>
        </div>

        {/* Tonight at my door */}
        <Card className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
              Tonight at your door
            </div>
            <div className="font-semibold mt-0.5">
              {!door || door.status === "pending"
                ? `Set trash out by 7:00 PM`
                : door.status === "done"
                  ? `Picked up at ${fmtTime(door.at)}`
                  : `Not collected: ${door.violation}`}
            </div>
          </div>
          {door?.status === "done" && <IconCheck size={28} style={{ color: C.green }} />}
          {door?.status === "violation" && <IconAlertTriangle size={28} style={{ color: C.red }} />}
          {(!door || door.status === "pending") && <IconClock size={28} style={{ color: C.muted }} />}
        </Card>

        {/* Violation notice */}
        {door?.status === "violation" && !openCb && (
          <Card style={{ borderColor: "#fecaca", backgroundColor: "#fff7f7" }} className="space-y-3">
            <div className="flex items-center gap-2 font-semibold" style={{ color: C.red }}>
              <IconAlertTriangle size={18} /> Your trash couldn&apos;t be collected
            </div>
            <div className="flex gap-3">
              <PhotoThumb src={door.photo} alt="Attendant photo" className="w-24 h-24 shrink-0" />
              <div className="text-sm space-y-1">
                <div>
                  <b>Reason:</b> {door.violation}
                </div>
                {door.note && <div className="text-gray-600">&ldquo;{door.note}&rdquo;</div>}
                <div className="text-xs" style={{ color: C.muted }}>
                  Reported {fmtTime(door.at)} by {a.name}
                </div>
              </div>
            </div>
            {onsite && <div className="text-sm">Fix it and tap <b>Call attendant back</b> below. We&apos;re still on property.</div>}
          </Card>
        )}

        {/* Callback */}
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <IconPhoneCall size={20} style={{ color: C.teal }} />
            <div className="font-heading text-lg" style={{ color: C.navy }}>
              Call attendant back
            </div>
            {onsite && (
              <span className="ml-auto">
                <Pill color={C.green} bg="#dcfce7">
                  Unlimited tonight
                </Pill>
              </span>
            )}
          </div>

          {openCb ? (
            <div className="rounded-xl p-4 space-y-1" style={{ backgroundColor: "#fdf3ec" }}>
              <div className="font-semibold" style={{ color: C.accent }}>
                {a.name.split(" ")[0]} has been notified
              </div>
              <div className="text-sm text-gray-700">
                Requested {fmtTime(openCb.createdAt)} · {openCb.reason}. Please have your bag at the door.
              </div>
            </div>
          ) : onsite ? (
            <>
              <p className="text-sm text-gray-600">
                Missed us? Your attendant is on property right now and will swing back to your door.
              </p>
              <div className="flex flex-wrap gap-2">
                {REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold border"
                    style={reason === r ? { backgroundColor: C.teal, color: "#fff", borderColor: C.teal } : { borderColor: C.border }}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <Btn className="w-full" onClick={callBack}>
                Call attendant back to {RESIDENT_UNIT}
              </Btn>
            </>
          ) : (
            <p className="text-sm text-gray-600 flex gap-2">
              <IconInfoCircle size={18} className="shrink-0 mt-0.5" style={{ color: C.muted }} />
              Callbacks open while your attendant is on property. {a.status === "done" ? "Next service is tomorrow, 7:00 – 9:00 PM." : "We'll notify you when they arrive."}
            </p>
          )}

          {lastDone && !openCb && (
            <div className="text-sm flex items-center gap-2" style={{ color: C.green }}>
              <IconCheck size={16} /> Last callback picked up at {fmtTime(lastDone.doneAt)}
            </div>
          )}
        </Card>

        {/* Community messages */}
        {s.broadcasts.length > 0 && (
          <Card className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: C.navy }}>
              <IconSpeakerphone size={18} /> From your leasing office
            </div>
            {[...s.broadcasts].reverse().map((b) => (
              <div key={b.id} className="text-sm border-l-4 pl-3" style={{ borderColor: C.teal }}>
                {b.text}
                <div className="text-xs mt-0.5" style={{ color: C.muted }}>
                  {fmtTime(b.at)}
                </div>
              </div>
            ))}
          </Card>
        )}

        <Card className="text-sm space-y-1.5">
          <div className="font-semibold" style={{ color: C.navy }}>
            Pickup guidelines
          </div>
          <div className="text-gray-600">• Trash out between 6:00 and 7:00 PM, Sunday – Thursday</div>
          <div className="text-gray-600">• Tie bags and keep them under 25 lb</div>
          <div className="text-gray-600">• Break down boxes. Recycling goes in clear bags</div>
          <div className="text-gray-600">• Furniture and large items: ask your leasing office for a bulk pickup</div>
        </Card>

        {!anyAlert && (
          <button onClick={openAlerts} className="w-full text-left">
            <Card className="flex items-center gap-3">
              <IconBell size={22} style={{ color: C.teal }} />
              <span className="flex-1 text-sm">
                <b>Get notified</b> when your attendant arrives, when your trash is picked up, or if there&apos;s a problem.
              </span>
              <span className="text-sm font-semibold" style={{ color: C.teal }}>
                Set up
              </span>
            </Card>
          </button>
        )}

        <div className="text-center">
          <ResetButton />
        </div>
      </div>
  );
}
