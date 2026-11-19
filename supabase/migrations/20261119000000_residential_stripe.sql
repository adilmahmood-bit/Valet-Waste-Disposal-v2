-- Stripe billing for residential sign-ups. Additive only.
-- res_subscriptions.status now mirrors Stripe: pending_billing (sent to Checkout, not paid yet),
-- then the Stripe subscription status (active, past_due, canceled, ...), or paid for one-time visits.

alter table res_customers add column if not exists stripe_customer_id text;
create unique index if not exists res_customers_stripe_customer_idx on res_customers (stripe_customer_id);

alter table res_subscriptions add column if not exists stripe_checkout_session_id text;
create unique index if not exists res_subscriptions_stripe_sub_idx on res_subscriptions (stripe_subscription_id);

-- Stripe event IDs already handled, so a redelivered webhook isn't processed twice.
create table if not exists res_stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);
alter table res_stripe_events enable row level security;
