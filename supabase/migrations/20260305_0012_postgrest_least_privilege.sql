-- Migration: PostgREST least-privilege grants
-- Date: 2026-03-05
-- Tightens anon/authenticated privileges.

begin;

-- Ensure roles exist
DO $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end $$;

-- Revoke broad access
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

-- anon: only allow calling auth RPCs (already granted elsewhere) + schema usage
grant usage on schema public to anon;

-- authenticated: allow table access, RLS will filter.
-- (Still least-privilege compared to granting to anon.)
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;

commit;
