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
  isPlaceholder,
  now,
} from "@/lib/demo/store";
import {
  AppHeader,
  Btn,
  C,
  Card,
  LogoMark,
  PhoneApp,
  PhotoThumb,
  Pill,
  ResetButton,
  STATUS_META,
  STATUS_LABEL_ES,
  StatusDot,
  statusDetail,
} from "@/components/demo/ui";

type Lang = "en" | "es";

// Callback reasons and violation types are stored in English (that's what
// staff see); residents see them in their chosen language.
const REASONS = ["Missed pickup", "Fixed my violation", "Got home late", "Extra bag"];
const REASON_ES: Record<string, string> = {
  "Missed pickup": "No recogieron mi basura",
  "Fixed my violation": "Corregí mi infracción",
  "Got home late": "Llegué tarde",
  "Extra bag": "Bolsa adicional",
};
const VIOLATION_ES: Record<string, string> = {
  "Not in bin": "Fuera del contenedor",
  "Overflowing bin": "Contenedor desbordado",
  "Boxes not broken down": "Cajas sin desarmar",
  "Bag leaking": "Bolsa con fugas",
  "Oversized item": "Artículo demasiado grande",
  "Out after cutoff": "Sacada después de la hora límite",
  "Recycling mixed": "Reciclaje mezclado",
};
const ALERT_ES: Record<DoorstepAlert, string> = {
  setOut: "Comienza la hora de sacar la basura",
  hourBefore: "La recolección empieza en una hora",
  onProperty: "El asistente llega a la propiedad",
  lastCall: "Último aviso",
  violation: "Infracción en mi puerta",
  pickedUp: "Recogieron mi basura",
  callbackDone: "Solicitud de regreso completada",
  complete: "Servicio de la noche completo",
};

