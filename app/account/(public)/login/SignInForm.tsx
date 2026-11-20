"use client";
import { useActionState } from "react";
import { sendLink } from "@/app/account/actions";

export default function SignInForm() {
  const [state, action, pending] = useActionState(sendLink, null);

  if (state?.sent)
    return (
      <div className="mt-6 rounded-2xl bg-res-mist p-5" role="status">
        <p className="font-semibold">Check your email.</p>
        <p className="mt-1 text-slate-700">
          If that email is on a Doorstep Disposal account, a sign-in link is on its way. It expires in 30 minutes.
          Not seeing it? Check your spam folder, or call or text us.
        </p>
      </div>
    );

  return (
    <form action={action} className="mt-4 space-y-3">
      <label htmlFor="email" className="block text-sm font-semibold">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
      />
      {state?.error && <p className="text-sm text-red-700" role="alert">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-full border-2 border-res-navy font-semibold py-2.5 hover:bg-res-navy hover:text-white disabled:opacity-60">
        {pending ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
