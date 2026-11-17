"use client";

import { useState } from "react";
import { IconCircleCheck } from "@tabler/icons-react";

const PHONE = "619-324-8875";
const input =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-base text-ink focus:border-teal focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/20";
const label = "block text-sm font-semibold text-ink mb-1.5";
const optional = <span className="font-normal text-muted">(optional)</span>;

// Homepage "Request a Free Quote" form. Posts to /api/quote, which emails Adil and writes the
// contact, note and task to HubSpot. Built on the site because HubSpot's embedded form sent
// real leads to its spam folder.
export default function QuoteForm() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, pageUri: location.href }),
    }).catch(() => null);
    if (res?.ok) {
      setState("done");
      return;
    }
    setError((await res?.json().catch(() => null))?.error ?? `Something went wrong. Please call us at ${PHONE}.`);
    setState("error");
  }

  if (state === "done") {
    return (
      <div className="py-10 text-center" role="status">
        <IconCircleCheck size={48} className="mx-auto text-teal" aria-hidden="true" />
        <p className="mt-3 text-xl font-bold text-ink">Thanks, we got it.</p>
        <p className="mt-2 text-ink-mid">
          We&apos;ll follow up today. Need us sooner? Call{" "}
          <a href={`tel:+1${PHONE.replace(/\D/g, "")}`} className="font-semibold text-teal whitespace-nowrap">{PHONE}</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="q-firstname" className={label}>First name</label>
          <input id="q-firstname" name="firstname" required autoComplete="given-name" className={input} />
        </div>
        <div>
          <label htmlFor="q-lastname" className={label}>Last name {optional}</label>
          <input id="q-lastname" name="lastname" autoComplete="family-name" className={input} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="q-email" className={label}>Email</label>
          <input id="q-email" name="email" type="email" required autoComplete="email" className={input} />
        </div>
        <div>
          <label htmlFor="q-phone" className={label}>Phone {optional}</label>
          <input id="q-phone" name="phone" type="tel" autoComplete="tel" className={input} />
        </div>
      </div>
      <div>
        <label htmlFor="q-address" className={label}>Property address</label>
        <input id="q-address" name="address" required autoComplete="street-address" className={input} />
      </div>
      <div>
        <label htmlFor="q-message" className={label}>Anything else? {optional}</label>
        <textarea id="q-message" name="message" rows={3} placeholder="Number of units, trash chutes, timing…" className={input} />
      </div>
      {/* Honeypot for bots: hidden from people and screen readers. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="q-website">Website</label>
        <input id="q-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state === "error" && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="btn-primary rounded-full px-6 py-3 font-semibold text-white disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Request my quote"}
      </button>
      <p className="text-xs text-muted">
        We use your details only to contact you about our service. See our{" "}
        <a href="/privacy" target="_blank" className="underline underline-offset-2">Privacy Notice</a>.
      </p>
    </form>
  );
}