const T = {
  en: {
    unit: "Unit",
    sub: "Valet trash",
    alertsTitle: "Alerts & notifications",
    atDoor: "Tonight at your door",
    setOut: "Set trash out by 7:00 PM",
    pickedAt: (t: string) => `Picked up at ${t}`,
    notCollected: (v: string) => `Not collected: ${v}`,
    violTitle: "Your trash couldn't be collected",
    reason: "Reason",
    reportedBy: (t: string, n: string) => `Reported ${t} by ${n}`,
    fixIt: "Fix it and tap Call attendant back below. We're still on property.",
    callBack: "Call attendant back",
    unlimited: "Unlimited tonight",
    notified: (n: string) => `${n} has been notified`,
    requested: (t: string, r: string) => `Requested ${t} · ${r}. Please have your bag at the door.`,
    missedUs: "Missed us? Your attendant is on property right now and will swing back to your door.",
    callBackTo: (u: string) => `Call attendant back to ${u}`,
    openWhile: "Callbacks open while your attendant is on property.",
    nextTomorrow: "Next service is tomorrow, 7:00 – 9:00 PM.",
    notifyArrive: "We'll notify you when they arrive.",
    lastCb: (t: string) => `Last callback picked up at ${t}`,
    fromOffice: "From your leasing office",
    guidelines: "Pickup guidelines",
    rules: [
      "Trash out between 6:00 and 7:00 PM, Sunday – Thursday",
      "Tie bags and put them inside your valet bin, lid closed",
      "Break down boxes. Recycling goes in clear bags",
      "Furniture and large items: ask your leasing office for a bulk pickup",
    ],
    getNotified: "Get notified",
    getNotifiedBody: "when your attendant arrives, when your trash is picked up, or if there's a problem.",
    setUp: "Set up",
    commPrefs: "Communication Preferences",
    email: "Email",
    text: "Text",
    push: "Push",
    serviceRow: "Service updates and reminders",
    communityRow: "Leasing office announcements",
    doorstep: "Doorstep Collection Notifications",
    on: "On",
    off: "Off",
    footnote: "All alerts start off. Turn on the ones you want. You can change them anytime. Standard text message rates may apply.",
    now: "now",
    b: {
      here: ["Your attendant is here", (n: string) => `${n} is on property. Missed pickup? Tap to call them back.`] as const,
      complete: ["Service complete", () => "Tonight's valet trash service is finished. See you tomorrow."] as const,
      violation: ["Trash not collected", (v: string) => `${v}. Fix it and call your attendant back.`] as const,
      picked: ["Picked up ✓", (t: string) => `Your trash was collected at ${t}.`] as const,
      cb: ["Callback complete", (n: string, t: string) => `${n} picked up your trash at ${t}.`] as const,
      office: "From your leasing office",
    },
  },
  es: {
    unit: "Unidad",
    sub: "Basura a domicilio",
    alertsTitle: "Alertas y notificaciones",
    atDoor: "Esta noche en su puerta",
    setOut: "Saque la basura antes de las 7:00 PM",
    pickedAt: (t: string) => `Recogida a las ${t}`,
    notCollected: (v: string) => `No recogida: ${v}`,
    violTitle: "No pudimos recoger su basura",
    reason: "Motivo",
    reportedBy: (t: string, n: string) => `Reportado a las ${t} por ${n}`,
    fixIt: "Corríjalo y toque Pedir que regrese el asistente. Todavía estamos en la propiedad.",
    callBack: "Pedir que regrese el asistente",
    unlimited: "Ilimitado esta noche",
    notified: (n: string) => `${n} ya fue notificado`,
    requested: (t: string, r: string) => `Solicitado a las ${t} · ${r}. Tenga su bolsa en la puerta.`,
    missedUs: "¿No alcanzó a sacarla? Su asistente está en la propiedad ahora y regresará a su puerta.",
    callBackTo: (u: string) => `Pedir que regrese a ${u}`,
    openWhile: "Puede pedir que regrese mientras el asistente esté en la propiedad.",
    nextTomorrow: "El próximo servicio es mañana, 7:00 – 9:00 PM.",
    notifyArrive: "Le avisaremos cuando llegue.",
    lastCb: (t: string) => `Última solicitud recogida a las ${t}`,
    fromOffice: "De su oficina de arrendamiento",
    guidelines: "Reglas de recolección",
    rules: [
      "Saque la basura entre 6:00 y 7:00 PM, de domingo a jueves",
      "Amarre las bolsas y póngalas dentro de su contenedor, con la tapa cerrada",
      "Desarme las cajas. El reciclaje va en bolsas transparentes",
      "Muebles y artículos grandes: pida una recolección especial a su oficina",
    ],
    getNotified: "Reciba avisos",
    getNotifiedBody: "cuando llegue su asistente, cuando recojan su basura o si hay algún problema.",
    setUp: "Activar",
    commPrefs: "Preferencias de comunicación",
    email: "Correo",
    text: "Texto",
    push: "Push",
    serviceRow: "Avisos y recordatorios del servicio",
    communityRow: "Anuncios de la oficina",
    doorstep: "Notificaciones de recolección",
    on: "Sí",
    off: "No",
    footnote: "Todas las alertas empiezan apagadas. Active las que quiera y cámbielas cuando guste. Pueden aplicarse cargos por mensajes de texto.",
    now: "ahora",
    b: {
      here: ["Su asistente llegó", (n: string) => `${n} está en la propiedad. ¿No alcanzó? Toque para pedir que regrese.`] as const,
      complete: ["Servicio completo", () => "El servicio de esta noche terminó. Nos vemos mañana."] as const,
      violation: ["Basura no recogida", (v: string) => `${v}. Corríjalo y pida que regrese su asistente.`] as const,
      picked: ["Recogida ✓", (t: string) => `Su basura fue recogida a las ${t}.`] as const,
      cb: ["Solicitud completada", (n: string, t: string) => `${n} recogió su basura a las ${t}.`] as const,
      office: "De su oficina de arrendamiento",
    },
  },
};

const tReason = (r: string, l: Lang) => (l === "es" ? (REASON_ES[r] ?? r) : r);
const tViol = (v: string | undefined, l: Lang) => (v && l === "es" ? (VIOLATION_ES[v] ?? v) : (v ?? ""));

