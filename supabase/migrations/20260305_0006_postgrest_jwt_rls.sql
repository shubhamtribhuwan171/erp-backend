-- Migration: PostgREST-compatible JWT helpers + tenant RLS policies
-- Date: 2026-03-05
-- This enables DB-enforced tenant isolation using JWT claims (no Supabase Auth required).
-- Requires PostgREST to be configured with PGRST_JWT_SECRET matching our JWT_SECRET.

begin;

-- 1) Provide minimal auth schema helpers expected by many Supabase examples.
create schema if not exists auth;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
$$;

create or replace function request_company_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.company_id', true), '')::uuid
$$;

create or replace function request_user_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

-- 2) Link public.users to JWT subject (optional)
alter table users add column if not exists auth_user_id uuid;
create unique index if not exists uq_users_auth_user_id on users(auth_user_id);

-- 3) Tenant policies: allow access only to rows matching request_company_id()
-- NOTE: This assumes API always sets company_id claim correctly.

-- Helper to create a policy once
create or replace function _ensure_policy(
  p_table text,
  p_policy text,
  p_cmd text,
  p_using text,
  p_check text
) returns void
language plpgsql
as $$
declare
  v_exists boolean;
  v_sql text;
begin
  select exists(
    select 1
    from pg_policies
    where schemaname='public'
      and tablename=p_table
      and policyname=p_policy
  ) into v_exists;

  if v_exists then
    return;
  end if;

  v_sql := format(
    'create policy %I on public.%I for %s using (%s) with check (%s)',
    p_policy,
    p_table,
    p_cmd,
    p_using,
    p_check
  );

  execute v_sql;
end $$;

-- Customers
select _ensure_policy('customers','p_customers_tenant','all','company_id = request_company_id()','company_id = request_company_id()');
-- Vendors
select _ensure_policy('vendors','p_vendors_tenant','all','company_id = request_company_id()','company_id = request_company_id()');
-- Inventory
select _ensure_policy('inventory_items','p_inventory_items_tenant','all','company_id = request_company_id()','company_id = request_company_id()');
select _ensure_policy('inventory_categories','p_inventory_categories_tenant','all','company_id = request_company_id()','company_id = request_company_id()');
select _ensure_policy('warehouses','p_warehouses_tenant','all','company_id = request_company_id()','company_id = request_company_id()');
select _ensure_policy('units','p_units_tenant','all','company_id = request_company_id()','company_id = request_company_id()');
-- Docs
select _ensure_policy('sales_orders','p_sales_orders_tenant','all','company_id = request_company_id()','company_id = request_company_id()');
select _ensure_policy('sales_order_items','p_sales_order_items_tenant','all','company_id = request_company_id()','company_id = request_company_id()');
select _ensure_policy('purchase_orders','p_purchase_orders_tenant','all','company_id = request_company_id()','company_id = request_company_id()');
select _ensure_policy('purchase_order_items','p_purchase_order_items_tenant','all','company_id = request_company_id()','company_id = request_company_id()');
-- Stock
select _ensure_policy('stock_transactions','p_stock_transactions_tenant','all','company_id = request_company_id()','company_id = request_company_id()');
select _ensure_policy('inventory_reservations','p_inventory_reservations_tenant','all','company_id = request_company_id()','company_id = request_company_id()');
-- HR
select _ensure_policy('employees','p_employees_tenant','all','company_id = request_company_id()','company_id = request_company_id()');
select _ensure_policy('departments','p_departments_tenant','all','company_id = request_company_id()','company_id = request_company_id()');
select _ensure_policy('attendance_records','p_attendance_records_tenant','all','company_id = request_company_id()','company_id = request_company_id()');

-- Keep helper internal (optional):
-- drop function _ensure_policy(text,text,text,text,text);

commit;
