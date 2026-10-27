"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { residential, enabledPlans, planPrice, isServiceZip, quoteRequiredFlags } from "@/config/residential";
import WaitlistForm from "./WaitlistForm";

type Form = {
  street: string;
  city: string;
  zip: string;
  trashDay: string;
  bins: number;
  accessFlags: string[];
  gateCode: string;
  accessNotes: string;
  propertyType: string;
  plan: string;
  name: string;
  mobile: string;
  email: string;
  source: string;
  referralCode: string;
  termsAccepted: boolean;
};

const STEPS = ["Address", "Service", "Plan", "Contact", "Terms"];
// Kept in this tab so a host can add another property without retyping their details.
const CONTACT_KEY = "vwd_res_contact";

function savedContact(addAnother?: boolean): Partial<Form> {
  if (!addAnother || typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(CONTACT_KEY) ?? "null") ?? {};
  } catch {
    return {};
  }
}

const input = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-res-teal focus:outline-none";
const label = "block text-sm font-semibold mb-1.5";

export default function SignupFlow(props: { zip?: string; plan?: string; source?: string; referralCode?: string; addAnother?: boolean }) {
  const router = useRouter();
  const plans = enabledPlans();
  const [step, setStep] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  // Contact details restored for "add another property" only render on the Contact step,
  // so the server and first client render still match.
  const [f, setF] = useState<Form>(() => ({
    street: "",
    city: "",
    zip: props.zip ?? "",
    trashDay: "",
    bins: 3,
    accessFlags: [],
    gateCode: "",
    accessNotes: "",
    propertyType: "",
    plan: plans.some((p) => p.id === props.plan) ? props.plan! : plans[0].id,
    name: "",
    mobile: "",
    email: "",
    source: props.source ?? "",
    referralCode: props.referralCode ?? "",
    termsAccepted: false,
    ...savedContact(props.addAnother),
  }));
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  const zipOk = /^\d{5}$/.test(f.zip);
  const outOfArea = zipOk && !isServiceZip(f.zip);
  const quoteFlags = quoteRequiredFlags(f.accessFlags);
  const needsQuote = quoteFlags.length > 0;
  const selectedPlan = plans.find((p) => p.id === f.plan)!;

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0 });
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    const res = await fetch("/api/residential/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, termsVersion: residential.terms.version, pageUri: location.href }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (!res?.ok) {
      setError(data?.error ?? `Something went wrong. Please call or text ${residential.contact.phone}.`);
      setSending(false);
      return;
    }
    try {
      sessionStorage.setItem(
        CONTACT_KEY,
        JSON.stringify({ name: f.name, mobile: f.mobile, email: f.email, propertyType: f.propertyType, source: f.source, referralCode: f.referralCode }),
      );
    } catch {}
    const q = new URLSearchParams({ status: data.status, day: f.trashDay, name: f.name.split(" ")[0] });
    if (data.startDate) q.set("start", data.startDate);
    router.push(`/residential/thanks?${q}`);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 md:py-14">
      <h1 className="text-3xl font-bold">{props.addAnother ? "Add another property" : "Sign up"}</h1>

      <ol className="mt-6 flex gap-1.5" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= step ? "bg-res-teal" : "bg-slate-200"}`} />
            <span className={`mt-1.5 block text-[11px] sm:text-xs ${i === step ? "font-semibold" : "text-slate-500"}`} aria-current={i === step ? "step" : undefined}>
              {s}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <form onSubmit={next} className="mt-8 space-y-4">
          <div>
            <label htmlFor="street" className={label}>Street address</label>
            <input id="street" required autoComplete="address-line1" value={f.street} onChange={(e) => set("street", e.target.value)} className={input} />
          </div>
          <div className="grid grid-cols-[1fr_8rem] gap-3">
            <div>
              <label htmlFor="city" className={label}>City</label>
              <input id="city" required autoComplete="address-level2" value={f.city} onChange={(e) => set("city", e.target.value)} className={input} />
            </div>
            <div>
              <label htmlFor="zip" className={label}>ZIP</label>
              <input
                id="zip"
                required
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                pattern="\d{5}"
                value={f.zip}
                onChange={(e) => set("zip", e.target.value.replace(/\D/g, ""))}
                className={input}
              />
            </div>
          </div>
          {!outOfArea && <StepButtons />}
        </form>
      )}

      {step === 0 && outOfArea && (
        <div className="mt-4 rounded-2xl bg-res-mist p-4" role="status">
          <p className="font-semibold">We don&apos;t serve {f.zip} yet.</p>
          <p className="text-sm mt-1">Join the waitlist and we&apos;ll reach out when we start in your area.</p>
          <WaitlistForm zip={f.zip} />
        </div>
      )}

      {step === 1 && (
        <form onSubmit={next} className="mt-8 space-y-5">
          <div>
            <label htmlFor="trashDay" className={label}>Trash pickup day</label>
            <select id="trashDay" required value={f.trashDay} onChange={(e) => set("trashDay", e.target.value)} className={input}>
              <option value="">Choose a day</option>
              {residential.serviceDays.map((d) => (
                <option key={d} value={d}>{({ Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday" } as const)[d]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="bins" className={label}>Number of bins</label>
            <select id="bins" value={f.bins} onChange={(e) => set("bins", Number(e.target.value))} className={input}>
              {Array.from({ length: residential.bins.max - residential.bins.min + 1 }, (_, i) => residential.bins.min + i).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <fieldset>
            <legend className={label}>Anything we should know about access?</legend>
            <div className="space-y-2">
              {residential.accessFlags.map((a) => (
                <label key={a.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 cursor-pointer has-[:checked]:border-res-teal has-[:checked]:bg-res-mist">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[#137F8C]"
                    checked={f.accessFlags.includes(a.id)}
                    onChange={(e) => set("accessFlags", e.target.checked ? [...f.accessFlags, a.id] : f.accessFlags.filter((x) => x !== a.id))}
                  />
                  {a.label}
                </label>
              ))}
            </div>
          </fieldset>
          {f.accessFlags.includes("gate_code") && (
            <div>
              <label htmlFor="gateCode" className={label}>Gate code</label>
              <input id="gateCode" required autoComplete="off" value={f.gateCode} onChange={(e) => set("gateCode", e.target.value)} className={input} />
              <p className="mt-1 text-xs text-slate-500">Stored encrypted. Only our office and the person servicing your home can see it.</p>
            </div>
          )}
          <div>
            <label htmlFor="notes" className={label}>Where are your bins? Any notes?</label>
            <textarea id="notes" rows={3} placeholder="Side yard, left of the garage" value={f.accessNotes} onChange={(e) => set("accessNotes", e.target.value)} className={input} />
          </div>
          <div>
            <label htmlFor="ptype" className={label}>Property type</label>
            <select id="ptype" required value={f.propertyType} onChange={(e) => set("propertyType", e.target.value)} className={input}>
              <option value="">Choose one</option>
              {residential.propertyTypes.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          {needsQuote && (
            <p className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm" role="status">
              Because of the {quoteFlags.map((q) => q.label.toLowerCase()).join(" and ")}, we&apos;ll text you a custom price before your service starts.
            </p>
          )}
          <StepButtons onBack={back} />
        </form>
      )}

      {step === 2 && (
        <form onSubmit={next} className="mt-8 space-y-3">
          <p className="text-slate-600">Prices for {f.bins} {f.bins === 1 ? "bin" : "bins"}{needsQuote ? ". Your final price may differ after we look at access." : "."}</p>
          {plans.map((p) => (
            <label key={p.id} className="flex items-start gap-3 rounded-2xl border-2 border-slate-200 p-4 cursor-pointer has-[:checked]:border-res-teal has-[:checked]:bg-res-mist">
              <input type="radio" name="plan" className="mt-1 h-5 w-5 accent-[#137F8C]" checked={f.plan === p.id} onChange={() => set("plan", p.id)} />
              <span className="flex-1">
                <span className="flex justify-between gap-3 font-semibold">
                  <span>{p.name}{p.mostPopular && <span className="ml-2 rounded-full bg-res-teal-dark text-white text-[11px] px-2 py-0.5 align-middle">Most popular</span>}</span>
                  <span className="whitespace-nowrap">${planPrice(p, f.bins)}{p.billing === "monthly" ? "/mo" : ""}</span>
                </span>
                <span className="block text-sm text-slate-600 mt-1">{p.blurb}</span>
              </span>
            </label>
          ))}
          <StepButtons onBack={back} />
        </form>
      )}

      {step === 3 && (
        <form onSubmit={next} className="mt-8 space-y-4">
          <div>
            <label htmlFor="name" className={label}>Your name</label>
            <input id="name" required autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} className={input} />
          </div>
          <div>
            <label htmlFor="mobile" className={label}>Mobile number</label>
            <input id="mobile" required type="tel" autoComplete="tel" value={f.mobile} onChange={(e) => set("mobile", e.target.value)} className={input} />
            <p className="mt-1 text-xs text-slate-500">We text you about your service.</p>
          </div>
          <div>
            <label htmlFor="email" className={label}>Email</label>
            <input id="email" required type="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} className={input} />
          </div>
          <div>
            <label htmlFor="source" className={label}>How did you hear about us? <span className="font-normal text-slate-500">(optional)</span></label>
            <select id="source" value={residential.sources.some((s) => s.id === f.source) ? f.source : ""} onChange={(e) => set("source", e.target.value)} className={input}>
              <option value="">Choose one</option>
              {residential.sources.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ref" className={label}>Referral code <span className="font-normal text-slate-500">(optional)</span></label>
            <input id="ref" autoComplete="off" value={f.referralCode} onChange={(e) => set("referralCode", e.target.value)} className={input} />
          </div>
          <StepButtons onBack={back} />
        </form>
      )}

      {step === 4 && (
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div className="rounded-2xl bg-res-mist p-5 text-sm space-y-1.5">
            <p className="font-semibold text-base">Your service</p>
            <p>{f.street}, {f.city} {f.zip}</p>
            <p>{selectedPlan.name}, {f.bins} {f.bins === 1 ? "bin" : "bins"}: ${planPrice(selectedPlan, f.bins)}{selectedPlan.billing === "monthly" ? " per month" : ""}{needsQuote ? " (custom quote to follow)" : ""}</p>
            <p>Trash day: {f.trashDay}</p>
          </div>
          <div className="text-sm text-slate-700 space-y-1.5">
            <p className="font-semibold text-base text-res-navy">The short version of the terms</p>
            <ul className="list-disc list-inside space-y-1">
              <li>We move your bins on your trash pickup day and follow holiday shifts.</li>
              <li>Monthly plans renew each month until you cancel.</li>
              <li>You give us safe access to your bins.</li>
              <li>Bulky items, bin cleaning and junk removal aren&apos;t included.</li>
            </ul>
            <p>
              <Link href="/residential/terms" target="_blank" className="font-semibold text-res-teal-dark underline underline-offset-4">Read the full Residential Service Terms</Link>
            </p>
          </div>
          <label className="flex items-start gap-3 rounded-xl border-2 border-slate-200 p-4 cursor-pointer has-[:checked]:border-res-teal">
            <input type="checkbox" required className="mt-0.5 h-5 w-5 accent-[#137F8C]" checked={f.termsAccepted} onChange={(e) => set("termsAccepted", e.target.checked)} />
            <span>I agree to the Residential Service Terms.</span>
          </label>
          {!residential.payments.enabled && !needsQuote && (
            <p className="text-sm text-slate-600">No card needed today. We&apos;ll text you to set up billing before your first visit.</p>
          )}
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={back} className="rounded-full border-2 border-slate-300 px-6 py-3 font-semibold">Back</button>
            <button type="submit" disabled={sending || !f.termsAccepted} className="flex-1 rounded-full bg-res-teal-dark px-6 py-3 font-semibold text-white hover:bg-res-navy disabled:opacity-60">
              {sending ? "Sending…" : needsQuote ? "Request my price" : "Sign up"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function StepButtons({ onBack }: { onBack?: () => void }) {
  return (
    <div className="flex gap-3 pt-2">
      {onBack && (
        <button type="button" onClick={onBack} className="rounded-full border-2 border-slate-300 px-6 py-3 font-semibold">Back</button>
      )}
      <button type="submit" className="flex-1 rounded-full bg-res-teal-dark px-6 py-3 font-semibold text-white hover:bg-res-navy">Continue</button>
    </div>
  );
}
