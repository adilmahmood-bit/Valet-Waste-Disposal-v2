"use client";
import { useState } from "react";
import { IconTruckLoading, IconPhoneCall, IconCheck } from "@tabler/icons-react";
import { useDemo, update, fmtTime, BulkRequest, PROPERTY, now } from "@/lib/demo/store";
import { AppHeader, AttendantBanner, Btn, C, Card, PhoneApp, PhotoThumb, Pill, ResetButton } from "@/components/demo/ui";

export default function Dispatch() {
  const s = useDemo();
  const queue = s.bulk.filter((b) => b.status !== "completed" && b.status !== "declined");
  return (
    <PhoneApp>
      <AppHeader title="Dispatch" subtitle="Valet Waste Disposal office" />
      <div className="flex-1 p-4 space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
          {PROPERTY.name}
        </div>
        <AttendantBanner a={s.attendant} />

        <div className="flex items-center gap-2 font-heading" style={{ color: C.navy }}>
          <IconTruckLoading size={20} /> Bulk pickup requests
        </div>
        {queue.length === 0 && (
          <Card className="text-sm" style={{ color: C.muted }}>
            No open requests. Submit one from the Property Manager Portal.
          </Card>
        )}
        {queue.map((b) => (
          <QuoteCard key={b.id} b={b} />
        ))}

        <div className="flex items-center gap-2 font-heading pt-2" style={{ color: C.navy }}>
          <IconPhoneCall size={20} /> Resident callbacks
        </div>
        <Card className="space-y-2">
          {s.callbacks.length === 0 && (
            <div className="text-sm" style={{ color: C.muted }}>
              None tonight.
            </div>
          )}
          {s.callbacks.map((c) => (
            <div key={c.id} className="flex justify-between text-sm">
              <span>
                <b>{c.unit}</b> · {c.reason} · {fmtTime(c.createdAt)}
              </span>
              {c.status === "done" ? (
                <Pill color={C.green} bg="#dcfce7">
                  Done {fmtTime(c.doneAt)}
                </Pill>
              ) : (
                <Pill color={C.accent} bg="#fdf3ec">
                  With attendant
                </Pill>
              )}
            </div>
          ))}
        </Card>

        <div className="text-center">
          <ResetButton />
        </div>
      </div>
    </PhoneApp>
  );
}

function QuoteCard({ b }: { b: BulkRequest }) {
  const [amount, setAmount] = useState("185");
  const [day, setDay] = useState("Tomorrow, 10 AM – 2 PM");
  const [note, setNote] = useState("2 crew, 1 trailer load, disposal included.");
  const patch = (p: Partial<BulkRequest>) => update((st) => ({ ...st, bulk: st.bulk.map((x) => (x.id === b.id ? { ...x, ...p } : x)) }));

  return (
    <Card className="space-y-3">
      <div className="flex gap-3">
        <PhotoThumb src={b.photo} alt={b.category} className="w-24 h-24 shrink-0" />
        <div className="text-sm min-w-0">
          <div className="font-semibold">{b.category}</div>
          <div className="text-gray-600">{b.location}</div>
          {b.notes && <div className="text-gray-500 text-xs">{b.notes}</div>}
          <div className="text-xs mt-1" style={{ color: C.muted }}>
            From Dana K. · {fmtTime(b.createdAt)}
          </div>
        </div>
      </div>

      {b.status === "submitted" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative w-28">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full rounded-xl border p-3 pl-6 text-sm font-semibold"
                style={{ borderColor: C.border }}
              />
            </div>
            <input value={day} onChange={(e) => setDay(e.target.value)} className="flex-1 rounded-xl border p-3 text-sm" style={{ borderColor: C.border }} />
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-xl border p-3 text-sm" style={{ borderColor: C.border }} />
          <Btn className="w-full" disabled={!amount} onClick={() => patch({ status: "quoted", quote: Number(amount), scheduledFor: day, quoteNote: note })}>
            Send quote to property manager
          </Btn>
        </div>
      )}
      {b.status === "quoted" && (
        <div className="text-sm" style={{ color: C.muted }}>
          Quote sent: <b>${b.quote}</b>. Waiting on manager approval…
        </div>
      )}
      {b.status === "approved" && (
        <div className="flex items-center gap-3">
          <div className="text-sm flex-1" style={{ color: C.green }}>
            Approved ${b.quote} · {b.scheduledFor}
          </div>
          <Btn className="!py-2 flex items-center gap-1" onClick={() => patch({ status: "completed", completedAt: now() })}>
            <IconCheck size={16} /> Mark removed
          </Btn>
        </div>
      )}
    </Card>
  );
}
