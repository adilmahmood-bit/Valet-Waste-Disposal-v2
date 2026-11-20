-- Optional customer portal passwords. Additive only.
-- password_hash is a scrypt hash (see lib/residential/portal-auth.ts), null when the customer
-- has not set one and signs in with emailed links only. After too many wrong passwords the
-- account is locked for a few minutes (locked_until); emailed links still work meanwhile.

alter table res_customers add column if not exists password_hash text;
alter table res_customers add column if not exists password_set_at timestamptz;
alter table res_customers add column if not exists failed_logins int not null default 0;
alter table res_customers add column if not exists locked_until timestamptz;
