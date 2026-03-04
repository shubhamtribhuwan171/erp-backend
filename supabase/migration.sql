-- ERP Postgres Migration V1
-- Clean schema for production-ready ERP

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists citext;

-- Helper function
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================
-- Tenant + Access
-- =====================

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  gstin text,
  base_currency_code char(3) not null default 'INR',
  timezone text not null default 'Asia/Kolkata',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid,
  updated_by_user_id uuid,
  status text not null default 'active'
);

create table users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  email citext not null,
  full_name text,
  phone text,
  password_hash text,
  auth_provider text not null default 'password',
  role text not null default 'user',
  is_admin boolean not null default false,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid,
  updated_by_user_id uuid,
  status text not null default 'active'
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  name text not null,
  description text,
  is_core boolean not null default false,
  sort_order int not null default 0
);

create table company_modules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  module_id uuid not null references modules(id) on delete cascade,
  enabled boolean not null default true,
  enabled_at timestamptz,
  enabled_by_user_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================
-- CRM / Parties
-- =====================

create table customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  code text not null,
  name text not null,
  email citext,
  phone text,
  billing_address jsonb,
  shipping_address jsonb,
  tax_id text,
  payment_terms_days int,
  credit_limit_minor bigint,
  currency_code char(3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references users(id),
  updated_by_user_id uuid references users(id),
  status text not null default 'active'
);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  code text not null,
  name text not null,
  email citext,
  phone text,
  address jsonb,
  tax_id text,
  payment_terms_days int,
  default_lead_time_days int,
  bank_details jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references users(id),
  updated_by_user_id uuid references users(id),
  status text not null default 'active'
);

-- =====================
-- Inventory Master Data
-- =====================

create table inventory_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  code text not null,
  name text not null,
  parent_category_id uuid references inventory_categories(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references users(id),
  updated_by_user_id uuid references users(id),
  status text not null default 'active'
);

create table units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  code text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references users(id),
  updated_by_user_id uuid references users(id),
  status text not null default 'active'
);

create table warehouses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  code text not null,
  name text not null,
  address jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references users(id),
  updated_by_user_id uuid references users(id),
  status text not null default 'active'
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  code text not null,
  name text not null,
  type text not null,
  subtype text,
  parent_account_id uuid references accounts(id),
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references users(id),
  updated_by_user_id uuid references users(id),
  status text not null default 'active'
);

create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  sku text not null,
  name text not null,
  description text,
  category_id uuid references inventory_categories(id),
  unit_id uuid not null references units(id),
  track_inventory boolean not null default true,
  is_serialized boolean not null default false,
  is_batch_tracked boolean not null default false,
  reorder_level numeric(18,6),
  reorder_qty numeric(18,6),
  standard_cost_minor bigint,
  sale_price_minor bigint,
  currency_code char(3),
  inventory_account_id uuid references accounts(id),
  cogs_account_id uuid references accounts(id),
  revenue_account_id uuid references accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references users(id),
  updated_by_user_id uuid references users(id),
  status text not null default 'active'
);

-- =====================
-- Inventory Movements
-- =====================

create table stock_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  txn_type text not null,
  txn_date timestamptz not null,
  item_id uuid not null references inventory_items(id),
  warehouse_id uuid not null references warehouses(id),
  qty numeric(18,6) not null,
  unit_id uuid not null references units(id),
  unit_cost_minor bigint,
  reference_type text,
  reference_id uuid,
  batch_no text,
  serial_no text,
  notes text,
  created_by_user_id uuid references users(id),
  created_at timestamptz not null default now()
);

-- =====================
-- Sales
-- =====================

create table sales_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  order_no text not null,
  customer_id uuid not null references customers(id),
  order_date date not null,
  expected_ship_date date,
  status text not null default 'draft',
  currency_code char(3) not null,
  subtotal_minor bigint not null default 0,
  discount_minor bigint not null default 0,
  tax_minor bigint not null default 0,
  total_minor bigint not null default 0,
  billing_address jsonb,
  shipping_address jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references users(id),
  updated_by_user_id uuid references users(id)
);

create table sales_order_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  sales_order_id uuid not null references sales_orders(id) on delete cascade,
  line_no int not null,
  item_id uuid references inventory_items(id),
  description text,
  warehouse_id uuid references warehouses(id),
  qty numeric(18,6) not null,
  unit_id uuid not null references units(id),
  unit_price_minor bigint not null default 0,
  discount_minor bigint not null default 0,
  tax_minor bigint not null default 0,
  line_total_minor bigint not null default 0,
  fulfilled_qty numeric(18,6) not null default 0
);

-- =====================
-- Purchases
-- =====================

