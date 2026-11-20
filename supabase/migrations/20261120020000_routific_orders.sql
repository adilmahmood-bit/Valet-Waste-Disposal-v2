-- Routific sync (Phase 2). Additive only.
-- One Routific order per property per trash day: the evening roll-out. Roll-ins are not sent
-- to Routific; they stay in res_visits only. Routific has no "list orders" endpoint, so this
-- table is the only record of which orders we created.

create table if not exists res_routific_orders (
  id uuid primary key default gen_random_uuid(),
  address_id uuid not null references res_addresses (id) on delete cascade,
  pickup_date date not null,          -- the trash day
  delivery_date date not null,        -- the roll-out evening sent to Routific (pickup_date - 1)
  customer_order_number text not null, -- "<address_id>:<pickup_date>", sent as Routific's external ID
  order_uuid text unique,             -- null until Routific confirms the order
  routific_order_number text,
  routific_status text,               -- not_scheduled, scheduled, delivered, missed (webhook keeps it current)
  payload_hash text,                  -- detects address or instruction changes that need a PUT
  route_uuid text,                    -- Phase 4: route, ETA and tracking link
  eta timestamptz,
  tracking_url text,
  last_error text,
  deleted_at timestamptz,             -- removed in Routific (paused, cancelled or schedule changed)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one live order per property per trash day. The sync claims this row before calling
-- Routific, so two syncs running at once can't create the same order twice.
create unique index if not exists res_routific_orders_live_idx
  on res_routific_orders (address_id, pickup_date) where deleted_at is null;
create index if not exists res_routific_orders_pickup_idx on res_routific_orders (pickup_date);

alter table res_routific_orders enable row level security;