// Simulated push notifications: compare each new state to the last one and
// raise a banner only for alerts the resident has switched on.
function usePushBanners(s: DemoState) {
  const prev = useRef<DemoState | null>(null);
  const [banner, setBanner] = useState<{ id: number; title: string; body: string } | null>(null);

  useEffect(() => {
    if (isPlaceholder(s)) return;
    const p = prev.current;
    prev.current = s;
    if (!p) return;
    const l = s.residentLang;
    const b = T[l].b;
    const on = (k: DoorstepAlert) => s.alerts.doorstep && s.alerts.push[k];
    const show = (title: string, body: string) => setBanner({ id: Date.now(), title, body });
    const door = s.doors[RESIDENT_UNIT];
    const pDoor = p.doors[RESIDENT_UNIT];
    const first = s.attendant.name.split(" ")[0];

    if (s.attendant.status === "onsite" && p.attendant.status !== "onsite" && on("onProperty")) show(b.here[0], b.here[1](first));
    if (s.attendant.status === "done" && p.attendant.status !== "done" && on("complete")) show(b.complete[0], b.complete[1]());
    if (door?.status === "violation" && pDoor?.status !== "violation" && on("violation")) show(b.violation[0], b.violation[1](tViol(door.violation, l)));
    if (door?.status === "done" && pDoor?.status !== "done" && on("pickedUp")) show(b.picked[0], b.picked[1](fmtTime(door.at)));
    const doneNow = s.callbacks.find((c) => c.unit === RESIDENT_UNIT && c.status === "done" && p.callbacks.find((x) => x.id === c.id)?.status === "open");
    if (doneNow && on("callbackDone")) show(b.cb[0], b.cb[1](first, fmtTime(doneNow.doneAt)));
    if (s.broadcasts.length > p.broadcasts.length && s.alerts.comms && s.alerts.community.push) show(b.office, s.broadcasts[s.broadcasts.length - 1].text);
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
  const l = s.residentLang;
  const t = T[l];
  const [view, setView] = useState<"home" | "alerts">("home");
  const [banner, dismiss] = usePushBanners(s);
  const alertsOn = s.alerts.doorstep && Object.values(s.alerts.push).some(Boolean);

  return (
    <PhoneApp>
      <AppHeader
        title={view === "alerts" ? t.alertsTitle : PROPERTY.name}
        subtitle={`${t.unit} ${RESIDENT_UNIT} · ${t.sub}`}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => update((st) => ({ ...st, residentLang: st.residentLang === "en" ? "es" : "en" }))}
              className="rounded-full px-3 py-1 text-xs font-bold border border-white/30"
              aria-label={l === "en" ? "Cambiar a español" : "Switch to English"}
            >
              {l === "en" ? "ES" : "EN"}
            </button>
            <button
              onClick={() => setView(view === "home" ? "alerts" : "home")}
              className="relative rounded-full p-2 border border-white/30"
              aria-label={view === "home" ? "Alert settings" : "Back"}
            >
              {view === "home" ? <IconBell size={18} /> : <IconArrowLeft size={18} />}
              {view === "home" && alertsOn && <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: C.tealSoft }} />}
            </button>
          </div>
        }
      />
      {view === "home" ? <Home s={s} openAlerts={() => setView("alerts")} /> : <AlertSettings prefs={s.alerts} l={l} />}

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
              <span>{t.now}</span>
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

function OnOff({ on, onChange, disabled, label, text }: { on: boolean; onChange: () => void; disabled?: boolean; label: string; text: [string, string] }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      aria-pressed={on}
      aria-label={label}
      className="w-16 py-2 rounded-full text-xs font-semibold border transition disabled:opacity-35"
      style={on ? { backgroundColor: C.navy, color: "#fff", borderColor: C.navy } : { backgroundColor: "#fff", color: C.navy, borderColor: "#cbd5e1" }}
    >
      {on ? text[0] : text[1]}
    </button>
  );
}

