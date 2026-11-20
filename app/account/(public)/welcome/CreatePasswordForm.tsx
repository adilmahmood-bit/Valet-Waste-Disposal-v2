"use client";
import { useActionState } from "react";
import { createPassword } from "@/app/account/actions";

export default function CreatePasswordForm({ email, minLength }: { email: string; minLength: number }) {
  const [state, action, pending] = useActionState(createPassword, null);
  return (
    <form action={action} className="mt-6 space-y-3">
      {/* Lets password managers save the right account. */}
      <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
      <label htmlFor="new-password" className="block text-sm font-semibold">Password</label>
      <input id="new-password" name="password" type="password" required minLength={minLength} autoComplete="new-password" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3" />
      <label htmlFor="confirm-password" className="block text-sm font-semibold">Type it again</label>
      <input id="confirm-password" name="confirm" type="password" required minLength={minLength} autoComplete="new-password" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3" />
      <p className="text-sm text-slate-600">At least {minLength} characters. A short phrase is easy to remember.</p>
      {state?.error && <p className="text-sm text-red-700" role="alert">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-full bg-res-teal-dark hover:bg-res-teal text-white font-semibold py-3 disabled:opacity-60">
        {pending ? "Saving…" : "Save password and continue"}
      </button>
    </form>
  );
}
