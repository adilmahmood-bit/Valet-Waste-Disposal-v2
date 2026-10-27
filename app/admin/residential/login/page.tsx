import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/residential/admin-auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin/residential");
  return (
    <div className="max-w-sm mx-auto mt-16 rounded-2xl bg-white border border-slate-200 p-6">
      <h1 className="text-xl font-semibold">Admin login</h1>
      <LoginForm />
    </div>
  );
}
