-- Business mileage log for tax and accounting (Admin > Mileage).
-- rollout: one row per completed Routific route (planned distance from Routific).
-- rollin:  one row per day of crew roll-ins (estimated from the matching roll-out route).
-- manual:  any other business drive Adil adds.
-- actual_miles, when set (odometer), replaces the planned/estimated miles in totals and exports.
create table if not exists res_mileage_trips (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  kind text not null check (kind in ('rollout', 'rollin', 'manual')),
  source text not null check (source in ('routific', 'estimate', 'manual')),
  route_uuid text unique,
  purpose text not null,
  start_address text,
  end_address text,
  stops integer,
  planned_miles numeric(8, 1),
  actual_miles numeric(8, 1),
  minutes integer,
  driver text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One estimated roll-in trip per day.
create unique index if not exists res_mileage_rollin_day_idx on res_mileage_trips (date) where kind = 'rollin';
create index if not exists res_mileage_date_idx on res_mileage_trips (date);

alter table res_mileage_trips enable row level security;
