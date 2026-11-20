"use client";
import { useActionState, useState } from "react";
import { savePassword } from "./actions";

export default function PasswordSettings({ email, hasPassword, minLength }: { email: string; hasPassword: boolean; minLength: number }) {
  const [state, action, pending] = useActionState(savePassword, null);
  const [open, setOpen] = useState(false);
  const showForm = open && !state?.done;

  return (
    <section className="rounded-2xl bg-white border border-slate-200 p-5">
      <h2 className="text-lg font-bold">Password</h2>
      <p className="mt-2 text-slate-700">
        You sign in with your email and password. Forgot it? Use &ldquo;Email me a sign-in link&rdquo; on the sign-in page, then set a new one.
      </p>
      {state?.done && (
        <p className="mt-3 rounded-xl bg-green-50 border border-green-200 p-3 text-green-900" role="status">
          Password saved. We signed out your other devices and emailed you a confirmation.
        </p>
      )}

      {showForm ? (
        <form action={action} className="mt-4 space-y-3 max-w-sm">
          {/* Lets password managers save the right account. */}
          <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
          <label htmlFor="new-password" className="block text-sm font-semibold">New password</label>
          <input id="new-password" name="password" type="password" required minLength={minLength} autoComplete="new-password" className="w-full rounded-xl border border-slate-300 px-4 py-3" />
          <label htmlFor="confirm-password" className="block text-sm font-semibold">Type it again</label>
          <input id="confirm-password" name="confirm" type="password" required minLength={minLength} autoComplete="new-password" className="w-full rounded-xl border border-slate-300 px-4 py-3" />
          <p className="text-sm text-slate-600">At least {minLength} characters. A short phrase is easy to remember.</p>
          {state?.error && <p className="text-sm text-red-700" role="alert">{state.error}</p>}
          <div className="flex gap-3">
            <button disabled={pending} className="rounded-full bg-res-teal-dark hover:bg-res-teal text-white font-semibold px-5 py-2.5 disabled:opacity-60">
              {pending ? "Saving…" : "Save password"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full px-4 py-2.5 font-semibold text-res-teal-dark">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={() => setOpen(true)} className="rounded-full border-2 border-res-navy px-5 py-2 font-semibold hover:bg-res-navy hover:text-white">
            {hasPassword ? "Change password" : "Add a password"}
          </button>
        </div>
      )}
    </section>
  );
}