function AlertSettings({ prefs, l }: { prefs: AlertPrefs; l: Lang }) {
  const t = T[l];
  const set = (fn: (a: AlertPrefs) => AlertPrefs) => update((st) => ({ ...st, alerts: fn(st.alerts) }));
  const channels: Channel[] = ["email", "text", "push"];
  const commRows = [
    { key: "service" as const, label: t.serviceRow, en: "Service updates and reminders" },
    { key: "community" as const, label: t.communityRow, en: "Leasing office announcements" },
  ];
  const onOff: [string, string] = [t.on, t.off];

  return (
    <div className="flex-1 pb-6">
      <section className="bg-white border-b" style={{ borderColor: C.border }}>
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <div className="font-heading text-lg" style={{ color: C.navy }}>
            {t.commPrefs}
          </div>
          <Toggle label="Communication preferences" on={prefs.comms} onChange={() => set((a) => ({ ...a, comms: !a.comms }))} />
        </div>
        <div className="grid grid-cols-[1fr_repeat(3,4.25rem)] items-center px-4 py-2 text-sm font-semibold" style={{ backgroundColor: "#f3f6f8", color: C.navy }}>
          <span />
          <span className="text-center">{t.email}</span>
          <span className="text-center">{t.text}</span>
          <span className="text-center">{t.push}</span>
        </div>
        {commRows.map((r) => (
          <div key={r.key} className="grid grid-cols-[1fr_repeat(3,4.25rem)] items-center px-4 py-3 border-t" style={{ borderColor: C.border }}>
            <span className="text-sm pr-2" style={{ color: C.navy }}>
              {r.label}
            </span>
            {channels.map((ch) => (
              <span key={ch} className="flex justify-center">
                <OnOff
                  label={`${r.en} by ${ch}`}
                  text={onOff}
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
            {t.doorstep}
          </div>
          <Toggle label="Doorstep collection notifications" on={prefs.doorstep} onChange={() => set((a) => ({ ...a, doorstep: !a.doorstep }))} />
        </div>
        <div className="flex justify-end px-4 py-2 text-sm font-semibold" style={{ backgroundColor: "#f3f6f8", color: C.navy }}>
          <span className="w-16 text-center">{t.push}</span>
        </div>
        {DOORSTEP_ALERTS.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 border-t" style={{ borderColor: C.border }}>
            <span className="text-sm" style={{ color: C.navy }}>
              {l === "es" ? ALERT_ES[r.id] : r.label}
            </span>
            <OnOff
              label={r.label}
              text={onOff}
              on={prefs.doorstep && prefs.push[r.id]}
              disabled={!prefs.doorstep}
              onChange={() => set((a) => ({ ...a, push: { ...a.push, [r.id]: !a.push[r.id] } }))}
            />
          </div>
        ))}
      </section>

      <p className="text-xs px-4 pt-4" style={{ color: C.muted }}>
        {t.footnote}
      </p>
    </div>
  );
}

function Home({ s, openAlerts }: { s: DemoState; openAlerts: () => void }) {
  const l = s.residentLang;
  const t = T[l];
  const a = s.attendant;
  const [reason, setReason] = useState(REASONS[0]);
  const door = s.doors[RESIDENT_UNIT];
  const mine = s.callbacks.filter((c) => c.unit === RESIDENT_UNIT);
  const openCb = mine.find((c) => c.status === "open");
  const lastDone = [...mine].reverse().find((c) => c.status === "done");
  const onsite = a.status === "onsite";
  const meta = STATUS_META[a.status];
  const anyAlert = s.alerts.doorstep && Object.values(s.alerts.push).some(Boolean);

  const callBack = () =>
    update((st) => ({
      ...st,
      callbacks: [...st.callbacks, { id: uid(), unit: RESIDENT_UNIT, reason, createdAt: now(), status: "open" }],
    }));

  return (
    <div className="flex-1 p-4 space-y-4">
      {/* Attendant status: the hero of the resident app */}
      <div className="rounded-3xl p-5 text-center space-y-2" style={{ backgroundColor: meta.bg }}>
        <div className="flex justify-center">
          <StatusDot status={a.status} size={18} />
        </div>
        <div className="font-heading text-xl" style={{ color: meta.color }}>
          {l === "es" ? STATUS_LABEL_ES[a.status] : meta.label}
        </div>
        <div className="text-sm text-gray-600">{statusDetail(a, l)}</div>
        <div className="flex justify-center gap-1.5 pt-2">
          {(["enroute", "onsite", "done"] as const).map((k, i) => {
            const order = ["off", "enroute", "onsite", "done"].indexOf(a.status);
            return <span key={k} className="h-1.5 w-10 rounded-full" style={{ backgroundColor: order > i ? meta.color : "rgba(0,0,0,0.1)" }} />;
          })}
        </div>
      </div>

      {/* Tonight at my door */}
      <Card className="flex items-center gap-3">
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
            {t.atDoor}
          </div>
          <div className="font-semibold mt-0.5">
            {!door || door.status === "pending" ? t.setOut : door.status === "done" ? t.pickedAt(fmtTime(door.at)) : t.notCollected(tViol(door.violation, l))}
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
            <IconAlertTriangle size={18} /> {t.violTitle}
          </div>
          <div className="flex gap-3">
            <PhotoThumb src={door.photo} alt="Attendant photo" className="w-24 h-24 shrink-0" />
            <div className="text-sm space-y-1">
              <div>
                <b>{t.reason}:</b> {tViol(door.violation, l)}
              </div>
              {door.note && <div className="text-gray-600">&ldquo;{door.note}&rdquo;</div>}
              <div className="text-xs" style={{ color: C.muted }}>
                {t.reportedBy(fmtTime(door.at), a.name)}
              </div>
            </div>
          </div>
          {onsite && <div className="text-sm">{t.fixIt}</div>}
        </Card>
      )}

      {/* Callback */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <IconPhoneCall size={20} style={{ color: C.teal }} />
          <div className="font-heading text-lg" style={{ color: C.navy }}>
            {t.callBack}
          </div>
          {onsite && (
            <span className="ml-auto">
              <Pill color={C.green} bg="#dcfce7">
                {t.unlimited}
              </Pill>
            </span>
          )}
        </div>

        {openCb ? (
          <div className="rounded-xl p-4 space-y-1" style={{ backgroundColor: "#fdf3ec" }}>
            <div className="font-semibold" style={{ color: C.accent }}>
              {t.notified(a.name.split(" ")[0])}
            </div>
            <div className="text-sm text-gray-700">{t.requested(fmtTime(openCb.createdAt), tReason(openCb.reason, l))}</div>
          </div>
        ) : onsite ? (
          <>
            <p className="text-sm text-gray-600">{t.missedUs}</p>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold border"
                  style={reason === r ? { backgroundColor: C.teal, color: "#fff", borderColor: C.teal } : { borderColor: C.border }}
                >
                  {tReason(r, l)}
                </button>
              ))}
            </div>
            <Btn className="w-full" onClick={callBack}>
              {t.callBackTo(RESIDENT_UNIT)}
            </Btn>
          </>
        ) : (
          <p className="text-sm text-gray-600 flex gap-2">
            <IconInfoCircle size={18} className="shrink-0 mt-0.5" style={{ color: C.muted }} />
            {t.openWhile} {a.status === "done" ? t.nextTomorrow : t.notifyArrive}
          </p>
        )}

        {lastDone && !openCb && (
          <div className="text-sm flex items-center gap-2" style={{ color: C.green }}>
            <IconCheck size={16} /> {t.lastCb(fmtTime(lastDone.doneAt))}
          </div>
        )}
      </Card>

      {/* Community messages */}
      {s.broadcasts.length > 0 && (
        <Card className="space-y-3">
          <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: C.navy }}>
            <IconSpeakerphone size={18} /> {t.fromOffice}
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
          {t.guidelines}
        </div>
        {t.rules.map((r) => (
          <div key={r} className="text-gray-600">
            • {r}
          </div>
        ))}
      </Card>

      {!anyAlert && (
        <button onClick={openAlerts} className="w-full text-left">
          <Card className="flex items-center gap-3">
            <IconBell size={22} style={{ color: C.teal }} />
            <span className="flex-1 text-sm">
              <b>{t.getNotified}</b> {t.getNotifiedBody}
            </span>
            <span className="text-sm font-semibold" style={{ color: C.teal }}>
              {t.setUp}
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
