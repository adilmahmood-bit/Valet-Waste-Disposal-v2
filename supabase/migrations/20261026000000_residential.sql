-- Residential bin valet: operational records. HubSpot is the master for contact details;
-- these tables hold what routes and visits need plus the HubSpot IDs that link them.
-- Tables are prefixed res_ to keep them apart from multifamily data. Only the server
-- (secret key) touches them: RLS is on with no policies.


create table res_customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile text not null,
  email text not null unique, -- stored lowercased
  property_type text not null,
  source text,
  referral_code text,
  hubspot_contact_id text,
  hubspot_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table res_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references res_customers (id) on delete cascade,
  street text not null,
  city text not null default 'San Diego',
  zip text not null,
  trash_day text not null check (trash_day in ('Mon', 'Tue', 'Wed', 'Thu', 'Fri')),
  bins int not null check (bins between 1 and 8),
  access_flags text[] not null default '{}',
  access_notes text,
  gate_code_encrypted text,
  -- quote_needed -> signed_up -> active -> paused / cancelled
  status text not null default 'signed_up'
    check (status in ('quote_needed', 'signed_up', 'active', 'paused', 'cancelled')),
  hubspot_deal_id text,
  created_at timestamptz not null default now()
);
create index res_addresses_customer_idx on res_addresses (customer_id);
create index res_addresses_status_zip_idx on res_addresses (status, zip);

create table res_subscriptions (
  id uuid primary key default gen_random_uuid(),
  address_id uuid not null references res_addresses (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null,
  price numeric(10, 2) not null,
  status text not null default 'pending_billing',
  start_date date,
  created_at timestamptz not null default now()
);
create index res_subscriptions_address_idx on res_subscriptions (address_id);

create table res_visits (
  id uuid primary key default gen_random_uuid(),
  address_id uuid not null references res_addresses (id) on delete cascade,
  date date not null,
  type text not null check (type in ('out', 'back')),
  status text not null check (status in ('done', 'missed', 'skipped', 'issue')),
  note text,
  photo_url text,
  completed_by text,
  completed_at timestamptz not null default now(),
  unique (address_id, date, type)
);

create table res_pauses (
  id uuid primary key default gen_random_uuid(),
  address_id uuid not null references res_addresses (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  check (end_date >= start_date)
);
create index res_pauses_address_idx on res_pauses (address_id);

create table res_quote_requests (
  id uuid primary key default gen_random_uuid(),
  address_id uuid not null references res_addresses (id) on delete cascade,
  reason text not null,
  plan text,
  status text not null default 'open' check (status in ('open', 'quoted', 'accepted', 'declined')),
  quoted_price numeric(10, 2),
  created_at timestamptz not null default now()
);

create table res_waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile text,
  email text not null,
  zip text not null,
  address text,
  source text,
  referral_code text,
  hubspot_contact_id text,
  hubspot_deal_id text,
  created_at timestamptz not null default now()
);
create index res_waitlist_zip_idx on res_waitlist (zip);

-- The e-sign record for the residential service terms.
create table res_terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references res_customers (id) on delete cascade,
  address_id uuid references res_addresses (id) on delete set null,
  terms_version text not null,
  accepted_at timestamptz not null default now(),
  ip text,
  user_agent text
);

create table res_referral_partners (
  code text primary key,
  name text not null,
  terms text -- FILL IN: percentage or flat per lead
);

-- A holiday week: pickups on or after `date` in that week move `shift_days` later.
-- Empty `zips` means every ZIP.
create table res_service_shifts (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  zips text[] not null default '{}',
  shift_days int not null default 1,
  note text
);

-- Every HubSpot write and its read-back, so silent failures show up in the admin.
create table res_hubspot_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  operation text not null,
  object_type text not null,
  object_id text,
  local_ref text,
  request jsonb,
  status int,
  response jsonb,
  verified boolean,
  error text
);
create index res_hubspot_log_failed_idx on res_hubspot_log (at desc) where verified is not true;

create table res_email_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  "to" text not null,
  subject text not null,
  body text not null,
  provider text not null,
  status text not null,
  error text
);

create table res_app_state (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' and tablename like 'res\_%' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
