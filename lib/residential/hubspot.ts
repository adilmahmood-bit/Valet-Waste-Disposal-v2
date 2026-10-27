import { propertyTypeLabel, sourceLabel, accessFlagLabel } from "@/config/residential";
import { db, must, type AddressRow, type CustomerRow, type WaitlistRow } from "./db";

// HubSpot is the master record for residential contacts and the sales pipeline. Every write
// goes to res_hubspot_log and is read back, because writes in this portal sometimes fail
// without an error. A write that can't be verified is flagged in the admin for a retry.

const API = "https://api.hubapi.com";
const PIPELINE_LABEL = "Residential";

export const STAGE_FOR_STATUS: Record<string, string> = {
  waitlist: "Waitlist",
  quote_needed: "Quote Needed",
  signed_up: "Signed Up",
  active: "Active",
  paused: "Paused",
  cancelled: "Cancelled",
};

// HubSpot-defined association type IDs.
const ASSOC = { dealToContact: 3, noteToContact: 202, taskToContact: 204 };

export const hubspotConfigured = () => !!process.env.HUBSPOT_TOKEN;

type LogCtx = { operation: string; objectType: string; localRef: string };

class HubSpotError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

async function log(ctx: LogCtx, entry: Partial<{ objectId: string; request: unknown; status: number; response: unknown; verified: boolean; error: string }>) {
  await db().from("res_hubspot_log").insert({
    operation: ctx.operation,
    object_type: ctx.objectType,
    local_ref: ctx.localRef,
    object_id: entry.objectId ?? null,
    request: entry.request ?? null,
    status: entry.status ?? null,
    response: entry.response ?? null,
    verified: entry.verified ?? null,
    error: entry.error ?? null,
  });
}

// One HTTP call to HubSpot, retried once on rate limits, server errors and network failures.
async function call<T = Record<string, unknown>>(method: string, path: string, body?: unknown): Promise<{ status: number; json: T }> {
  const token = process.env.HUBSPOT_TOKEN;
  if (!token) throw new HubSpotError("HUBSPOT_TOKEN is not set");
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${API}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
      });
      const text = await res.text();
      const json = (text ? JSON.parse(text) : {}) as T;
      if ((res.status === 429 || res.status >= 500) && attempt === 0) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      if (!res.ok) throw new HubSpotError(`${method} ${path} -> ${res.status}: ${text.slice(0, 500)}`, res.status);
      return { status: res.status, json };
    } catch (e) {
      if (e instanceof HubSpotError || attempt > 0) throw e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

// A write followed by a read-back check. Logs both; returns the object id.
async function writeAndVerify(
  ctx: LogCtx,
  method: string,
  path: string,
  body: unknown,
  verify: (id: string) => Promise<string | null>, // returns a mismatch description, or null when it checks out
  idFromResponse: (json: Record<string, unknown>) => string,
) {
  let id = "";
  try {
    const { status, json } = await call(method, path, body);
    id = idFromResponse(json);
    const mismatch = await verify(id);
    await log(ctx, { objectId: id, request: body, status, response: json, verified: !mismatch, error: mismatch ?? undefined });
    if (mismatch) throw new HubSpotError(`Read-back failed: ${mismatch}`);
    return id;
  } catch (e) {
    if (!(e instanceof HubSpotError && e.message.startsWith("Read-back"))) {
      await log(ctx, { objectId: id || undefined, request: body, verified: false, error: String(e instanceof Error ? e.message : e) });
    }
    throw e;
  }
}

type HsObject = { id: string; properties: Record<string, string | null>; associations?: Record<string, { results: { id: string }[] }> };

const getObject = (type: string, id: string, props: string[], assoc?: string) =>
  call<HsObject>("GET", `/crm/v3/objects/${type}/${id}?properties=${props.join(",")}${assoc ? `&associations=${assoc}` : ""}`).then((r) => r.json);

// Compare the properties HubSpot stored with what we sent.
function diff(sent: Record<string, string>, stored: Record<string, string | null>) {
  const bad = Object.entries(sent).filter(([k, v]) => String(stored[k] ?? "") !== String(v ?? ""));
  return bad.length ? bad.map(([k, v]) => `${k}: sent "${v}", stored "${stored[k] ?? ""}"`).join("; ") : null;
}

// ---------- Pipeline ----------

let stageCache: Record<string, string> | null = null;
let pipelineId: string | null = null;

async function stages() {
  if (stageCache && pipelineId) return { pipelineId, stageCache };
  const { json } = await call<{ results: { id: string; label: string; stages: { id: string; label: string }[] }[] }>("GET", "/crm/v3/pipelines/deals");
  const p = json.results.find((r) => r.label === PIPELINE_LABEL);
  if (!p) throw new HubSpotError(`No "${PIPELINE_LABEL}" deal pipeline. Run: node scripts/hubspot-setup.mjs`);
  pipelineId = p.id;
  stageCache = Object.fromEntries(p.stages.map((s) => [s.label, s.id]));
  return { pipelineId, stageCache };
}

// ---------- Contacts ----------

type ContactInput = {
  email: string;
  name: string;
  mobile?: string | null;
  street?: string | null;
  city?: string | null;
  zip?: string | null;
  source?: string | null;
  referralCode?: string | null;
  propertyType?: string | null;
};

function contactProps(c: ContactInput) {
  const [firstname, ...rest] = c.name.trim().split(/\s+/);
  const props: Record<string, string> = {
    email: c.email,
    firstname,
    lastname: rest.join(" "),
    customer_type: "Residential",
  };
  if (c.mobile) props.mobilephone = c.mobile;
  if (c.street) props.address = c.street;
  if (c.city) props.city = c.city;
  if (c.zip) props.zip = c.zip;
  if (c.source) props.res_lead_source = sourceLabel(c.source);
  if (c.referralCode) props.res_referral_code = c.referralCode;
  if (c.propertyType) props.res_property_type = propertyTypeLabel(c.propertyType);
  return props;
}

async function findContactByEmail(email: string) {
  const { json } = await call<{ results: { id: string }[] }>("POST", "/crm/v3/objects/contacts/search", {
    filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }],
    properties: ["email"],
    limit: 1,
  });
  return json.results[0]?.id ?? null;
}

