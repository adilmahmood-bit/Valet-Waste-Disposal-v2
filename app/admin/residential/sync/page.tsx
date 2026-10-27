import { requireAdmin } from "@/lib/residential/admin-auth";
import { db, must } from "@/lib/residential/db";
import { hubspotConfigured } from "@/lib/residential/hubspot";
import { retryHubSpot, pullFromHubSpot } from "../actions";
import { btn, btnGhost, card, SetupNotice } from "../ui";

type LogRow = { id: number; at: string; operation: string; object_type: string; object_id: string | null; local_ref: string; status: number | null; verified: boolean | null; error: string | null };
type EmailRow = { id: number; at: string; to: string; subject: string; provider: string; status: string; body: string };

export default async function SyncPage() {
  await requireAdmin();
  let logs: LogRow[], emails: EmailRow[], lastPull: { at?: string; updated?: number } | null;
  try {
    [logs, emails, lastPull] = await Promise.all([
      db().from("res_hubspot_log").select("id, at, operation, object_type, object_id, local_ref, status, verified, error").order("at", { ascending: false }).limit(300).then(must) as Promise<LogRow[]>,
      db().from("res_email_log").select("id, at, to, subject, provider, status, body").order("at", { ascending: false }).limit(30).then(must) as Promise<EmailRow[]>,
      db().from("res_app_state").select("value").eq("key", "hubspot_last_pull").maybeSingle().then((r) => (r.data?.value ?? null)),
    ]);
  } catch (e) {
    return <SetupNotice error={e} />;
  }

  // A record needs attention when its latest CRM write (not form submission) didn't verify.
  const latest = new Map<string, LogRow>();
  for (const l of logs) {
    const key = `${l.local_ref}|${l.object_type}`;
    if (!l.object_type.startsWith("form:") && !latest.has(key)) latest.set(key, l);
  }
  const failing = [...latest.values()].filter((l) => !l.verified);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">HubSpot sync</h1>
      {!hubspotConfigured() && (
        <p className="rounded-xl bg-amber-100 text-amber-950 px-4 py-3 text-sm">HUBSPOT_TOKEN isn&apos;t set, so nothing is syncing yet.</p>
      )}

      <section className={`${card} p-4 flex flex-wrap items-center justify-between gap-3`}>
        <p className="text-sm">
          Contact edits last pulled from HubSpot: {lastPull?.at ? `${new Date(lastPull.at).toLocaleString("en-US", { timeZone: "America/Los_Angeles" })} (${lastPull.updated} updated)` : "never"}
        </p>
        <form action={pullFromHubSpot}><button className={btn}>Pull now</button></form>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Needs a retry ({failing.length})</h2>
        {failing.length === 0 && <p className={`${card} mt-2 p-4 text-sm text-slate-500`}>Every recent write was read back and verified.</p>}
        <ul className="mt-2 space-y-2">
          {failing.map((l) => (
            <li key={l.id} className={`${card} p-4 flex flex-wrap items-start justify-between gap-3`}>
              <div className="text-sm min-w-0">
                <p className="font-semibold">{l.object_type} {l.operation} · {l.local_ref}</p>
                <p className="text-slate-500 text-xs">{new Date(l.at).toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}</p>
                <p className="text-red-700 break-words mt-1">{l.error}</p>
              </div>
              <form action={retryHubSpot}>
                <input type="hidden" name="local_ref" value={l.local_ref} />
                <button className={btnGhost}>Retry</button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Recent HubSpot writes</h2>
        <div className={`${card} mt-2 overflow-x-auto`}>
          <table className="w-full text-xs">
            <thead className="bg-slate-100 text-left">
              <tr>{["Time", "Object", "Op", "HubSpot ID", "Ref", "HTTP", "Verified", "Error"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
            </thead>
            <tbody>
              {logs.slice(0, 60).map((l) => (
                <tr key={l.id} className="border-t border-slate-200">
                  <td className="px-3 py-1.5 whitespace-nowrap">{new Date(l.at).toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}</td>
                  <td className="px-3 py-1.5">{l.object_type}</td>
                  <td className="px-3 py-1.5">{l.operation}</td>
                  <td className="px-3 py-1.5">{l.object_id}</td>
                  <td className="px-3 py-1.5">{l.local_ref}</td>
                  <td className="px-3 py-1.5">{l.status}</td>
                  <td className="px-3 py-1.5">{l.verified ? "yes" : "no"}</td>
                  <td className="px-3 py-1.5 max-w-xs truncate" title={l.error ?? ""}>{l.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Recent emails</h2>
        <p className="text-xs text-slate-500">With no email provider set, emails are only logged here.</p>
        <ul className="mt-2 space-y-2">
          {emails.map((e) => (
            <li key={e.id} className={`${card} p-3 text-sm`}>
              <details>
                <summary className="cursor-pointer">
                  <span className="font-semibold">{e.subject}</span> → {e.to} · {e.provider}/{e.status} · {new Date(e.at).toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}
                </summary>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-slate-700">{e.body}</pre>
              </details>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
