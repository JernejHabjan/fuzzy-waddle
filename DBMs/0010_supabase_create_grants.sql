-- Explicit Data API grants for projects where automatic exposure of new public tables is disabled.
-- See: https://github.com/orgs/supabase/discussions/45329
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
