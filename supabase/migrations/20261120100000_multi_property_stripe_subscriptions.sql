-- An agreement client's Stripe subscription covers several properties (one res_subscriptions
-- row each), so stripe_subscription_id can't be unique. The unique index made the webhook fail
-- for multi-property checkouts (Bailee's Tamarack + Park, 2026-11-20). Keep a plain index for lookups.
drop index if exists res_subscriptions_stripe_sub_idx;
create index if not exists res_subscriptions_stripe_sub_lookup_idx on res_subscriptions (stripe_subscription_id);
