-- Agreement clients can split their properties into separately billed accounts (e.g. one
-- owner's property on its own card), and Adil can set a custom first-month charge.
alter table res_subscriptions
  add column if not exists billing_group text,
  add column if not exists first_month_charge numeric(10, 2);

comment on column res_subscriptions.billing_group is
  'Name of the autopay account this property is billed under (one Stripe subscription per group). Null = the customer''s main account.';
comment on column res_subscriptions.first_month_charge is
  'Custom amount for the first (partial) month, charged when autopay is set up. Null = prorate by pickups.';
