-- One-off Routific stops from the admin dispatch dashboard. Additive, plus a wider unique index.
-- kind: rollout (the regular evening roll-out, kept in step by the daily sync), rollin
-- (a roll-in sent to Routific), extra (an extra trash pickup). The daily sync only manages
-- rollout rows; one-offs stay until removed from the dashboard.

alter table res_routific_orders add column if not exists kind text not null default 'rollout'
  check (kind in ('rollout', 'rollin', 'extra'));
alter table res_routific_orders add column if not exists notes text;

drop index if exists res_routific_orders_live_idx;
create unique index if not exists res_routific_orders_live_kind_idx
  on res_routific_orders (address_id, pickup_date, kind) where deleted_at is null;

-- Stops added by hand on the dashboard. The daily sync never removes these.
alter table res_routific_orders add column if not exists manual boolean not null default false;
