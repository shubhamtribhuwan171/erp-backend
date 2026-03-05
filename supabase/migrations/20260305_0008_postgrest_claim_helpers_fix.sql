-- Migration: Fix JWT claim helper functions for PostgREST (claims stored in request.jwt.claims)
-- Date: 2026-03-05

begin;

create schema if not exists auth;

create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
$$;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif((auth.jwt() ->> 'sub'), '')::uuid
$$;

create or replace function request_company_id()
returns uuid
language sql
stable
as $$
  select nullif((auth.jwt() ->> 'company_id'), '')::uuid
$$;

create or replace function request_user_id()
returns uuid
language sql
stable
as $$
  select nullif((auth.jwt() ->> 'sub'), '')::uuid
$$;

commit;
