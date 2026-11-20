"use client";
import { useActionState } from "react";
import { passwordSignIn } from "@/app/account/actions";

export default function PasswordForm() {
  const [state, action, pending] = useActionState(passwordSignIn, null);
  return (
    <form action={action} className="mt-6 space-y-3">
      <label htmlFor="pw-email" className="block text-sm font-semibold">Email</label>
      <input id="pw-email" name="email" type="email" required autoComplete="username" inputMode="email" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3" />
      <label htmlFor="pw-password" className="block text-sm font-semibold">Password</label>
      <input id="pw-password" name="password" type="password" required autoComplete="current-password" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3" />
      {state?.error && <p className="text-sm text-red-700" role="alert">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-full bg-res-teal-dark hover:bg-res-teal text-white font-semibold py-3 disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
