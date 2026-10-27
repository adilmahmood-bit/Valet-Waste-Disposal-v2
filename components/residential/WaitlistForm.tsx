"use client";
import { useState } from "react";

export default function WaitlistForm({ zip, dark = false }: { zip: string; dark?: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/residential/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, zip, pageUri: location.href }),
    }).catch(() => null);
    if (res?.ok) return setState("done");
    setError((await res?.json().catch(() => null))?.error ?? "Something went wrong. Please call or text us.");
    setState("error");
  }

  if (state === "done") return <p className="mt-3 font-semibold">You&apos;re on the list. Thank you!</p>;

  const input = `w-full rounded-xl border px-4 py-3 text-base text-res-navy bg-white ${dark ? "border-white/30" : "border-slate-300"} focus:border-res-teal focus:outline-none`;
  return (
    <form onSubmit={submit} className="mt-3 grid gap-2">
      <input name="name" required placeholder="Name" autoComplete="name" className={input} aria-label="Name" />
      <input name="email" type="email" required placeholder="Email" autoComplete="email" className={input} aria-label="Email" />
      <input name="mobile" type="tel" placeholder="Mobile (optional)" autoComplete="tel" className={input} aria-label="Mobile" />
      <input name="address" placeholder="Street address (optional)" autoComplete="street-address" className={input} aria-label="Street address" />
      {state === "error" && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <button type="submit" disabled={state === "sending"} className="rounded-full bg-res-teal-dark px-5 py-3 font-semibold text-white hover:bg-res-navy disabled:opacity-60">
        {state === "sending" ? "Joining…" : "Join the waitlist"}
      </button>
    </form>
  );
}
