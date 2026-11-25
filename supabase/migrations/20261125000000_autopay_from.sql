-- Agreement clients whose first month is billed in arrears (e.g. Zenstays: first month invoiced
-- Dec 31, autopay from Jan 1). When set, the autopay checkout charges nothing up front for
-- that property and the Stripe subscription's first charge is on this date (the 1st of a month).
alter table res_subscriptions add column if not exists autopay_from date;

comment on column res_subscriptions.autopay_from is
  'First autopay charge date for a client property billed in arrears; null = standard (this month''s share now, then the 1st).';
