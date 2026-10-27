// Residential bin valet: every price, bin limit, ZIP, day and open policy lives here.
// Values marked FILL IN are placeholders until Adil confirms them. Pages read from this
// file only, so changing a value here changes it everywhere.

export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

export type AccessFlag = {
  id: string;
  label: string;
  // Sign-ups with a quote-required flag skip instant sign-up and become a quote request.
  quoteRequired: boolean;
};

export type Plan = {
  id: "weekly" | "push_out" | "one_time";
  name: string;
  blurb: string;
  includes: string[];
  basePrice: number;
  includedBins: number;
  extraBinPrice: number;
  billing: "monthly" | "one_time";
  enabled: boolean;
  mostPopular?: boolean;
};

export const residential = {
  // Shows a strip on residential pages listing the FILL IN placeholders, so Adil can
  // react to them in the demo. Turn off before go-live.
  showPlaceholderBanner: false,

  // Shown to customers. No personal name on residential pages.
  contact: {
    phone: "619-324-8875",
    phoneHref: "+16193248875",
    email: "contact@valetwastedisposal.com",
  },

  // Internal: where new sign-up, quote and waitlist alerts go. Never shown on the site.
  notifyEmail: "adil.mahmood@valetwastedisposal.com",

  plans: [
    {
      id: "weekly",
      name: "Weekly Out & Back",
      blurb: "We roll your bins to the curb and bring them back, every week.",
      includes: [
        "Bins to the curb the evening before pickup",
        "Bins back to their spot after pickup",
        "Month-to-month billing",
      ],
      basePrice: 49, // Set by Adil 2026-10-26
      includedBins: 3, // FILL IN
      extraBinPrice: 5, // FILL IN: per extra bin, per month
      billing: "monthly",
      enabled: true,
      mostPopular: true,
    },
    {
      id: "push_out",
      name: "Push-Out Only",
      blurb: "We roll your bins to the curb. You bring them back.",
      includes: ["Bins to the curb the evening before pickup", "Month-to-month billing"],
      basePrice: 35, // FILL IN
      includedBins: 3,
      extraBinPrice: 5,
      billing: "monthly",
      enabled: false, // FILL IN: on or off
    },
    {
      id: "one_time",
      name: "One-Time Round Trip",
      blurb: "A single out-and-back visit. No monthly plan.",
      includes: ["Bins out the evening before pickup", "Bins back after pickup"],
      basePrice: 25, // Set by Adil 2026-10-26
      includedBins: 3,
      extraBinPrice: 5,
      billing: "one_time",
      enabled: true,
    },
  ] as Plan[],

  bins: { min: 1, max: 8 },

  // Launch ZIPs, set by Adil 2026-10-26 (San Diego and North County). Others go to the waitlist.
  serviceZips: [
    "92007", "92008", "92009", "92010", "92011", "92014", "92024", "92029",
    "92037", "92056", "92064", "92067", "92069", "92075", "92078", "92081",
    "92083", "92091", "92092", "92093", "92096", "92109", "92111", "92117",
    "92121", "92122", "92126", "92127", "92128", "92129", "92130", "92131",
    "92145", "92161",
  ],

  serviceDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] as Weekday[],

  // First service is the next trash day at least this many days after sign-up.
  startLeadDays: 2,

  accessFlags: [
    { id: "gate_code", label: "Gate code needed", quoteRequired: false },
    { id: "steep_driveway", label: "Steep driveway", quoteRequired: true },
    { id: "stairs", label: "Stairs between bins and curb", quoteRequired: true },
    { id: "long_walk", label: "Long walk to curb (over 50 ft)", quoteRequired: true },
    { id: "pets", label: "Pets in yard", quoteRequired: false },
  ] as AccessFlag[],

  propertyTypes: [
    { id: "homeowner", label: "Homeowner" },
    { id: "senior", label: "Senior household" },
    { id: "str_host", label: "STR / Airbnb host" },
    { id: "property_manager", label: "Property manager" },
  ],

  sources: [
    { id: "door", label: "Door knock" },
    { id: "card", label: "Business card" },
    { id: "fb_marketplace", label: "Facebook Marketplace" },
    { id: "nextdoor", label: "Nextdoor" },
    { id: "fb_group", label: "Facebook group" },
    { id: "referral", label: "Referral" },
    { id: "search", label: "Search" },
    { id: "other", label: "Other" },
  ],

  terms: {
    version: "2026-10-26-draft",
    // The terms page carries a draft notice until an attorney has reviewed it.
    attorneyReviewed: false,
  },

  // Payments are off for now: sign-ups are recorded and Adil sets up billing directly.
  payments: { enabled: false },

  // Open policies. null means not decided: pages say so and point to Adil instead of
  // making a promise. Fill these in once set.
  policies: {
    // Set by Adil 2026-10-26: cancel anytime; it takes effect at the next billing month.
    cancellation: "Your cancellation takes effect at the start of your next billing month, and you won't be charged again." as string | null,
    missedVisit: null as string | null, // FILL IN
    rain: "Yes. We come rain or shine." as string | null, // Set by Adil 2026-10-26
  },
};

export type ResidentialConfig = typeof residential;

export const enabledPlans = () => residential.plans.filter((p) => p.enabled);

export const planById = (id: string) => residential.plans.find((p) => p.id === id);

export function planPrice(plan: Plan, bins: number) {
  return plan.basePrice + Math.max(0, bins - plan.includedBins) * plan.extraBinPrice;
}

export const isServiceZip = (zip: string) =>
  residential.serviceZips.includes(zip.trim().slice(0, 5));

export const quoteRequiredFlags = (flags: string[]) =>
  residential.accessFlags.filter((f) => f.quoteRequired && flags.includes(f.id));

export const sourceLabel = (id: string | null | undefined) =>
  residential.sources.find((s) => s.id === id)?.label ?? id ?? "";

export const propertyTypeLabel = (id: string | null | undefined) =>
  residential.propertyTypes.find((p) => p.id === id)?.label ?? id ?? "";

export const accessFlagLabel = (id: string) =>
  residential.accessFlags.find((f) => f.id === id)?.label ?? id;

// Every value still waiting on a decision, for the demo banner.
export function openDecisions() {
  const weekly = planById("weekly")!;
  const pushOut = planById("push_out")!;
  return [
    `Bins included in the $${weekly.basePrice}/mo plan: ${weekly.includedBins}`,
    `Extra bin $${weekly.extraBinPrice}/mo`,
    `Push-out plan ${pushOut.enabled ? "on" : "off"}`,
    "Missed-visit policy",
    "Payments off (billing set up by text)",
    "Terms not attorney-reviewed",
  ];
}
