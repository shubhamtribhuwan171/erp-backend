-- Migration: grant access to auth schema helper functions for PostgREST roles
-- Date: 2026-03-05

begin;

grant usage on schema auth to anon, authenticated;
grant execute on all functions in schema auth to anon, authenticated;

alter default privileges in schema auth grant execute on functions to anon, authenticated;

commit;
