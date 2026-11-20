-- Which visit emails a customer wants (portal: "Email alerts"). Additive only.
-- Only used while residential.notifications.visitEmails is on.
alter table res_customers add column if not exists alert_out boolean not null default true;
alter table res_customers add column if not exists alert_back boolean not null default true;