export async function upsertContact(c: ContactInput, localRef: string, knownId?: string | null) {
  const props = contactProps(c);
  const id = knownId || (await findContactByEmail(c.email));
  const verify = async (cid: string) => diff(props, (await getObject("contacts", cid, Object.keys(props))).properties);
  const ctx = { operation: id ? "update" : "create", objectType: "contact", localRef };
  return id
    ? writeAndVerify(ctx, "PATCH", `/crm/v3/objects/contacts/${id}`, { properties: props }, verify, () => id)
    : writeAndVerify(ctx, "POST", "/crm/v3/objects/contacts", { properties: props }, verify, (j) => String(j.id));
}

// Pull contact edits made in HubSpot (the master) back into the site database.
export async function pullContacts() {
  const rows = must(await db().from("res_customers").select("id, hubspot_contact_id").not("hubspot_contact_id", "is", null)) as Pick<CustomerRow, "id" | "hubspot_contact_id">[];
  let updated = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { json } = await call<{ results: HsObject[] }>("POST", "/crm/v3/objects/contacts/batch/read", {
      properties: ["email", "firstname", "lastname", "mobilephone"],
      inputs: batch.map((r) => ({ id: r.hubspot_contact_id })),
    });
    for (const hs of json.results) {
      const row = batch.find((r) => r.hubspot_contact_id === hs.id);
      if (!row) continue;
      const p = hs.properties;
      const name = [p.firstname, p.lastname].filter(Boolean).join(" ");
      const patch: Record<string, string> = {};
      if (name) patch.name = name;
      if (p.mobilephone) patch.mobile = p.mobilephone;
      if (p.email) patch.email = p.email.toLowerCase();
      if (Object.keys(patch).length) {
        const { error } = await db().from("res_customers").update(patch).eq("id", row.id);
        if (!error) updated++;
      }
    }
  }
  await db().from("res_app_state").upsert({ key: "hubspot_last_pull", value: { at: new Date().toISOString(), updated }, updated_at: new Date().toISOString() });
  return updated;
}

// ---------- Deals ----------

type DealInput = {
  name: string;
  stageKey: string;
  contactId: string;
  amount?: number | null;
  extra?: Record<string, string>;
};

