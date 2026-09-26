"use client";
import { useRef, useState } from "react";
import {
  IconQrcode,
  IconCamera,
  IconMapPin,
  IconCheck,
  IconAlertTriangle,
  IconBellRinging,
  IconClock,
  IconLogout,
  IconX,
} from "@tabler/icons-react";
import {
  useDemo,
  update,
  PROPERTY,
  unitsFor,
  ALL_UNITS,
  progress,
  fmtTime,
  readPhoto,
  ViolationType,
  DemoState,
} from "@/lib/demo/store";
import { AppHeader, AttendantBanner, Btn, C, Card, PhoneApp, PhotoThumb, Pill, ResetButton } from "@/components/demo/ui";

const T = {
  en: {
    start: "Clock in & start shift",
    arrive: "Check in at property",
    geo: "You're within 40 m of",
    scan: "Scan door QR",
    progress: "Tonight's route",
    callbacks: "Resident callbacks",
    pickedUp: "Picked up",
    violation: "Report violation",
    checkout: "Check out of property",
    finishBldg: "Finish building",
    building: "Building",
    floor: "Floor",
    photo: "Add photo",
    save: "Save violation",
    shiftDone: "Shift complete",
    clockedIn: "Clocked in",
  },
  es: {
    start: "Marcar entrada e iniciar turno",
    arrive: "Registrar llegada",
    geo: "Estás a menos de 40 m de",
    scan: "Escanear QR de la puerta",
    progress: "Ruta de esta noche",
    callbacks: "Solicitudes de residentes",
    pickedUp: "Recogido",
    violation: "Reportar infracción",
    checkout: "Registrar salida",
    finishBldg: "Terminar edificio",
    building: "Edificio",
    floor: "Piso",
    photo: "Agregar foto",
    save: "Guardar infracción",
    shiftDone: "Turno completo",
    clockedIn: "Entrada",
  },
};

const VIOLATIONS: ViolationType[] = ["Not bagged", "Bag leaking", "Oversized item", "Out after cutoff", "Recycling mixed"];

function markDone(unit: string, photo?: string) {
  update((s) => ({ ...s, doors: { ...s.doors, [unit]: { status: "done", at: Date.now(), photo } } }));
}

