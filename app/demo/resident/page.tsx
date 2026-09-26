"use client";
import { useState } from "react";
import { IconPhoneCall, IconCheck, IconAlertTriangle, IconSpeakerphone, IconInfoCircle, IconClock } from "@tabler/icons-react";
import { useDemo, update, uid, fmtTime, RESIDENT_UNIT, PROPERTY } from "@/lib/demo/store";
import { AppHeader, Btn, C, Card, PhoneApp, PhotoThumb, Pill, ResetButton, STATUS_META, StatusDot, statusDetail } from "@/components/demo/ui";

const REASONS = ["Missed pickup", "Fixed my violation", "Got home late", "Extra bag"];

export default function ResidentApp() {
  const s = useDemo();
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

  return (
    <PhoneApp>
      <AppHeader title={PROPERTY.name} subtitle={`Unit ${RESIDENT_UNIT} · Valet trash`} />

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

        <div className="text-center">
          <ResetButton />
        </div>
      </div>
    </PhoneApp>
  );
}
