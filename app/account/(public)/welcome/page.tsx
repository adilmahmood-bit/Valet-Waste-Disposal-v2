import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PASSWORD_MIN, requireCustomer } from "@/lib/residential/portal-auth";
import CreatePasswordForm from "./CreatePasswordForm";

export const metadata: Metadata = { title: "Create your password" };

// Every customer must have a password. The first time they sign in (with an emailed link),
// /account sends them here before showing the portal.
export default async function WelcomePage() {
  const customer = await requireCustomer();
  if (customer.password_set_at) redirect("/account");
  const first = customer.name.replace(/\s*\(.*\)\s*/, "").split(" ")[0] || "there";
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold">Welcome, {first}</h1>
      <p className="mt-3 text-slate-700">
        Create a password for your account. Next time, sign in with <strong>{customer.email}</strong> and this password.
      </p>
      <CreatePasswordForm email={customer.email} minLength={PASSWORD_MIN} />
    </div>
  );
}
