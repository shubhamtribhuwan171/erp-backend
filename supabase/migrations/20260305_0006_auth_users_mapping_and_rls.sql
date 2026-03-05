-- Migration: Map Supabase Auth users to public.users + add tenant RLS policies
-- Date: 2026-03-05
-- Assumes Supabase Auth is enabled.

begin;

-- 1) Link table: add auth_user_id to public.users
alter table users
  add column if not exists auth_user_id uuid;

create unique index if not exists uq_users_auth_user_id on users(auth_user_id);

-- 2) Helper: get current user/company from auth.uid()
create or replace function current_app_user_id()
returns uuid
language sql
stable
as $$
  select u.id
  from users u
  where u.auth_user_id = auth.uid()
    and u.is_active = true
  limit 1
$$;

create or replace function current_company_id()
returns uuid
language sql
stable
as $$
  select u.company_id
  from users u
  where u.auth_user_id = auth.uid()
    and u.is_active = true
  limit 1
$$;

-- 3) Basic tenant policies (deny-by-default already, now allow within tenant)
-- Customers
create policy if not exists p_customers_tenant_select on customers
  for select
  using (company_id = current_company_id());

create policy if not exists p_customers_tenant_insert on customers
  for insert
  with check (company_id = current_company_id());

create policy if not exists p_customers_tenant_update on customers
  for update
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

create policy if not exists p_customers_tenant_delete on customers
  for delete
  using (company_id = current_company_id());

-- Vendors
create policy if not exists p_vendors_tenant_select on vendors
  for select
  using (company_id = current_company_id());
create policy if not exists p_vendors_tenant_insert on vendors
  for insert
  with check (company_id = current_company_id());
create policy if not exists p_vendors_tenant_update on vendors
  for update
  using (company_id = current_company_id())
  with check (company_id = current_company_id());
create policy if not exists p_vendors_tenant_delete on vendors
  for delete
  using (company_id = current_company_id());

-- Inventory
create policy if not exists p_inventory_items_tenant_select on inventory_items
  for select using (company_id = current_company_id());
create policy if not exists p_inventory_items_tenant_write on inventory_items
  for all
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

create policy if not exists p_warehouses_tenant_write on warehouses
  for all
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

create policy if not exists p_units_tenant_write on units
  for all
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

-- Sales/Purchases documents
create policy if not exists p_sales_orders_tenant_write on sales_orders
  for all
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

create policy if not exists p_sales_order_items_tenant_write on sales_order_items
  for all
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

create policy if not exists p_purchase_orders_tenant_write on purchase_orders
  for all
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

create policy if not exists p_purchase_order_items_tenant_write on purchase_order_items
  for all
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

-- Stock movements
create policy if not exists p_stock_transactions_tenant_write on stock_transactions
  for all
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

-- HR
create policy if not exists p_employees_tenant_write on employees
  for all
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

create policy if not exists p_departments_tenant_write on departments
  for all
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

create policy if not exists p_attendance_records_tenant_write on attendance_records
  for all
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

commit;
