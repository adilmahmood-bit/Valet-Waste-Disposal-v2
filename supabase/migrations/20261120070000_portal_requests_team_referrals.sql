-- Customer portal: requests Adil approves, team members, and each customer's referral code.
-- Additive only. Like every res_ table, only the server touches these (RLS on, no policies).

-- Things a customer asks for in the portal. Nothing changes routes until Adil accepts.
--   overflow:     extra trash pickup (property, bags, when, notes, optional photo)
--   access:       new access notes and/or gate code for a property
--   pause:        skip service between two dates
--   add_property: a new address to add to the account
create table if not exists res_portal_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references res_customers (id) on delete cascade,
  address_id uuid references res_addresses (id) on delete cascade,
  kind text not null check (kind in ('overflow', 'access', 'pause', 'add_property')),
  details jsonb not null default '{}', -- gate codes in here are encrypted, never plain
  photo_url text,
  status text not null default 'open' check (status in ('open', 'accepted', 'declined')),
  admin_note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists res_portal_requests_open_idx on res_portal_requests (status, created_at desc);
create index if not exists res_portal_requests_customer_idx on res_portal_requests (customer_id, created_at desc);

-- People a customer adds (cleaners, co-hosts) who get the same visit emails. No sign-in.
create table if not exists res_team_members (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references res_customers (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now()
);
create index if not exists res_team_members_customer_idx on res_team_members (customer_id);

-- The customer's own referral code for /r?ref=<code>. (referral_code is the code they signed up with.)
alter table res_customers add column if not exists my_referral_code text unique;

alter table res_portal_requests enable row level security;
alter table res_team_members enable row level security;
