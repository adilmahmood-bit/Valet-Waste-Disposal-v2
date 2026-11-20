-- Routific webhooks and visit photos (Phase 3). Additive only.

-- Each Routific webhook delivery we've handled, keyed by x-routific-event-id, so a retried
-- delivery isn't processed twice.
create table if not exists res_routific_events (
  event_id text primary key,
  topic text not null,
  received_at timestamptz not null default now(),
  error text
);
alter table res_routific_events enable row level security;

-- Private bucket for visit photos (Routific proof-of-delivery copies and crew roll-in photos).
-- Only the server reads it; the portal shows photos through short-lived signed URLs.
-- res_visits.photo_url holds "storage:visit-photos/<path>" for these, or a plain URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('visit-photos', 'visit-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
