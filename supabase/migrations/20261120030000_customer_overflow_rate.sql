-- Per-client excess-trash pickup rate. Additive only.
-- Null means the client has no excess-pickup terms, and the portal doesn't offer it.
-- Set per agreement: e.g. Zenstays has $60 for the first 95-gallon can, then $7 per 13-gallon bag.

alter table res_customers add column if not exists overflow_first_can numeric(10, 2);
alter table res_customers add column if not exists overflow_per_bag numeric(10, 2);
