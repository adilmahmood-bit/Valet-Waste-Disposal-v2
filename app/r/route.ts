import { NextResponse, type NextRequest } from "next/server";
import { SOURCE_COOKIE, REFERRAL_COOKIE, cleanCode, normalizeSource } from "@/lib/residential/tracking";

// Short link for QR codes and posts: /r?src=door&ref=pb01. Remembers where the visitor came
// from for 30 days (the sign-up and waitlist read these cookies), then lands on /residential.
const MAX_AGE = 60 * 60 * 24 * 30;

export function GET(req: NextRequest) {
  const src = normalizeSource(req.nextUrl.searchParams.get("src"));
  const ref = cleanCode(req.nextUrl.searchParams.get("ref"));
  const res = NextResponse.redirect(new URL("/residential", req.url));
  const opts = { maxAge: MAX_AGE, path: "/", sameSite: "lax" as const };
  if (src) res.cookies.set(SOURCE_COOKIE, src, opts);
  // A referral code implies a referral unless the link says otherwise.
  if (ref) {
    res.cookies.set(REFERRAL_COOKIE, ref, opts);
    if (!src) res.cookies.set(SOURCE_COOKIE, "referral", opts);
  }
  return res;
}
