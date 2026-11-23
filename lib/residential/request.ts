import type { NextRequest } from "next/server";
import type { FormContext } from "./hubspot";
import { SITE } from "@/lib/blog";

// The public origin for links and redirects. Never the request URL in production: behind
// Hostinger's proxy it is the internal address (https://0.0.0.0:3000).
export const publicOrigin = (req: NextRequest) =>
  (process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === "production" ? SITE : req.nextUrl.origin)).replace(/\/$/, "");

export const clientIp = (req: NextRequest) =>
  req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || null;

export function formContext(req: NextRequest, pageUri: unknown, pageName: string): FormContext {
  return {
    hutk: req.cookies.get("hubspotutk")?.value,
    pageUri: typeof pageUri === "string" ? pageUri.slice(0, 500) : undefined,
    pageName,
    ipAddress: clientIp(req) ?? undefined,
  };
}

export const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const splitName = (name: string) => {
  const [firstname, ...rest] = name.trim().split(/\s+/);
  return { firstname, lastname: rest.join(" ") };
};
