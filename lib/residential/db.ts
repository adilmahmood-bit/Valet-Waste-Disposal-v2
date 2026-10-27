import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client. The secret key bypasses RLS, so never import this from a
// client component.
let client: SupabaseClient | null = null;

export function db() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) throw new Error("SUPABASE_SECRET_KEY is not set in .env.local");
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

export type AddressStatus = "quote_needed" | "signed_up" | "active" | "paused" | "cancelled";

export type CustomerRow = {
  id: string;
  name: string;
  mobile: string;
  email: string;
  property_type: string;
  source: string | null;
  referral_code: string | null;
  hubspot_contact_id: string | null;
  hubspot_synced_at: string | null;
  created_at: string;
};

export type AddressRow = {
  id: string;
  customer_id: string;
  street: string;
  city: string;
  zip: string;
  trash_day: string;
  bins: number;
  access_flags: string[];
  access_notes: string | null;
  gate_code_encrypted: string | null;
  status: AddressStatus;
  hubspot_deal_id: string | null;
  created_at: string;
};

export type SubscriptionRow = {
  id: string;
  address_id: string;
  plan: string;
  price: number;
  status: string;
  start_date: string | null;
};

export type ShiftRow = { id: string; date: string; zips: string[]; shift_days: number; note: string | null };

export type PauseRow = { id: string; address_id: string; start_date: string; end_date: string };

export type WaitlistRow = {
  id: string;
  name: string;
  mobile: string | null;
  email: string;
  zip: string;
  address: string | null;
  source: string | null;
  referral_code: string | null;
  hubspot_contact_id: string | null;
  hubspot_deal_id: string | null;
  created_at: string;
};

// Surface Supabase errors instead of silently getting null data back.
export function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}
