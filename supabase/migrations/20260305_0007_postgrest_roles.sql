-- Migration: Create PostgREST roles (best practice)
-- Date: 2026-03-05

begin;

-- Create roles if missing
DO $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    create role authenticator login password 'authenticator_password_change_me' noinherit;
  end if;
end $$;

-- Allow authenticator to switch into request roles
grant anon to authenticator;
grant authenticated to authenticator;

-- Limit privileges: grant schema usage + table privileges to request roles
grant usage on schema public to anon, authenticated;

-- Read-only for anon (optional). For now we keep anon minimal.
-- authenticated: full access governed by RLS policies.

grant select on all tables in schema public to anon;

grant select, insert, update, delete on all tables in schema public to authenticated;

alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;

commit;
