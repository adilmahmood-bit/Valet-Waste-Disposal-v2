import { residential } from "@/config/residential";
import { db } from "./db";
import { sendEmail } from "./email";

// Thin client for the Routific Platform API v2 (api-docs.routific.com). Server only: the token
// can read and change every order in the workspace.

const BASE = "https://api.plan.routific.com/v2";

export const routificConfigured = () => !!process.env.ROUTIFIC_API_TOKEN && !!process.env.ROUTIFIC_WORKSPACE_UUID;

export class RoutificError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`Routific ${status}: ${body.slice(0, 300)}`);
  }
  get authFailed() {
    return this.status === 401 || this.status === 403;
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<{ status: number; data: T }> {
  const token = process.env.ROUTIFIC_API_TOKEN;
  if (!token) throw new Error("ROUTIFIC_API_TOKEN is not set in .env.local");
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new RoutificError(res.status, text);
    if (err.authFailed) await alertAuthFailure(err);
    throw err;
  }
  return { status: res.status, data: (text ? JSON.parse(text) : null) as T };
}

const workspace = () => {
  const w = process.env.ROUTIFIC_WORKSPACE_UUID;
  if (!w) throw new Error("ROUTIFIC_WORKSPACE_UUID is not set in .env.local");
  return w;
};

export type RoutificOrderInput = {
  name: string;
  locations: { address: string }[];
  duration: number;
  instructions: string;
  timeWindows: { startTime: string; endTime: string }[];
  customerOrderNumber: string;
  deliveryDate: string;
};

export type RoutificOrder = RoutificOrderInput & {
  uuid: string;
  routificOrderNumber: string;
  status: string;
  isScheduled?: boolean;
  deliveryTime?: string | null;
  deliveryNotes?: string | null;
  deliveryMissedReason?: string | null;
  deliveryTracking?: { url: string; shortUrl: string } | null;
  proofOfDelivery?: { signature?: string | null; photos?: string[] } | null;
};

export async function createOrders(orders: RoutificOrderInput[]) {
  const { data } = await call<RoutificOrder[]>("POST", `/orders?workspaceUuid=${workspace()}`, orders);
  return data;
}

export async function getOrder(uuid: string) {
  return (await call<RoutificOrder>("GET", `/orders/${uuid}`)).data;
}

export type RoutificRoute = {
  uuid: string;
  name: string;
  date: string;
  status: string; // "completed" once every stop is done
  distanceInKilometers?: number | null;
  workingTimeInSeconds?: number | null;
  driver?: { name?: string | null } | null;
  constraints?: { startLocation?: { address?: string } | null; endLocation?: { address?: string } | null } | null;
};

export async function getRoute(uuid: string) {
  return (await call<RoutificRoute>("GET", `/routes/${uuid}`)).data;
}

export type RoutificRouteSummary = RoutificRoute & { ordersCount?: number };

export async function listRoutes(date: string) {
  const { data } = await call<{ items: RoutificRouteSummary[] }>("GET", `/routes?workspaceUuid=${workspace()}&date=${date}`);
  return data?.items ?? [];
}

type Action<S> = { actionUuid: string; actionName: string; status: "pending" | "finished" | "failed"; error?: string | null; actionSummary?: S };
export type ScheduleSummary = {
  scheduledOrders?: { uuid: string; routeUuid: string }[];
  unscheduledOrders?: { uuid: string }[];
};
export type PublishSummary = { routes?: { uuid: string; actionStatus: string; error?: string | null }[] };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Routific runs scheduling and publishing in the background; wait (up to ~40 s) for the result.
async function waitFor<S>(path: string): Promise<Action<S>> {
  let last: Action<S> | null = null;
  for (let i = 0; i < 20; i++) {
    await sleep(i === 0 ? 1000 : 2000);
    last = (await call<Action<S>>("GET", path)).data;
    if (last.status !== "pending") return last;
  }
  return last!;
}

// Puts orders on that day's routes (Routific picks the stop order), like "Schedule" in the app.
export async function scheduleOrders(date: string, orders: string[], routes: string[]) {
  const { data } = await call<Action<ScheduleSummary>>("POST", `/schedules?workspaceUuid=${workspace()}`, { date, orders, routes });
  return waitFor<ScheduleSummary>(`/schedules/actions/${data.actionUuid}`);
}

// Sends every route of that day to the drivers' app (unchanged published routes are skipped).
export async function publishRoutes(date: string) {
  const { data } = await call<Action<PublishSummary>>("POST", `/routes/publish?workspaceUuid=${workspace()}&date=${date}`);
  return waitFor<PublishSummary>(`/routes/actions/${data.actionUuid}`);
}

// A proof-of-delivery photo. `ref` is an entry of order.proofOfDelivery.photos, a relative
// path like "/v1/orders/<order>/photos/<photo>"; only the photo id at the end is used.
export async function getPhoto(orderUuid: string, ref: string) {
  const photoUuid = ref.split("/").filter(Boolean).pop();
  if (!photoUuid) throw new Error(`Bad photo reference: ${ref}`);
  const token = process.env.ROUTIFIC_API_TOKEN;
  const res = await fetch(`${BASE}/orders/${orderUuid}/photos/${photoUuid}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new RoutificError(res.status, await res.text());
  const type = res.headers.get("content-type") ?? "";
  const raw = Buffer.from(await res.arrayBuffer());
  // The docs describe the body as a "hexadecimal representation" of the JPEG; accept either.
  const text = raw.subarray(0, 64).toString("latin1");
  const bytes = !type.startsWith("image/") && /^[0-9a-fA-F]+$/.test(text) ? Buffer.from(raw.toString("latin1").trim(), "hex") : raw;
  return { photoUuid, bytes, contentType: type.startsWith("image/") ? type.split(";")[0] : "image/jpeg" };
}

// Full replacement: every field must be sent, or Routific clears it.
export async function updateOrder(uuid: string, order: RoutificOrderInput) {
  return (await call<{ status: string; actionUuid?: string }>("PUT", `/orders/${uuid}`, order)).data;
}

// 204 when deleted, 202 when it was on a route (Routific finishes the delete in the background).
// A 404 means it is already gone, which is what we wanted.
export async function deleteOrder(uuid: string) {
  try {
    await call("DELETE", `/orders/${uuid}`);
    return true;
  } catch (e) {
    if (e instanceof RoutificError && e.status === 404) return true;
    throw e;
  }
}

// Emails Adil at most once a day when the token stops working (Routific tokens expire).
async function alertAuthFailure(err: RoutificError) {
  try {
    const key = "routific_auth_alert";
    const prev = await db().from("res_app_state").select("value").eq("key", key).maybeSingle();
    const last = (prev.data?.value as { at?: string } | null)?.at;
    if (last && Date.now() - new Date(last).getTime() < 86_400_000) return;
    await db().from("res_app_state").upsert({ key, value: { at: new Date().toISOString() }, updated_at: new Date().toISOString() });
    await sendEmail(
      residential.notifyEmail,
      "Routific sync stopped: API token rejected",
      [
        `Routific refused the API token (HTTP ${err.status}). Tonight's roll-outs may not be in Routific.`,
        "",
        "Fix: in plan.routific.com, go to Settings > Integrations > Create API Token, then put the new token in",
        "ROUTIFIC_API_TOKEN (in .env.local and in Hostinger's environment variables).",
        "",
        `Routific said: ${err.body.slice(0, 300)}`,
      ].join("\n"),
    );
  } catch (e) {
    console.error("[routific] could not send auth alert", e);
  }
}