export default function PorterApp() {
  const s = useDemo();
  const t = T[s.lang];
  const a = s.attendant;
  const bldg = a.building ?? "A";
  const [sheet, setSheet] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const p = progress(s);
  const openCallbacks = s.callbacks.filter((c) => c.status === "open");

  const selectBldg = (b: string) => update((st) => ({ ...st, attendant: { ...st.attendant, building: b } }));

  const scan = () => {
    const next = PROPERTY.floors.flatMap((f) => unitsFor(bldg, f)).find((u) => !s.doors[u] || s.doors[u].status === "pending");
    if (!next) return;
    setScanning(true);
    setTimeout(() => {
      markDone(next);
      setScanning(false);
    }, 900);
  };

  const finishBuilding = () =>
    update((st) => {
      const doors = { ...st.doors };
      for (const f of PROPERTY.floors)
        for (const u of unitsFor(bldg, f)) if (!doors[u] || doors[u].status === "pending") doors[u] = { status: "done", at: Date.now() };
      return { ...st, doors };
    });

  return (
    <PhoneApp>
      <AppHeader
        title="Attendant"
        subtitle={`${a.name} · ${PROPERTY.name}`}
        right={
          <button
            onClick={() => update((st) => ({ ...st, lang: st.lang === "en" ? "es" : "en" }))}
            className="rounded-full px-3 py-1 text-xs font-bold border border-white/30"
          >
            {s.lang === "en" ? "ES" : "EN"}
          </button>
        }
      />

      <div className="flex-1 p-4 space-y-4">
        <AttendantBanner a={a} />

        {a.status === "off" && (
          <Card className="space-y-3 text-center py-8">
            <IconClock size={40} className="mx-auto" style={{ color: C.teal }} />
            <div className="font-heading text-xl" style={{ color: C.navy }}>
              {PROPERTY.name}
            </div>
            <div className="text-sm" style={{ color: C.muted }}>
              Service window {PROPERTY.window} · {ALL_UNITS.length} doors
            </div>
            <Btn
              className="w-full"
              onClick={() => update((st) => ({ ...st, attendant: { ...st.attendant, status: "enroute", clockIn: Date.now() } }))}
            >
              {t.start}
            </Btn>
          </Card>
        )}

        {a.status === "enroute" && (
          <Card className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: C.green }}>
              <IconMapPin size={18} /> {t.geo} {PROPERTY.name}
            </div>
            <div className="h-32 rounded-xl relative overflow-hidden" style={{ backgroundColor: "#e6f6f7" }}>
              <div className="absolute inset-6 rounded-full border-2 border-dashed" style={{ borderColor: C.teal }} />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="block w-4 h-4 rounded-full animate-ping absolute" style={{ backgroundColor: C.teal, opacity: 0.4 }} />
                <span className="block w-4 h-4 rounded-full relative border-2 border-white" style={{ backgroundColor: C.teal }} />
              </span>
            </div>
            <div className="text-xs" style={{ color: C.muted }}>
              {t.clockedIn} {fmtTime(a.clockIn)}
            </div>
            <Btn
              className="w-full"
              onClick={() =>
                update((st) => ({ ...st, attendant: { ...st.attendant, status: "onsite", checkIn: Date.now(), building: bldg } }))
              }
            >
              {t.arrive}
            </Btn>
          </Card>
        )}

        {a.status === "onsite" && (
          <>
            {openCallbacks.length > 0 && (
              <Card style={{ borderColor: C.accent, backgroundColor: "#fdf3ec" }} className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: C.accent }}>
                  <IconBellRinging size={18} className="animate-bounce" /> {t.callbacks} ({openCallbacks.length})
                </div>
                {openCallbacks.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 bg-white rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold">{c.unit}</div>
                      <div className="text-xs" style={{ color: C.muted }}>
                        {c.reason} · {fmtTime(c.createdAt)}
                      </div>
                    </div>
                    <Btn
                      variant="accent"
                      className="!py-2"
                      onClick={() =>
                        update((st) => ({
                          ...st,
                          callbacks: st.callbacks.map((x) => (x.id === c.id ? { ...x, status: "done", doneAt: Date.now() } : x)),
                          doors: { ...st.doors, [c.unit]: { status: "done", at: Date.now() } },
                        }))
                      }
                    >
                      {t.pickedUp}
                    </Btn>
                  </div>
                ))}
              </Card>
            )}

            <Card className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{t.progress}</span>
                <span style={{ color: C.muted }}>
                  {p.done}/{p.total}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${p.pct}%`, backgroundColor: C.teal }} />
              </div>
            </Card>

            <div className="grid grid-cols-3 gap-2">
              {PROPERTY.buildings.map((b) => {
                const units = PROPERTY.floors.flatMap((f) => unitsFor(b, f));
                const d = units.filter((u) => s.doors[u] && s.doors[u].status !== "pending").length;
                const active = b === bldg;
                return (
                  <button
                    key={b}
                    onClick={() => selectBldg(b)}
                    className="rounded-xl py-2 text-sm font-semibold border"
                    style={{
                      backgroundColor: active ? C.navy : "#fff",
                      color: active ? "#fff" : C.navy,
                      borderColor: active ? C.navy : C.border,
                    }}
                  >
                    {t.building} {b}
                    <div className="text-[11px] font-normal opacity-70">
                      {d}/{units.length}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Btn onClick={scan} className="flex items-center justify-center gap-2">
                <IconQrcode size={18} /> {t.scan}
              </Btn>
              <Btn variant="ghost" onClick={finishBuilding}>
                {t.finishBldg} {bldg}
              </Btn>
            </div>

            {PROPERTY.floors.map((f) => (
              <div key={f}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: C.muted }}>
                  {t.building} {bldg} · {t.floor} {f}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {unitsFor(bldg, f).map((u) => {
                    const d = s.doors[u];
                    const st = d?.status ?? "pending";
                    const style =
                      st === "done"
                        ? { backgroundColor: "#dcfce7", color: C.green, borderColor: "#bbf7d0" }
                        : st === "violation"
                          ? { backgroundColor: "#fee2e2", color: C.red, borderColor: "#fecaca" }
                          : { backgroundColor: "#fff", color: C.ink, borderColor: C.border };
                    return (
                      <button key={u} onClick={() => setSheet(u)} className="rounded-lg border py-2 text-xs font-semibold relative" style={style}>
                        {u.slice(2)}
                        {st === "done" && <IconCheck size={12} className="absolute top-0.5 right-0.5" />}
                        {st === "violation" && <IconAlertTriangle size={12} className="absolute top-0.5 right-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <Btn
              variant="navy"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => update((st) => ({ ...st, attendant: { ...st.attendant, status: "done", checkOut: Date.now() } }))}
            >
              <IconLogout size={18} /> {t.checkout}
            </Btn>
          </>
        )}

        {a.status === "done" && (
          <Card className="text-center py-8 space-y-2">
            <IconCheck size={40} className="mx-auto" style={{ color: C.green }} />
            <div className="font-heading text-xl" style={{ color: C.navy }}>
              {t.shiftDone}
            </div>
            <div className="text-sm" style={{ color: C.muted }}>
              {p.done} of {p.total} doors · {s.callbacks.filter((c) => c.status === "done").length} callbacks ·{" "}
              {Object.values(s.doors).filter((d) => d.status === "violation").length} violations
            </div>
            <div className="text-xs" style={{ color: C.muted }}>
              {fmtTime(a.clockIn)} – {fmtTime(a.checkOut)}
            </div>
          </Card>
        )}

        <div className="text-center pt-2">
          <ResetButton />
        </div>
      </div>

      {scanning && (
        <div className="fixed inset-0 z-40 bg-black/70 flex flex-col items-center justify-center text-white gap-4">
          <div className="w-56 h-56 rounded-2xl border-4 relative overflow-hidden" style={{ borderColor: C.tealSoft }}>
            <IconQrcode size={120} className="absolute inset-0 m-auto opacity-60" />
            <div className="absolute left-0 right-0 h-1 animate-[scanline_0.9s_ease-in-out]" style={{ backgroundColor: C.tealSoft, top: "50%" }} />
          </div>
          <div className="text-sm">Scanning door QR…</div>
        </div>
      )}

      {sheet && <DoorSheet unit={sheet} s={s} t={t} onClose={() => setSheet(null)} />}
    </PhoneApp>
  );
}

function DoorSheet({ unit, s, t, onClose }: { unit: string; s: DemoState; t: (typeof T)["en"]; onClose: () => void }) {
  const [mode, setMode] = useState<"menu" | "violation">("menu");
  const [type, setType] = useState<ViolationType>("Not bagged");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);
  const d = s.doors[unit];

  const onFile = async (f?: File) => {
    if (f) setPhoto(await readPhoto(f));
  };

  return (
    <div className="fixed inset-0 z-30 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-[430px] bg-white rounded-t-3xl p-5 space-y-4"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center">
          <div className="font-heading text-2xl" style={{ color: C.navy }}>
            {unit}
          </div>
          {d?.status === "done" && (
            <Pill color={C.green} bg="#dcfce7">
              Picked up {fmtTime(d.at)}
            </Pill>
          )}
          {d?.status === "violation" && (
            <Pill color={C.red} bg="#fee2e2">
              {d.violation}
            </Pill>
          )}
          <button onClick={onClose} className="ml-auto p-1" aria-label="Close">
            <IconX size={22} />
          </button>
        </div>

        {mode === "menu" ? (
          <div className="grid gap-2">
            <Btn
              className="flex items-center justify-center gap-2"
              onClick={() => {
                markDone(unit);
                onClose();
              }}
            >
              <IconCheck size={18} /> {t.pickedUp}
            </Btn>
            <Btn variant="danger" className="flex items-center justify-center gap-2" onClick={() => setMode("violation")}>
              <IconAlertTriangle size={18} /> {t.violation}
            </Btn>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {VIOLATIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => setType(v)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold border"
                  style={type === v ? { backgroundColor: C.red, color: "#fff", borderColor: C.red } : { borderColor: C.border }}
                >
                  {v}
                </button>
              ))}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note for resident (optional)"
              className="w-full rounded-xl border p-3 text-sm"
              style={{ borderColor: C.border }}
              rows={2}
            />
            <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            <div className="flex items-center gap-3">
              <Btn variant="ghost" onClick={() => fileRef.current?.click()} className="flex items-center gap-2">
                <IconCamera size={18} /> {t.photo}
              </Btn>
              {photo && <PhotoThumb src={photo} alt="Violation" className="w-14 h-14" />}
            </div>
            <Btn
              variant="danger"
              className="w-full !bg-red-700 !text-white"
              onClick={() => {
                update((st) => ({
                  ...st,
                  doors: { ...st.doors, [unit]: { status: "violation", at: Date.now(), violation: type, note, photo } },
                }));
                onClose();
              }}
            >
              {t.save}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
