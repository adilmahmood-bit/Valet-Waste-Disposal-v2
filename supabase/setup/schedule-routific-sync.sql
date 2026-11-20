-- Daily Routific sync schedule. Run ONCE, after the Routific code is live on
-- yourdoorstepdisposal.com and CRON_SECRET is set in Hostinger's environment variables.
-- Not a migration: it calls the live site, so don't run it against a database without it.
--
-- Before running: replace PASTE_CRON_SECRET_HERE with the CRON_SECRET value from .env.local
-- (Supabase dashboard > SQL editor). The secret is kept in Supabase Vault, not in the job text.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret('PASTE_CRON_SECRET_HERE', 'routific_cron_secret', 'Bearer token for /api/cron/routific');

-- pg_cron runs on UTC. 15:00 UTC = 7 AM in winter (8 AM in summer) and 22:00 UTC = 2 PM in
-- winter (3 PM in summer), San Diego time. Morning sends tonight's and tomorrow's roll-outs;
-- the afternoon run picks up same-day changes before the 4 PM window.
select cron.schedule(
  'routific-sync',
  '0 15,22 * * *',
  $$
  select net.http_post(
    url := 'https://yourdoorstepdisposal.com/api/cron/routific',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'routific_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Check it ran:   select * from net._http_response order by created desc limit 5;
-- Stop it:        select cron.unschedule('routific-sync');
