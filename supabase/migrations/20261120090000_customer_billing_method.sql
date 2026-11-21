-- How a customer pays: 'stripe' (card or ACH autopay through Stripe, the default) or
-- 'bank_transfer' (they send ACH or wire from their own bank, set up as a recurring payment;
-- no Stripe link is offered and Adil tracks payment outside the site).
alter table res_customers
  add column if not exists billing_method text not null default 'stripe'
  check (billing_method in ('stripe', 'bank_transfer'));
