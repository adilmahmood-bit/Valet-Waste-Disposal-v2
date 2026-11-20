import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { residential } from "@/config/residential";
import { SITE } from "@/lib/blog";
import { db, must, type CustomerRow } from "./db";
import { sendEmail } from "./email";

// Customer portal (/account) sign-in: no passwords. A customer types the email on their
// account, we email a one-time link, and opening it starts a session. The link page asks for
// a click before signing in, because email scanners open links on their own and would
// otherwise use up the token. Only SHA-256 hashes of tokens are stored.

const COOKIE = "vwd_customer";
const LINK_MINUTES = 30;
const SESSION_DAYS = 60;
const MAX_LINKS_PER_HOUR = 5;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");
const minutesFromNow = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

// Always resolves the same way whether or not the email has an account, so the form can't
// be used to find out who our customers are.
export async function requestSignInLink(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

  const customer = must(
    await db().from("res_customers").select("id, name, email").eq("email", email).maybeSingle(),
  ) as Pick<CustomerRow, "id" | "name" | "email"> | null;
  if (!customer) return;

  const since = new Date(Date.now() - 3_600_000).toISOString();
  const recent = await db()
    .from("res_portal_tokens")
    .select("token_hash", { count: "exact", head: true })
    .eq("customer_id", customer.id)
    .gte("created_at", since);
  if ((recent.count ?? 0) >= MAX_LINKS_PER_HOUR) return;

  const token = newToken();
  must(
    await db()
      .from("res_portal_tokens")
      .insert({ token_hash: hash(token), customer_id: customer.id, expires_at: minutesFromNow(LINK_MINUTES) }),
  );

  const first = customer.name.split(" ")[0] || "there";
  // A fixed base, never the request's Host header. Local dev links back to the dev server.
  const base = process.env.NODE_ENV === "production" ? SITE : "http://localhost:3000";
  const body = (url: string) =>
    [
      `Hi ${first},`,
      "",
      "Here's your link to sign in to your Doorstep Disposal account:",
      url,
      "",
      `It works once and expires in ${LINK_MINUTES} minutes.`,
      "If you didn't ask for it, you can ignore this email.",
      "",
      `Questions? Call or text us at ${residential.contact.phone}.`,
    ].join("\n");
  // The email log keeps a copy without the working link.
  await sendEmail(
    customer.email,
    "Your Doorstep Disposal sign-in link",
    body(`${base}/account/verify?t=${token}`),
    undefined,
    body(`${base}/account/verify?t=[removed]`),
  );
}

// Uses up a link token and starts a session. False if the link is unknown, used or expired.
export async function signInWithToken(token: string) {
  if (!token || token.length > 100) return false;
  // Claim the token in one update so two clicks can't both use it.
  const claimed = must(
    await db()
      .from("res_portal_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token_hash", hash(token))
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .select("customer_id"),
  ) as { customer_id: string }[];
  if (!claimed.length) return false;
  await startSession(claimed[0].customer_id);
  return true;
}

async function startSession(customerId: string) {
  const session = newToken();
  must(
    await db().from("res_portal_sessions").insert({
      token_hash: hash(session),
      customer_id: customerId,
      expires_at: minutesFromNow(SESSION_DAYS * 24 * 60),
    }),
  );
  (await cookies()).set(COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
}

// ---------- optional passwords ----------
// Passwords are optional: emailed links always work, and are how a forgotten password is
// replaced. Hashes are scrypt with a random salt, stored as scrypt$N$r$p$salt$hash.

export const PASSWORD_MIN = 10;
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

function scryptAsync(password: string, salt: Buffer, N: number, r: number, p: number, keylen: number) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, keylen, { N, r, p, maxmem: 64 * 1024 * 1024 }, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, SCRYPT.N, SCRYPT.r, SCRYPT.p, SCRYPT.keylen);
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), key.toString("base64")].join("$");
}