export async function upsertDeal(d: DealInput, localRef: string, knownId?: string | null) {
  const { pipelineId: pipeline, stageCache: stageIds } = await stages();
  const stage = stageIds[STAGE_FOR_STATUS[d.stageKey]];
  if (!stage) throw new HubSpotError(`Stage "${STAGE_FOR_STATUS[d.stageKey]}" missing in the Residential pipeline`);
  const props: Record<string, string> = { dealname: d.name, pipeline, dealstage: stage, ...d.extra };
  if (d.amount != null) props.amount = String(d.amount);

  const verify = async (id: string) => {
    const deal = await getObject("deals", id, Object.keys(props), "contacts");
    const linked = deal.associations?.contacts?.results.some((r) => r.id === d.contactId);
    return diff(props, deal.properties) ?? (linked ? null : `deal not linked to contact ${d.contactId}`);
  };

  if (knownId) {
    // Re-assert the contact link on updates too; it is idempotent.
    await call("PUT", `/crm/v4/objects/deals/${knownId}/associations/default/contacts/${d.contactId}`);
    return writeAndVerify({ operation: "update", objectType: "deal", localRef }, "PATCH", `/crm/v3/objects/deals/${knownId}`, { properties: props }, verify, () => knownId);
  }
  const body = {
    properties: props,
    associations: [{ to: { id: d.contactId }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: ASSOC.dealToContact }] }],
  };
  return writeAndVerify({ operation: "create", objectType: "deal", localRef }, "POST", "/crm/v3/objects/deals", body, verify, (j) => String(j.id));
}

// ---------- Notes and tasks ----------

async function engagement(type: "notes" | "tasks", props: Record<string, string>, contactId: string, assocId: number, localRef: string) {
  const body = {
    properties: props,
    associations: [{ to: { id: contactId }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: assocId }] }],
  };
  const check = type === "notes" ? ["hs_note_body"] : ["hs_task_subject"];
  const verify = async (id: string) => {
    const o = await getObject(type, id, check, "contacts");
    const linked = o.associations?.contacts?.results.some((r) => r.id === contactId);
    return diff(Object.fromEntries(check.map((k) => [k, props[k]])), o.properties) ?? (linked ? null : "not linked to contact");
  };
  return writeAndVerify({ operation: "create", objectType: type.slice(0, -1), localRef }, "POST", `/crm/v3/objects/${type}`, body, verify, (j) => String(j.id));
}

export const addNote = (contactId: string, text: string, localRef: string) =>
  engagement("notes", { hs_note_body: text, hs_timestamp: new Date().toISOString() }, contactId, ASSOC.noteToContact, localRef);

export function addTask(contactId: string, subject: string, body: string, localRef: string) {
  const props: Record<string, string> = {
    hs_task_subject: subject,
    hs_task_body: body,
    hs_task_status: "NOT_STARTED",
    hs_task_priority: "HIGH",
    hs_timestamp: new Date().toISOString(),
  };
  if (process.env.HUBSPOT_OWNER_ID) props.hubspot_owner_id = process.env.HUBSPOT_OWNER_ID;
  return engagement("tasks", props, contactId, ASSOC.taskToContact, localRef);
}

// ---------- Form submissions ----------

export type FormContext = { hutk?: string; pageUri?: string; pageName?: string; ipAddress?: string };

