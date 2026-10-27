import { residential } from "@/config/residential";

// Where a visitor came from, set by the /r short link and read by the sign-up and waitlist.
export const SOURCE_COOKIE = "vwd_src";
export const REFERRAL_COOKIE = "vwd_ref";

// Short aliases that fit on a door hanger or a post.
const ALIASES: Record<string, string> = {
  marketplace: "fb_marketplace",
  mp: "fb_marketplace",
  fbm: "fb_marketplace",
  fb: "fb_group",
  group: "fb_group",
  nd: "nextdoor",
  knock: "door",
  bc: "card",
  qr: "card",
  ref: "referral",
};

export const cleanCode = (v: string | null | undefined) =>
  (v ?? "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);

// Maps a src code to a known source id. Unknown codes are kept as-is so they still show in reports.
export function normalizeSource(v: string | null | undefined) {
  const c = cleanCode(v);
  if (!c) return "";
  const id = ALIASES[c] ?? c;
  return residential.sources.some((s) => s.id === id) ? id : c;
}
