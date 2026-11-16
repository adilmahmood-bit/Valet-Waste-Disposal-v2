"use client";

import { useState } from "react";
import { IconCircleCheck } from "@tabler/icons-react";
import { residential } from "@/config/residential";

const input = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-res-teal focus:outline-none";
const label = "block text-sm font-semibold mb-1.5";
const optional = <span className="font-normal text-slate-500">(optional)</span>;

// The first step for new residential customers: a short "I'm interested" form that goes to
// HubSpot (see /api/residential/interest). We follow up by text or email, then send the full
// sign-up (/residential/signup/full) once they want to start.
// Only name, email, city and state are required.
export default function InterestForm({ zip, city, source, referralCode }: { zip?: string; city?: string; source?: string; referralCode?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const { contact } = residential;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/residential/interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, pageUri: location.href }),
    }).catch(() => null);
    if (res?.ok) {
      setState("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setError((await res?.json().catch(() => null))?.error ?? `Something went wrong. Please call or text us at ${contact.phone}.`);
    setState("error");
  }

  if (state === "done") {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 md:py-16">
        <IconCircleCheck size={48} className="text-res-teal-dark" aria-hidden="true" />
        <h1 className="mt-3 text-3xl font-bold">Thanks! We got your info.</h1>
        <p className="mt-3 text-slate-700">
          We&apos;ll reach out shortly to confirm we can serve your street, answer any questions and get you set up.
        </p>
        <p className="mt-3 text-slate-700">
          Want to talk sooner? Call or text us at{" "}
          <a href={`tel:${contact.phoneHref}`} className="font-semibold text-res-teal-dark whitespace-nowrap">{contact.phone}</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 md:py-14">
      <h1 className="text-3xl font-bold">Get started</h1>
      <p className="mt-2 text-slate-700">
        Tell us a little about you and we&apos;ll reach out to get your trash cans on our route. No payment needed now.
      </p>
      <form onSubmit={submit} className="mt-8 grid gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstname" className={label}>First name</label>
            <input id="firstname" name="firstname" required autoComplete="given-name" className={input} />
          </div>
          <div>
            <label htmlFor="lastname" className={label}>Last name</label>
            <input id="lastname" name="lastname" required autoComplete="family-name" className={input} />
          </div>
        </div>
        <div>
          <label htmlFor="email" className={label}>Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className={input} />
        </div>
        <div>
          <label htmlFor="city" className={label}>City</label>
          <input id="city" name="city" required defaultValue={city} autoComplete="address-level2" className={input} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="state" className={label}>State</label>
            <input id="state" name="state" required defaultValue="CA" autoComplete="address-level1" className={input} />
          </div>
          <div>
            <label htmlFor="zip" className={label}>ZIP {optional}</label>
            <input id="zip" name="zip" inputMode="numeric" maxLength={5} defaultValue={zip} autoComplete="postal-code" className={input} />
          </div>
        </div>
        <div>
          <label htmlFor="phone" className={label}>Phone {optional}</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className={input} />
        </div>
        <div>
          <label htmlFor="canLocation" className={label}>Where are your trash cans kept? {optional}</label>
          <input id="canLocation" name="canLocation" placeholder="Side yard, left of the garage" className={input} />
        </div>
        <div>
          <label htmlFor="source" className={label}>How did you hear about us? {optional}</label>
          <select id="source" name="source" defaultValue={residential.sources.some((s) => s.id === source) ? source : ""} className={input}>
            <option value="">Choose one</option>
            {residential.sources.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="referralCode" className={label}>Promo or referral code {optional}</label>
          <input id="referralCode" name="referralCode" defaultValue={referralCode} autoComplete="off" className={input} />
        </div>
        {state === "error" && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={state === "sending"}
          className="rounded-full bg-res-teal-dark px-6 py-3.5 text-lg font-semibold text-white hover:bg-res-navy disabled:opacity-60"
        >
          {state === "sending" ? "Sending…" : "Send"}
        </button>
        <p className="text-xs text-slate-500">
          We use your details only to contact you about our service. We don&apos;t sell your information. See our{" "}
          <a href="/privacy" target="_blank" className="underline underline-offset-2">Privacy Notice</a>.
        </p>
      </form>
    </div>
  );
}