// Records the sign-up, waitlist or quote as a HubSpot form submission, so it shows in
// HubSpot's form reports with page and source tracking. The CRM writes above stay the
// source of truth; a skipped or failed submission is logged, not fatal.
export async function submitForm(form: "signup" | "waitlist" | "quote", fields: Record<string, string>, context: FormContext, localRef: string) {
  const guid = process.env[`HUBSPOT_FORM_${form.toUpperCase()}`];
  const portal = process.env.HUBSPOT_PORTAL_ID;
  const ctx = { operation: "submit", objectType: `form:${form}`, localRef };
  if (!guid || !portal) {
    await log(ctx, { verified: false, error: `skipped: HUBSPOT_FORM_${form.toUpperCase()} not set` });
    return;
  }
  const body = {
    fields: Object.entries(fields).filter(([, v]) => v).map(([name, value]) => ({ objectTypeId: "0-1", name, value })),
    context: Object.fromEntries(Object.entries(context).filter(([, v]) => v)),
  };
  try {
    const res = await fetch(`https://api.hsforms.com/submissions/v3/integration/secure/submit/${portal}/${guid}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    await log(ctx, { request: body, status: res.status, response: text ? JSON.parse(text) : null, verified: res.ok, error: res.ok ? undefined : text.slice(0, 500) });
  } catch (e) {
    await log(ctx, { request: body, verified: false, error: String(e) });
  }
}

// ---------- Sync entry points (idempotent: safe to retry from the admin) ----------

// The failure itself is already in res_hubspot_log (the admin shows it with a retry button).
function setSyncError(localRef: string, e: unknown) {
  console.error(`[hubspot] ${localRef}:`, e);
}

const fmtFlags = (flags: string[]) => flags.map(accessFlagLabel).join(", ");

export async function syncCustomer(customerId: string) {
  if (!hubspotConfigured()) return;
  const localRef = `customer:${customerId}`;
  try {
    const customer = must(await db().from("res_customers").select("*").eq("id", customerId).single()) as CustomerRow;
    const addresses = must(await db().from("res_addresses").select("*").eq("customer_id", customerId).order("created_at")) as AddressRow[];
    const subs = must(await db().from("res_subscriptions").select("address_id, plan, price").in("address_id", addresses.map((a) => a.id))) as { address_id: string; plan: string; price: number }[];
    const first = addresses[0];

    const contactId = await upsertContact(
      {
        email: customer.email,
        name: customer.name,
        mobile: customer.mobile,
        street: first?.street,
        city: first?.city,
        zip: first?.zip,
        source: customer.source,
        referralCode: customer.referral_code,
        propertyType: customer.property_type,
      },
      localRef,
      customer.hubspot_contact_id,
    );
    await db().from("res_customers").update({ hubspot_contact_id: contactId, hubspot_synced_at: new Date().toISOString() }).eq("id", customerId);

    for (const a of addresses) {
      const sub = subs.find((s) => s.address_id === a.id);
      const dealId = await upsertDeal(
        {
          name: `Residential: ${a.street}, ${a.zip}`,
          stageKey: a.status,
          contactId,
          amount: sub?.price ?? null,
          extra: {
            res_service_address: `${a.street}, ${a.city} ${a.zip}`,
            res_trash_day: a.trash_day,
            res_bins: String(a.bins),
            res_plan: sub?.plan ?? "",
            res_access_flags: fmtFlags(a.access_flags),
            res_site_address_id: a.id,
          },
        },
        `address:${a.id}`,
        a.hubspot_deal_id,
      );
      if (dealId !== a.hubspot_deal_id) await db().from("res_addresses").update({ hubspot_deal_id: dealId }).eq("id", a.id);
    }
    return contactId;
  } catch (e) {
    setSyncError(localRef, e);
  }
}

export async function syncWaitlist(waitlistId: string) {
  if (!hubspotConfigured()) return;
  const localRef = `waitlist:${waitlistId}`;
  try {
    const w = must(await db().from("res_waitlist").select("*").eq("id", waitlistId).single()) as WaitlistRow;
    const contactId = await upsertContact(
      { email: w.email, name: w.name, mobile: w.mobile, street: w.address, zip: w.zip, source: w.source, referralCode: w.referral_code },
      localRef,
      w.hubspot_contact_id,
    );
    const dealId = await upsertDeal(
      { name: `Residential waitlist: ${w.zip}`, stageKey: "waitlist", contactId, extra: { res_service_address: w.address ?? "" } },
      localRef,
      w.hubspot_deal_id,
    );
    await db().from("res_waitlist").update({ hubspot_contact_id: contactId, hubspot_deal_id: dealId }).eq("id", waitlistId);
  } catch (e) {
    setSyncError(localRef, e);
  }
}

// Retry whatever a log entry's local_ref points at.
export async function retrySync(localRef: string) {
  const [kind, id] = localRef.split(":");
  if (kind === "customer") return syncCustomer(id);
  if (kind === "waitlist") return syncWaitlist(id);
  if (kind === "address") {
    const a = must(await db().from("res_addresses").select("customer_id").eq("id", id).single()) as { customer_id: string };
    return syncCustomer(a.customer_id);
  }
}

export const hubspotRecordUrl = (type: "contact" | "deal", id: string) =>
  `https://app-na2.hubspot.com/contacts/${process.env.HUBSPOT_PORTAL_ID ?? ""}/record/${type === "contact" ? "0-1" : "0-3"}/${id}`;
