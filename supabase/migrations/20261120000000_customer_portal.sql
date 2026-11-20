-- Customer portal (/account) sign-in. Additive only.
-- Customers sign in with a one-time link emailed to the address on res_customers. Only the
-- SHA-256 hash of each link token and session token is stored, never the token itself.
-- Like every res_ table, only the server (secret key) touches these: RLS on, no policies.

create table if not exists res_portal_tokens (
  token_hash text primary key,
  customer_id uuid not null references res_customers (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists res_portal_tokens_customer_idx on res_portal_tokens (customer_id, created_at desc);

create table if not exists res_portal_sessions (
  token_hash text primary key,
  customer_id uuid not null references res_customers (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists res_portal_sessions_customer_idx on res_portal_sessions (customer_id);

alter table res_portal_tokens enable row level security;
alter table res_portal_sessions enable row level security;
