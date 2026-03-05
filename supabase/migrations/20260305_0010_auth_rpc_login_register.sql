-- Migration: DB-driven auth via SECURITY DEFINER RPCs (PostgREST)
-- Date: 2026-03-05
-- Requires extension pgcrypto.
-- These RPCs allow login/register without service-role bypass while keeping RLS enabled.

begin;

create extension if not exists pgcrypto;

-- Ensure required roles exist (idempotent)
DO $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end $$;

-- 1) Login RPC
-- Returns: user row fields needed by API to issue JWT.
create or replace function public.rpc_login(p_email text, p_password text)
returns table(
  user_id uuid,
  email text,
  company_id uuid,
  full_name text,
  role text,
  is_admin boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    u.id,
    u.email::text,
    u.company_id,
    u.full_name,
    u.role,
    coalesce(u.is_admin,false)
  from users u
  where lower(u.email::text) = lower(p_email)
    and u.is_active = true
    and u.password_hash is not null
    and crypt(p_password, u.password_hash) = u.password_hash
  limit 1;
end;
$$;

-- 2) Register RPC
-- Creates company + owner user.
create or replace function public.rpc_register(p_email text, p_password text, p_company_name text, p_full_name text)
returns table(
  company_id uuid,
  company_name text,
  user_id uuid,
  email text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company companies%rowtype;
  v_user users%rowtype;
  v_pw_hash text;
begin
  if p_email is null or length(trim(p_email)) = 0 then
    raise exception 'email is required';
  end if;
  if p_password is null or length(p_password) < 6 then
    raise exception 'password must be at least 6 chars';
  end if;
  if p_company_name is null or length(trim(p_company_name)) = 0 then
    raise exception 'companyName is required';
  end if;

  -- Prevent duplicate email
  if exists (select 1 from users u where lower(u.email::text) = lower(p_email)) then
    raise exception 'email already in use';
  end if;

  insert into companies(name, base_currency_code, timezone)
  values (p_company_name, 'INR', 'Asia/Kolkata')
  returning * into v_company;

  v_pw_hash := crypt(p_password, gen_salt('bf'));

  insert into users(company_id, email, full_name, password_hash, auth_provider, role, is_admin, is_active, status)
  values (
    v_company.id,
    lower(p_email),
    coalesce(nullif(p_full_name,''), split_part(lower(p_email),'@',1)),
    v_pw_hash,
    'password',
    'owner',
    true,
    true,
    'active'
  )
  returning * into v_user;

  -- Enable core modules (best-effort)
  insert into company_modules(company_id, module_id, enabled, enabled_at)
  select v_company.id, m.id, true, now()
  from modules m
  where m.is_core = true
  on conflict do nothing;

  return query
  select v_company.id, v_company.name, v_user.id, v_user.email::text;
end;
$$;

-- Grants so PostgREST roles can call RPC
grant execute on function public.rpc_login(text,text) to anon, authenticated;
grant execute on function public.rpc_register(text,text,text,text) to anon, authenticated;

commit;
