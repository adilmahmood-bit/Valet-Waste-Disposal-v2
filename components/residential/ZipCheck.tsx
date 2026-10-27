"use client";
import { useState } from "react";
import Link from "next/link";
import { isServiceZip } from "@/config/residential";
import WaitlistForm from "./WaitlistForm";

export default function ZipCheck({ plan, dark = false }: { plan?: string; dark?: boolean }) {
  const [zip, setZip] = useState("");
  const [checked, setChecked] = useState<string | null>(null);
  const [hint, setHint] = useState(false);

  const valid = /^\d{5}$/.test(zip);
  const inArea = checked ? isServiceZip(checked) : false;
  const signupHref = `/residential/signup?zip=${checked}${plan ? `&plan=${plan}` : ""}`;

  return (
    <div id="check" className="scroll-mt-24">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setHint(!valid);
          if (valid) setChecked(zip);
        }}
        className="flex gap-2"
      >
        <label htmlFor="zip-check" className="sr-only">Your ZIP code</label>
        <input
          id="zip-check"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          placeholder="Your ZIP code"
          value={zip}
          onChange={(e) => {
            setZip(e.target.value.replace(/\D/g, ""));
            setChecked(null);
            setHint(false);
          }}
          className="flex-1 min-w-0 rounded-full border-2 border-slate-300 bg-white px-5 py-3 text-base text-res-navy focus:border-res-teal focus:outline-none"
        />
        <button
          type="submit"
          className={`shrink-0 rounded-full bg-res-teal-dark px-6 py-3 font-semibold text-white transition-colors ${dark ? "hover:bg-res-teal" : "hover:bg-res-navy"}`}
        >
          Check
        </button>
      </form>
      {hint && (
        <p className={`mt-2 text-sm ${dark ? "text-white/80" : "text-slate-600"}`} role="alert">
          Enter your 5-digit ZIP code.
        </p>
      )}

      {checked && inArea && (
        <div className={`mt-4 rounded-2xl p-4 ${dark ? "bg-white/10" : "bg-res-mist"}`} role="status">
          <p className="font-semibold">Good news: we serve {checked}.</p>
          <Link href={signupHref} className="mt-3 inline-block rounded-full bg-res-teal-dark px-6 py-3 font-semibold text-white hover:bg-res-navy">
            Start sign-up
          </Link>
        </div>
      )}

      {checked && !inArea && (
        <div className={`mt-4 rounded-2xl p-4 ${dark ? "bg-white/10" : "bg-res-mist"}`} role="status">
          <p className="font-semibold">We don&apos;t serve {checked} yet.</p>
          <p className="text-sm mt-1 opacity-90">Join the waitlist. We&apos;ll reach out when we start in your area.</p>
          <WaitlistForm zip={checked} dark={dark} />
        </div>
      )}
    </div>
  );
}
