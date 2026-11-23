-- Failed sign-in counting in one locked step, so password guesses sent at the same moment
-- can't all read the same count and get past the lockout (found by the 2026-11-23 bug scan).
-- Both return true when the account is (now) locked. Called only by the server (secret key).

-- Customer portal: res_customers.failed_logins / locked_until.
create or replace function public.res_customer_login_failed(p_id uuid, p_max int, p_minutes int)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  c record;
  n int;
begin
  select failed_logins, locked_until into c from res_customers where id = p_id for update;
  if not found then return false; end if;
  if c.locked_until is not null and c.locked_until > now() then return true; end if;
  -- An expired lock starts the count over.
  n := (case when c.locked_until is null then coalesce(c.failed_logins, 0) else 0 end) + 1;
  if n >= p_max then
    update res_customers set failed_logins = 0, locked_until = now() + make_interval(mins => p_minutes) where id = p_id;
    return true;
  end if;
  update res_customers set failed_logins = n, locked_until = null where id = p_id;
  return false;
end;
$$;

-- Admin login (one shared password): state kept in res_app_state under 'admin_login'.
create or replace function public.res_admin_login_locked()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce((select (value->>'locked_until')::timestamptz > now() from res_app_state where key = 'admin_login'), false);
$$;

create or replace function public.res_admin_login_failed(p_max int, p_minutes int)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v jsonb;
  n int;
begin
  insert into res_app_state (key, value, updated_at) values ('admin_login', '{}'::jsonb, now()) on conflict (key) do nothing;
  select value into v from res_app_state where key = 'admin_login' for update;
  if (v->>'locked_until') is not null and (v->>'locked_until')::timestamptz > now() then return true; end if;
  n := (case when (v->>'locked_until') is null then coalesce((v->>'failed')::int, 0) else 0 end) + 1;
  if n >= p_max then
    update res_app_state set value = jsonb_build_object('failed', 0, 'locked_until', now() + make_interval(mins => p_minutes)), updated_at = now() where key = 'admin_login';
    return true;
  end if;
  update res_app_state set value = jsonb_build_object('failed', n), updated_at = now() where key = 'admin_login';
  return false;
end;
$$;

create or replace function public.res_admin_login_ok()
returns void
language sql
set search_path = public
as $$
  update res_app_state set value = '{}'::jsonb, updated_at = now() where key = 'admin_login';
$$;

-- Only the server's secret key may call these.
revoke execute on function public.res_customer_login_failed(uuid, int, int) from public, anon, authenticated;
revoke execute on function public.res_admin_login_locked() from public, anon, authenticated;
revoke execute on function public.res_admin_login_failed(int, int) from public, anon, authenticated;
revoke execute on function public.res_admin_login_ok() from public, anon, authenticated;
grant execute on function public.res_customer_login_failed(uuid, int, int) to service_role;
grant execute on function public.res_admin_login_locked() to service_role;
grant execute on function public.res_admin_login_failed(int, int) to service_role;
grant execute on function public.res_admin_login_ok() to service_role;