create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  po_no text not null,
  vendor_id uuid not null references vendors(id),
  order_date date not null,
  expected_receipt_date date,
  status text not null default 'draft',
  currency_code char(3) not null,
  subtotal_minor bigint not null default 0,
  discount_minor bigint not null default 0,
  tax_minor bigint not null default 0,
  total_minor bigint not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references users(id),
  updated_by_user_id uuid references users(id)
);

create table purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  line_no int not null,
  item_id uuid references inventory_items(id),
  description text,
  warehouse_id uuid references warehouses(id),
  qty numeric(18,6) not null,
  unit_id uuid not null references units(id),
  unit_cost_minor bigint not null default 0,
  discount_minor bigint not null default 0,
  tax_minor bigint not null default 0,
  line_total_minor bigint not null default 0,
  received_qty numeric(18,6) not null default 0
);

-- =====================
-- HR
-- =====================

create table departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  code text not null,
  name text not null,
  parent_department_id uuid references departments(id),
  manager_employee_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references users(id),
  updated_by_user_id uuid references users(id),
  status text not null default 'active'
);

create table employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_no text not null,
  user_id uuid references users(id),
  department_id uuid references departments(id),
  name text not null,
  email citext,
  phone text,
  job_title text,
  hire_date date,
  exit_date date,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references users(id),
  updated_by_user_id uuid references users(id)
);

alter table departments
  add constraint fk_departments_manager_employee
  foreign key (manager_employee_id) references employees(id);

-- =====================
-- Accounting: ledger
-- =====================

create table ledger_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  entry_no text not null,
  entry_date date not null,
  status text not null default 'draft',
  source_type text,
  source_id uuid,
  memo text,
  posted_at timestamptz,
  posted_by_user_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references users(id),
  updated_by_user_id uuid references users(id)
);

create table ledger_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  ledger_entry_id uuid not null references ledger_entries(id) on delete cascade,
  line_no int not null,
  account_id uuid not null references accounts(id),
  description text,
  currency_code char(3) not null,
  debit_minor bigint not null default 0,
  credit_minor bigint not null default 0,
  department_id uuid references departments(id),
  customer_id uuid references customers(id),
  vendor_id uuid references vendors(id),
  employee_id uuid references employees(id)
);

alter table ledger_lines
  add constraint chk_ledger_lines_debit_credit
  check (
    debit_minor >= 0 and credit_minor >= 0
    and not (debit_minor > 0 and credit_minor > 0)
  );

