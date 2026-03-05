-- Migration: Enable RLS for core multi-tenant tables (companies/users/company_modules)
-- Date: 2026-03-05

begin;

-- Enable RLS
alter table if exists companies enable row level security;
alter table if exists users enable row level security;
alter table if exists company_modules enable row level security;

-- Companies: only your own company row
DO $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='companies' and policyname='p_companies_tenant'
  ) then
    execute 'create policy p_companies_tenant on public.companies for all using (id = request_company_id()) with check (id = request_company_id())';
  end if;
end $$;

-- Users: only users in your company
DO $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='users' and policyname='p_users_tenant'
  ) then
    execute 'create policy p_users_tenant on public.users for all using (company_id = request_company_id()) with check (company_id = request_company_id())';
  end if;
end $$;

-- Company modules: only your company
DO $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='company_modules' and policyname='p_company_modules_tenant'
  ) then
    execute 'create policy p_company_modules_tenant on public.company_modules for all using (company_id = request_company_id()) with check (company_id = request_company_id())';
  end if;
end $$;

commit;
