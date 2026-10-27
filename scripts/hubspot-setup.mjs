// One-time (safe to re-run) HubSpot setup for the residential service:
//   - contact and deal properties the site writes
//   - the "Residential" deal pipeline and its stages
//   - three forms (sign-up, waitlist, quote) for submission tracking
// Usage: node scripts/hubspot-setup.mjs   (reads HUBSPOT_TOKEN from .env.local)

import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const TOKEN = process.env.HUBSPOT_TOKEN;
if (!TOKEN) {
  console.error("HUBSPOT_TOKEN is missing from .env.local");
  process.exit(1);
}

async function hs(method, path, body) {
  const res = await fetch(`https://api.hubapi.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${json.message ?? text}`);
  return json;
}

const problems = [];
const step = async (label, fn) => {
  try {
    const out = await fn();
    console.log(`ok   ${label}${out ? `: ${out}` : ""}`);
  } catch (e) {
    problems.push(label);
    console.log(`FAIL ${label}: ${e.message}`);
  }
};

const text = (name, label) => ({ name, label, type: "string", fieldType: "text" });

const CONTACT_PROPS = [
  text("res_lead_source", "Residential lead source"),
  text("res_referral_code", "Residential referral code"),
  text("res_property_type", "Residential property type"),
];
const DEAL_PROPS = [
  text("res_service_address", "Service address"),
  text("res_trash_day", "Trash day"),
  { name: "res_bins", label: "Bins", type: "number", fieldType: "number" },
  text("res_plan", "Residential plan"),
  text("res_access_flags", "Access flags"),
  text("res_site_address_id", "Site address ID"),
];

async function ensureProperty(objectType, group, p) {
  try {
    await hs("GET", `/crm/v3/properties/${objectType}/${p.name}`);
    return "exists";
  } catch {
    await hs("POST", `/crm/v3/properties/${objectType}`, { ...p, groupName: group });
    return "created";
  }
}

// customer_type is a dropdown so multifamily can share it later.
async function ensureCustomerType() {
  let prop;
  try {
    prop = await hs("GET", "/crm/v3/properties/contacts/customer_type");
  } catch {
    await hs("POST", "/crm/v3/properties/contacts", {
      name: "customer_type",
      label: "Customer type",
      type: "enumeration",
      fieldType: "select",
      groupName: "contactinformation",
      options: [
        { label: "Residential", value: "Residential", displayOrder: 0 },
        { label: "Multifamily", value: "Multifamily", displayOrder: 1 },
      ],
    });
    return "created";
  }
  if (prop.type !== "enumeration") return `exists as ${prop.type}; "Residential" is written as text`;
  if (prop.options.some((o) => o.value === "Residential")) return "exists";
  await hs("PATCH", "/crm/v3/properties/contacts/customer_type", {
    options: [...prop.options, { label: "Residential", value: "Residential", displayOrder: prop.options.length }],
  });
  return 'added "Residential" option';
}

const STAGES = [
  ["Waitlist", "0.1"],
  ["Quote Needed", "0.3"],
  ["Signed Up", "0.8"],
  ["Active", "1.0"],
  ["Paused", "0.5"],
  ["Cancelled", "0.0"],
];

async function ensurePipeline() {
  const { results } = await hs("GET", "/crm/v3/pipelines/deals");
  const existing = results.find((p) => p.label === "Residential");
  if (!existing) {
    const created = await hs("POST", "/crm/v3/pipelines/deals", {
      label: "Residential",
      displayOrder: results.length,
      stages: STAGES.map(([label, probability], i) => ({ label, displayOrder: i, metadata: { probability } })),
    });
    return `created (id ${created.id}); other pipelines left untouched: ${results.map((p) => p.label).join(", ")}`;
  }
  const missing = STAGES.filter(([label]) => !existing.stages.some((s) => s.label === label));
  for (const [label, probability] of missing) {
    await hs("POST", `/crm/v3/pipelines/deals/${existing.id}/stages`, { label, displayOrder: STAGES.findIndex((s) => s[0] === label), metadata: { probability } });
  }
  return missing.length ? `added stages: ${missing.map((s) => s[0]).join(", ")}` : `exists (id ${existing.id})`;
}

// HubSpot's forms API requires a validation block on email and phone fields.
const VALIDATION = {
  email: { blockedEmailDomains: [], useDefaultBlockList: false },
  phone: { minAllowedDigits: 7, maxAllowedDigits: 20 },
};
const field = (name, label, fieldType, required) => ({
  objectTypeId: "0-1",
  name,
  label,
  required,
  hidden: false,
  fieldType,
  ...(VALIDATION[fieldType] ? { validation: VALIDATION[fieldType] } : {}),
});
const FORMS = {
  SIGNUP: ["Residential sign-up (website)", [field("email", "Email", "email", true), field("firstname", "First name", "single_line_text", true), field("lastname", "Last name", "single_line_text", false), field("mobilephone", "Mobile", "phone", true), field("zip", "ZIP", "single_line_text", true)]],
  WAITLIST: ["Residential waitlist (website)", [field("email", "Email", "email", true), field("firstname", "First name", "single_line_text", true), field("lastname", "Last name", "single_line_text", false), field("mobilephone", "Mobile", "phone", false), field("zip", "ZIP", "single_line_text", true)]],
  QUOTE: ["Residential quote request (website)", [field("email", "Email", "email", true), field("firstname", "First name", "single_line_text", true), field("lastname", "Last name", "single_line_text", false), field("mobilephone", "Mobile", "phone", true), field("zip", "ZIP", "single_line_text", true)]],
};

async function ensureForm(name, fields) {
  const { results } = await hs("GET", "/marketing/v3/forms/?limit=100&formTypes=hubspot");
  const found = results.find((f) => f.name === name);
  if (found) return found.id;
  const created = await hs("POST", "/marketing/v3/forms/", {
    name,
    formType: "hubspot",
    createdAt: new Date().toISOString(),
    archived: false,
    // HubSpot allows at most 3 fields per group (row), so one field per row.
    fieldGroups: fields.map((f) => ({ groupType: "default_group", richTextType: "text", fields: [f] })),
    configuration: {
      language: "en",
      cloneable: true,
      editable: true,
      archivable: true,
      recaptchaEnabled: false,
      notifyContactOwner: false,
      notifyRecipients: [],
      createNewContactForNewEmail: false,
      prePopulateKnownValues: false,
      allowLinkToResetKnownValues: false,
      lifecycleStages: [],
    },
    displayOptions: { renderRawHtml: false, theme: "default_style", submitButtonText: "Submit", cssClass: "" },
    legalConsentOptions: { type: "none" },
  });
  return created.id;
}

await step("contact property customer_type", ensureCustomerType);
for (const p of CONTACT_PROPS) await step(`contact property ${p.name}`, () => ensureProperty("contacts", "contactinformation", p));
for (const p of DEAL_PROPS) await step(`deal property ${p.name}`, () => ensureProperty("deals", "dealinformation", p));
await step("Residential pipeline", ensurePipeline);

const envLines = [];
for (const [key, [name, fields]] of Object.entries(FORMS)) {
  await step(`form "${name}"`, async () => {
    const id = await ensureForm(name, fields);
    envLines.push(`HUBSPOT_FORM_${key}=${id}`);
    return id;
  });
}

if (envLines.length) console.log(`\nAdd to .env.local:\n${envLines.join("\n")}`);
if (problems.length) {
  console.log(`\n${problems.length} step(s) failed. A 403 usually means the private app is missing a scope; the message names it.`);
  process.exit(1);
}