-- =====================
-- Audit
-- =====================

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  actor_user_id uuid references users(id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  before jsonb,
  after jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- =====================
-- Constraints & Indexes
-- =====================

-- Uniques
create unique index uq_users_company_email on users(company_id, email);
create unique index uq_modules_key on modules(key);
create unique index uq_company_modules_company_module on company_modules(company_id, module_id);
create unique index uq_customers_company_code on customers(company_id, code);
create unique index uq_vendors_company_code on vendors(company_id, code);
create unique index uq_inventory_categories_company_code on inventory_categories(company_id, code);
create unique index uq_units_company_code on units(company_id, code);
create unique index uq_warehouses_company_code on warehouses(company_id, code);
create unique index uq_inventory_items_company_sku on inventory_items(company_id, sku);
create unique index uq_sales_orders_company_order_no on sales_orders(company_id, order_no);
create unique index uq_sales_order_items_so_line on sales_order_items(sales_order_id, line_no);
create unique index uq_purchase_orders_company_po_no on purchase_orders(company_id, po_no);
create unique index uq_purchase_order_items_po_line on purchase_order_items(purchase_order_id, line_no);
create unique index uq_accounts_company_code on accounts(company_id, code);
create unique index uq_ledger_entries_company_entry_no on ledger_entries(company_id, entry_no);
create unique index uq_ledger_lines_entry_line on ledger_lines(ledger_entry_id, line_no);
create unique index uq_departments_company_code on departments(company_id, code);
create unique index uq_employees_company_employee_no on employees(company_id, employee_no);

-- Partial unique: only one default warehouse per company
create unique index uq_warehouses_one_default_per_company on warehouses(company_id) where is_default = true;

-- Query indexes
create index ix_customers_company_name on customers(company_id, name);
create index ix_inventory_items_company_name on inventory_items(company_id, name);
create index ix_sales_orders_company_customer_date on sales_orders(company_id, customer_id, order_date);
create index ix_purchase_orders_company_vendor_date on purchase_orders(company_id, vendor_id, order_date);
create index ix_stock_txn_item_wh_date on stock_transactions(company_id, item_id, warehouse_id, txn_date);
create index ix_stock_txn_reference on stock_transactions(company_id, reference_type, reference_id);
create index ix_ledger_entries_company_date on ledger_entries(company_id, entry_date);
create index ix_audit_entity on audit_logs(company_id, entity_type, entity_id, created_at);
create index ix_audit_actor on audit_logs(company_id, actor_user_id, created_at);

-- Status checks
alter table sales_orders add constraint chk_sales_orders_status check (status in ('draft','confirmed','shipped','invoiced','cancelled'));
alter table purchase_orders add constraint chk_purchase_orders_status check (status in ('draft','approved','sent','part_received','closed','cancelled'));
alter table ledger_entries add constraint chk_ledger_entries_status check (status in ('draft','posted','void'));

-- =====================
-- Triggers
-- =====================

create trigger trg_companies_set_updated_at before update on companies for each row execute function set_updated_at();
create trigger trg_users_set_updated_at before update on users for each row execute function set_updated_at();
create trigger trg_company_modules_set_updated_at before update on company_modules for each row execute function set_updated_at();
create trigger trg_customers_set_updated_at before update on customers for each row execute function set_updated_at();
create trigger trg_vendors_set_updated_at before update on vendors for each row execute function set_updated_at();
create trigger trg_inventory_categories_set_updated_at before update on inventory_categories for each row execute function set_updated_at();
create trigger trg_units_set_updated_at before update on units for each row execute function set_updated_at();
create trigger trg_warehouses_set_updated_at before update on warehouses for each row execute function set_updated_at();
create trigger trg_inventory_items_set_updated_at before update on inventory_items for each row execute function set_updated_at();
create trigger trg_sales_orders_set_updated_at before update on sales_orders for each row execute function set_updated_at();
create trigger trg_purchase_orders_set_updated_at before update on purchase_orders for each row execute function set_updated_at();
create trigger trg_accounts_set_updated_at before update on accounts for each row execute function set_updated_at();
create trigger trg_ledger_entries_set_updated_at before update on ledger_entries for each row execute function set_updated_at();
create trigger trg_departments_set_updated_at before update on departments for each row execute function set_updated_at();
create trigger trg_employees_set_updated_at before update on employees for each row execute function set_updated_at();

-- =====================
-- Views
-- =====================

create or replace view stock_balances as
select company_id, item_id, warehouse_id, sum(qty) as qty_on_hand
from stock_transactions
group by company_id, item_id, warehouse_id;

create or replace view trial_balance as
select ll.company_id, ll.account_id,
  sum(ll.debit_minor) as debit_total_minor,
  sum(ll.credit_minor) as credit_total_minor,
  sum(ll.debit_minor - ll.credit_minor) as balance_minor
from ledger_lines ll
join ledger_entries le on le.id = ll.ledger_entry_id
where le.status = 'posted'
group by ll.company_id, ll.account_id;

-- =====================
-- Industry Profiles / Experience Types
-- =====================

-- Profiles define default enabled modules/workflows per company.
create table if not exists industry_profiles (
  code text primary key,
  name text not null,
  default_features jsonb not null default '{}'::jsonb,
  default_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed base profiles (idempotent).
insert into industry_profiles (code, name, default_features, default_settings)
values
  (
    'generic',
    'Generic',
    '{"modules":{"inventory":true,"accounting":true,"crm":true,"hr":true,"sales":true,"purchases":true}}'::jsonb,
    '{}'::jsonb
  ),
  (
    'retail_distribution',
    'Retail / Distribution',
    '{"modules":{"inventory":true,"accounting":true,"crm":true,"hr":false,"sales":true,"purchases":true}}'::jsonb,
    '{}'::jsonb
  ),
  (
    'services',
    'Services',
    '{"modules":{"inventory":false,"accounting":true,"crm":true,"hr":true,"sales":true,"purchases":false}}'::jsonb,
    '{}'::jsonb
  ),
  (
    'manufacturing',
    'Manufacturing',
    '{"modules":{"inventory":true,"accounting":true,"crm":true,"hr":true,"sales":true,"purchases":true,"manufacturing":true}}'::jsonb,
    '{}'::jsonb
  ),
  (
    'logistics',
    'Logistics / Warehousing',
    '{"modules":{"inventory":true,"accounting":false,"crm":false,"hr":false,"sales":true,"purchases":true,"logistics":true}}'::jsonb,
    '{}'::jsonb
  )
on conflict (code) do update
set
  name = excluded.name,
  default_features = excluded.default_features,
  default_settings = excluded.default_settings;

-- Company-level knobs for experience selection.
alter table companies
  add column if not exists industry_type text not null default 'generic',
  add column if not exists profile_version int not null default 1,
  add column if not exists features jsonb not null default '{}'::jsonb;

-- Add/ensure FK now that defaults exist.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_companies_industry_type'
  ) then
    alter table companies
      add constraint fk_companies_industry_type
      foreign key (industry_type) references industry_profiles(code);
  end if;
end $$;

create index if not exists ix_companies_industry_type on companies(industry_type);

-- Keep industry_profiles.updated_at current
create trigger trg_industry_profiles_set_updated_at
before update on industry_profiles
for each row execute function set_updated_at();
