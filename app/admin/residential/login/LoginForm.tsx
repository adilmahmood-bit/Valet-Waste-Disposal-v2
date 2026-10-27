"use client";
import { useActionState } from "react";
import { login } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-4 space-y-3">
      <label htmlFor="password" className="block text-sm font-semibold">Password</label>
      <input id="password" name="password" type="password" required autoComplete="current-password" className="w-full rounded-xl border border-slate-300 px-4 py-3" />
      {state?.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-full bg-res-teal-dark text-white font-semibold py-3 disabled:opacity-60">
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