async function passwordMatchesHash(password: string, stored: string) {
  const [alg, N, r, p, salt, key] = stored.split("$");
  if (alg !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "base64");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64"), Number(N), Number(r), Number(p), expected.length);
  return timingSafeEqual(actual, expected);
}

// A fixed hash to check against when the email has no account or no password, so the
// answer takes the same time either way.
let dummyHash: Promise<string> | null = null;

export type PasswordSignIn = "ok" | "wrong" | "locked";

export async function signInWithPassword(rawEmail: string, password: string): Promise<PasswordSignIn> {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !password || password.length > 200) return "wrong";
  const c = must(
    await db().from("res_customers").select("id, password_hash, failed_logins, locked_until").eq("email", email).maybeSingle(),
  ) as { id: string; password_hash: string | null; failed_logins: number; locked_until: string | null } | null;

  if (!c?.password_hash) {
    await passwordMatchesHash(password, await (dummyHash ??= hashPassword(randomBytes(16).toString("hex"))));
    return "wrong";
  }
  if (c.locked_until && new Date(c.locked_until) > new Date()) return "locked";

  if (!(await passwordMatchesHash(password, c.password_hash))) {
    const failed = (c.locked_until ? 0 : c.failed_logins) + 1;
    const lock = failed >= MAX_FAILED;
    await db()
      .from("res_customers")
      .update({ failed_logins: lock ? 0 : failed, locked_until: lock ? minutesFromNow(LOCK_MINUTES) : null })
      .eq("id", c.id);
    return lock ? "locked" : "wrong";
  }

  await db().from("res_customers").update({ failed_logins: 0, locked_until: null }).eq("id", c.id);
  await startSession(c.id);
  return "ok";
}

// Sets or replaces the signed-in customer's password, signs out their other devices and
// emails them a heads-up. Being signed in (by link or password) is the proof of identity.
export async function setPassword(customer: CustomerRow, password: string) {
  must(
    await db()
      .from("res_customers")
      .update({ password_hash: await hashPassword(password), password_set_at: new Date().toISOString(), failed_logins: 0, locked_until: null })
      .eq("id", customer.id),
  );
  await endOtherSessions(customer.id);
  await sendEmail(
    customer.email,
    "Your Doorstep Disposal password was set",
    [
      `Hi ${customer.name.split(" ")[0] || "there"},`,
      "",
      "A password was just set for your Doorstep Disposal account, and any other devices were signed out.",
      "",
      `If this wasn't you, call or text us right away at ${residential.contact.phone}.`,
    ].join("\n"),
  );
}

export async function removePassword(customer: CustomerRow) {
  must(await db().from("res_customers").update({ password_hash: null, password_set_at: null }).eq("id", customer.id));
}

async function endOtherSessions(customerId: string) {
  const token = (await cookies()).get(COOKIE)?.value;
  let q = db().from("res_portal_sessions").delete().eq("customer_id", customerId);
  if (token) q = q.neq("token_hash", hash(token));
  must(await q);
}

// ---------- current session ----------

// Customer fields the portal uses. Password fields are never loaded here.
const CUSTOMER_COLUMNS =
  "id, name, mobile, email, property_type, source, referral_code, hubspot_contact_id, hubspot_synced_at, stripe_customer_id, created_at, password_set_at";

export type PortalCustomer = CustomerRow & { password_set_at: string | null };

// The signed-in customer, or null.
export async function currentCustomer(): Promise<PortalCustomer | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = must(
    await db()
      .from("res_portal_sessions")
      .select(`customer:res_customers(${CUSTOMER_COLUMNS})`)
      .eq("token_hash", hash(token))
      .gt("expires_at", new Date().toISOString())
      .maybeSingle(),
  ) as unknown as { customer: PortalCustomer | null } | null;
  return row?.customer ?? null;
}

export async function requireCustomer() {
  const customer = await currentCustomer();
  if (!customer) redirect("/account/login");
  return customer;
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db().from("res_portal_sessions").delete().eq("token_hash", hash(token));
  jar.delete(COOKIE);
}
