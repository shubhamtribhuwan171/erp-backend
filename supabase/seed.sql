-- Local seed data for ERP demo/testing
-- Safe to re-run: uses deterministic doc numbers + WHERE NOT EXISTS.

begin;

-- ============================================
-- Context
-- ============================================
-- Company: Acme Manufacturing Pvt Ltd (single company expected)
-- Owner user used for created_by

-- ============================================
-- Sales docs (stored in sales_orders)
-- ============================================

-- 2 Quotations (status = 'quotation')
insert into sales_orders (
  company_id, order_no, customer_id, order_date, status, currency_code,
  subtotal_minor, discount_minor, tax_minor, total_minor, notes, created_by_user_id
)
select
  c.id,
  x.order_no,
  cust.id,
  x.order_date,
  'quotation',
  'INR',
  x.subtotal_minor,
  0,
  x.tax_minor,
  x.subtotal_minor + x.tax_minor,
  x.notes,
  u.id
from companies c
join users u on u.company_id = c.id and u.role = 'owner'
join (
  select id, row_number() over (order by created_at) as rn
  from customers
  where company_id = (select id from companies where name = 'Acme Manufacturing Pvt Ltd' limit 1)
) cust on true
join (values
  ('QUO-0001'::text, 1::int, '2026-03-04'::date, 15000000::bigint, 2700000::bigint, 'Demo quotation for testing UI'::text),
  ('QUO-0002'::text, 2::int, '2026-03-05'::date,  8500000::bigint, 1530000::bigint, 'Second quotation (smaller)'::text)
) as x(order_no, customer_rn, order_date, subtotal_minor, tax_minor, notes) on cust.rn = x.customer_rn
where c.name = 'Acme Manufacturing Pvt Ltd'
  and not exists (
    select 1 from sales_orders so where so.company_id = c.id and so.order_no = x.order_no
  );

-- 2 Sales Invoices (status = 'invoiced')
insert into sales_orders (
  company_id, order_no, customer_id, order_date, status, currency_code,
  subtotal_minor, discount_minor, tax_minor, total_minor, notes, created_by_user_id
)
select
  c.id,
  x.order_no,
  cust.id,
  x.order_date,
  'invoiced',
  'INR',
  x.subtotal_minor,
  0,
  x.tax_minor,
  x.subtotal_minor + x.tax_minor,
  x.notes,
  u.id
from companies c
join users u on u.company_id = c.id and u.role = 'owner'
join (
  select id, row_number() over (order by created_at) as rn
  from customers
  where company_id = (select id from companies where name = 'Acme Manufacturing Pvt Ltd' limit 1)
) cust on true
join (values
  ('INV-0001'::text, 3::int, '2026-03-03'::date, 22000000::bigint, 3960000::bigint, 'Demo invoice for testing UI'::text),
  ('INV-0002'::text, 4::int, '2026-03-05'::date,  6200000::bigint, 1116000::bigint, 'Second invoice (smaller)'::text)
) as x(order_no, customer_rn, order_date, subtotal_minor, tax_minor, notes) on cust.rn = x.customer_rn
where c.name = 'Acme Manufacturing Pvt Ltd'
  and not exists (
    select 1 from sales_orders so where so.company_id = c.id and so.order_no = x.order_no
  );

-- 1 Sales Return (prefix SR-xxxx, status = 'return')
insert into sales_orders (
  company_id, order_no, customer_id, order_date, status, currency_code,
  subtotal_minor, discount_minor, tax_minor, total_minor, notes, created_by_user_id
)
select
  c.id,
  'SR-0001',
  cust.id,
  '2026-03-05'::date,
  'return',
  'INR',
  1200000,
  0,
  0,
  1200000,
  'Return: damaged items (demo)',
  u.id
from companies c
join users u on u.company_id = c.id and u.role = 'owner'
join (
  select id, row_number() over (order by created_at) as rn
  from customers
  where company_id = (select id from companies where name = 'Acme Manufacturing Pvt Ltd' limit 1)
) cust on cust.rn = 1
where c.name = 'Acme Manufacturing Pvt Ltd'
  and not exists (
    select 1 from sales_orders so where so.company_id = c.id and so.order_no = 'SR-0001'
  );

-- ============================================
-- Purchases docs (stored in purchase_orders)
-- ============================================

-- 2 GRNs / Receipts (status = 'received')
insert into purchase_orders (
  company_id, po_no, vendor_id, order_date, status, currency_code,
  subtotal_minor, discount_minor, tax_minor, total_minor, notes, created_by_user_id
)
select
  c.id,
  x.po_no,
  v.id,
  x.order_date,
  'received',
  'INR',
  x.subtotal_minor,
  0,
  0,
  x.subtotal_minor,
  x.notes,
  u.id
from companies c
join users u on u.company_id = c.id and u.role = 'owner'
join (
  select id, row_number() over (order by created_at) as rn
  from vendors
  where company_id = (select id from companies where name = 'Acme Manufacturing Pvt Ltd' limit 1)
) v on true
join (values
  ('GRN-0001'::text, 1::int, '2026-03-03'::date, 5400000::bigint, 'Demo GRN receipt'::text),
  ('GRN-0002'::text, 2::int, '2026-03-05'::date, 3100000::bigint, 'Second GRN receipt'::text)
) as x(po_no, vendor_rn, order_date, subtotal_minor, notes) on v.rn = x.vendor_rn
where c.name = 'Acme Manufacturing Pvt Ltd'
  and not exists (
    select 1 from purchase_orders po where po.company_id = c.id and po.po_no = x.po_no
  );

-- 1 Vendor Bill (status = 'invoiced')
insert into purchase_orders (
  company_id, po_no, vendor_id, order_date, status, currency_code,
  subtotal_minor, discount_minor, tax_minor, total_minor, notes, created_by_user_id
)
select
  c.id,
  'BILL-0001',
  v.id,
  '2026-03-04'::date,
  'invoiced',
  'INR',
  7800000,
  0,
  1404000,
  9204000,
  'Demo vendor invoice (bill)',
  u.id
from companies c
join users u on u.company_id = c.id and u.role = 'owner'
join (
  select id, row_number() over (order by created_at) as rn
  from vendors
  where company_id = (select id from companies where name = 'Acme Manufacturing Pvt Ltd' limit 1)
) v on v.rn = 1
where c.name = 'Acme Manufacturing Pvt Ltd'
  and not exists (
    select 1 from purchase_orders po where po.company_id = c.id and po.po_no = 'BILL-0001'
  );

-- 1 Purchase Return (prefix PR-xxxx, status = 'return')
insert into purchase_orders (
  company_id, po_no, vendor_id, order_date, status, currency_code,
  subtotal_minor, discount_minor, tax_minor, total_minor, notes, created_by_user_id
)
select
  c.id,
  'PR-0001',
  v.id,
  '2026-03-05'::date,
  'return',
  'INR',
  1600000,
  0,
  0,
  1600000,
  'Return: wrong items shipped (demo)',
  u.id
from companies c
join users u on u.company_id = c.id and u.role = 'owner'
join (
  select id, row_number() over (order by created_at) as rn
  from vendors
  where company_id = (select id from companies where name = 'Acme Manufacturing Pvt Ltd' limit 1)
) v on v.rn = 2
where c.name = 'Acme Manufacturing Pvt Ltd'
  and not exists (
    select 1 from purchase_orders po where po.company_id = c.id and po.po_no = 'PR-0001'
  );

-- ============================================
-- Line items for seeded Sales/Purchases docs
-- ============================================

-- Add line items to seeded Sales Invoices (INV-0001/INV-0002) so detail pages are useful
DO $$
DECLARE
  v_company uuid;
  v_wh uuid;
BEGIN
  select id into v_company from companies where name = 'Acme Manufacturing Pvt Ltd' limit 1;
  select id into v_wh from warehouses where company_id=v_company order by created_at limit 1;

  if v_company is null or v_wh is null then
    return;
  end if;

  -- INV-0001
  if exists (select 1 from sales_orders where company_id=v_company and order_no='INV-0001') then
    insert into sales_order_items(company_id, sales_order_id, line_no, item_id, description, warehouse_id, qty, unit_id, unit_price_minor, discount_minor, tax_minor, line_total_minor)
    select
      v_company,
      so.id,
      x.line_no,
      ii.id,
      x.description,
      v_wh,
      x.qty,
      ii.unit_id,
      x.unit_price_minor,
      0,
      x.tax_minor,
      x.line_total_minor
    from sales_orders so
    join (values
      (1, 1, 2::numeric, 'Seed item A', 1000000::bigint, 180000::bigint, 2180000::bigint),
      (2, 2, 1::numeric, 'Seed item B',  800000::bigint, 144000::bigint,  944000::bigint)
    ) as x(line_no, item_rn, qty, description, unit_price_minor, tax_minor, line_total_minor) on true
    join (
      select id, unit_id, row_number() over(order by created_at) as rn
      from inventory_items
      where company_id=v_company
    ) ii on ii.rn = x.item_rn
    where so.company_id=v_company and so.order_no='INV-0001'
      and not exists (select 1 from sales_order_items soi where soi.sales_order_id=so.id);
  end if;

  -- INV-0002
  if exists (select 1 from sales_orders where company_id=v_company and order_no='INV-0002') then
    insert into sales_order_items(company_id, sales_order_id, line_no, item_id, description, warehouse_id, qty, unit_id, unit_price_minor, discount_minor, tax_minor, line_total_minor)
    select
      v_company,
      so.id,
      x.line_no,
      ii.id,
      x.description,
      v_wh,
      x.qty,
      ii.unit_id,
      x.unit_price_minor,
      0,
      x.tax_minor,
      x.line_total_minor
    from sales_orders so
    join (values
      (1, 1, 2::numeric, 'Seed item A', 1100000::bigint, 198000::bigint, 2398000::bigint),
      (2, 3, 1::numeric, 'Seed item C',  900000::bigint, 162000::bigint, 1062000::bigint)
    ) as x(line_no, item_rn, qty, description, unit_price_minor, tax_minor, line_total_minor) on true
    join (
      select id, unit_id, row_number() over(order by created_at) as rn
      from inventory_items
      where company_id=v_company
    ) ii on ii.rn = x.item_rn
    where so.company_id=v_company and so.order_no='INV-0002'
      and not exists (select 1 from sales_order_items soi where soi.sales_order_id=so.id);
  end if;
END $$;

-- Add line items to seeded Sales Quotations (QUO-0001/QUO-0002)
DO $$
DECLARE
  v_company uuid;
  v_wh uuid;
BEGIN
  select id into v_company from companies where name = 'Acme Manufacturing Pvt Ltd' limit 1;
  select id into v_wh from warehouses where company_id=v_company order by created_at limit 1;
  if v_company is null or v_wh is null then return; end if;

  -- QUO-0001
  if exists (select 1 from sales_orders where company_id=v_company and order_no='QUO-0001') then
    insert into sales_order_items(company_id, sales_order_id, line_no, item_id, description, warehouse_id, qty, unit_id, unit_price_minor, discount_minor, tax_minor, line_total_minor)
    select v_company, so.id, x.line_no, ii.id, x.description, v_wh, x.qty, ii.unit_id, x.unit_price_minor, 0, x.tax_minor, x.line_total_minor
    from sales_orders so
    join (values
      (1, 1, 5::numeric, 'Quote line A', 900000::bigint, 162000::bigint, 4662000::bigint),
      (2, 2, 2::numeric, 'Quote line B', 700000::bigint, 126000::bigint, 1526000::bigint)
    ) as x(line_no, item_rn, qty, description, unit_price_minor, tax_minor, line_total_minor) on true
    join (select id, unit_id, row_number() over(order by created_at) as rn from inventory_items where company_id=v_company) ii
      on ii.rn = x.item_rn
    where so.company_id=v_company and so.order_no='QUO-0001'
      and not exists (select 1 from sales_order_items soi where soi.sales_order_id=so.id);
  end if;

  -- QUO-0002
  if exists (select 1 from sales_orders where company_id=v_company and order_no='QUO-0002') then
    insert into sales_order_items(company_id, sales_order_id, line_no, item_id, description, warehouse_id, qty, unit_id, unit_price_minor, discount_minor, tax_minor, line_total_minor)
    select v_company, so.id, x.line_no, ii.id, x.description, v_wh, x.qty, ii.unit_id, x.unit_price_minor, 0, x.tax_minor, x.line_total_minor
    from sales_orders so
    join (values
      (1, 1, 2::numeric, 'Quote line A', 950000::bigint, 171000::bigint, 2071000::bigint),
      (2, 3, 1::numeric, 'Quote line C', 600000::bigint, 108000::bigint,  708000::bigint)
    ) as x(line_no, item_rn, qty, description, unit_price_minor, tax_minor, line_total_minor) on true
    join (select id, unit_id, row_number() over(order by created_at) as rn from inventory_items where company_id=v_company) ii
      on ii.rn = x.item_rn
    where so.company_id=v_company and so.order_no='QUO-0002'
      and not exists (select 1 from sales_order_items soi where soi.sales_order_id=so.id);
  end if;
END $$;

-- Add line items to seeded Sales Return (SR-0001)
DO $$
DECLARE
  v_company uuid;
  v_wh uuid;
BEGIN
  select id into v_company from companies where name = 'Acme Manufacturing Pvt Ltd' limit 1;
  select id into v_wh from warehouses where company_id=v_company order by created_at limit 1;
  if v_company is null or v_wh is null then return; end if;

  if exists (select 1 from sales_orders where company_id=v_company and order_no='SR-0001') then
    insert into sales_order_items(company_id, sales_order_id, line_no, item_id, description, warehouse_id, qty, unit_id, unit_price_minor, discount_minor, tax_minor, line_total_minor)
    select v_company, so.id, 1, ii.id, 'Returned item (demo)', v_wh, 1::numeric, ii.unit_id, 600000::bigint, 0, 0, 600000::bigint
    from sales_orders so
    join (select id, unit_id from inventory_items where company_id=v_company order by created_at limit 1) ii on true
    where so.company_id=v_company and so.order_no='SR-0001'
      and not exists (select 1 from sales_order_items soi where soi.sales_order_id=so.id);
  end if;
END $$;

-- Add line items to seeded Purchases docs (GRN/BILL/PR)
DO $$
DECLARE
  v_company uuid;
  v_wh uuid;
BEGIN
  select id into v_company from companies where name = 'Acme Manufacturing Pvt Ltd' limit 1;
  select id into v_wh from warehouses where company_id=v_company order by created_at limit 1;
  if v_company is null or v_wh is null then return; end if;

  -- GRN-0001
  if exists (select 1 from purchase_orders where company_id=v_company and po_no='GRN-0001') then
    insert into purchase_order_items(company_id, purchase_order_id, line_no, item_id, description, warehouse_id, qty, unit_id, unit_cost_minor, discount_minor, tax_minor, line_total_minor, received_qty)
    select v_company, po.id, x.line_no, ii.id, x.description, v_wh, x.qty, ii.unit_id, x.unit_cost_minor, 0, 0, x.line_total_minor, x.qty
    from purchase_orders po
    join (values
      (1, 1, 10::numeric, 'GRN item A', 350000::bigint, 3500000::bigint),
      (2, 2,  5::numeric, 'GRN item B', 380000::bigint, 1900000::bigint)
    ) as x(line_no, item_rn, qty, description, unit_cost_minor, line_total_minor) on true
    join (select id, unit_id, row_number() over(order by created_at) as rn from inventory_items where company_id=v_company) ii
      on ii.rn = x.item_rn
    where po.company_id=v_company and po.po_no='GRN-0001'
      and not exists (select 1 from purchase_order_items poi where poi.purchase_order_id=po.id);
  end if;

  -- BILL-0001
  if exists (select 1 from purchase_orders where company_id=v_company and po_no='BILL-0001') then
    insert into purchase_order_items(company_id, purchase_order_id, line_no, item_id, description, warehouse_id, qty, unit_id, unit_cost_minor, discount_minor, tax_minor, line_total_minor)
    select v_company, po.id, x.line_no, ii.id, x.description, v_wh, x.qty, ii.unit_id, x.unit_cost_minor, 0, x.tax_minor, x.line_total_minor
    from purchase_orders po
    join (values
      (1, 1, 6::numeric, 'Bill item A', 1000000::bigint, 180000::bigint, 6180000::bigint)
    ) as x(line_no, item_rn, qty, description, unit_cost_minor, tax_minor, line_total_minor) on true
    join (select id, unit_id, row_number() over(order by created_at) as rn from inventory_items where company_id=v_company) ii
      on ii.rn = x.item_rn
    where po.company_id=v_company and po.po_no='BILL-0001'
      and not exists (select 1 from purchase_order_items poi where poi.purchase_order_id=po.id);
  end if;

  -- PR-0001
  if exists (select 1 from purchase_orders where company_id=v_company and po_no='PR-0001') then
    insert into purchase_order_items(company_id, purchase_order_id, line_no, item_id, description, warehouse_id, qty, unit_id, unit_cost_minor, discount_minor, tax_minor, line_total_minor)
    select v_company, po.id, 1, ii.id, 'Returned to vendor (demo)', v_wh, 1::numeric, ii.unit_id, 400000::bigint, 0, 0, 400000::bigint
    from purchase_orders po
    join (select id, unit_id from inventory_items where company_id=v_company order by created_at limit 1) ii on true
    where po.company_id=v_company and po.po_no='PR-0001'
      and not exists (select 1 from purchase_order_items poi where poi.purchase_order_id=po.id);
  end if;
END $$;

-- Seed attendance for today (all active employees -> present)
DO $$
DECLARE
  v_company uuid;
  v_user uuid;
BEGIN
  select id into v_company from companies where name='Acme Manufacturing Pvt Ltd' limit 1;
  select id into v_user from users where company_id=v_company and role='owner' limit 1;
  if v_company is null or v_user is null then return; end if;

  insert into attendance_records(company_id, employee_id, attendance_date, status, created_by_user_id)
  select v_company, e.id, current_date, 'present', v_user
  from employees e
  where e.company_id=v_company and e.status='active'
  on conflict (company_id, employee_id, attendance_date) do nothing;
END $$;

-- ============================================
-- Extra stock movements for Inventory screens
-- ============================================

-- Transfer (creates two txns with same reference_id)
do $$
declare
  v_company uuid;
  v_user uuid;
  v_item uuid;
  v_unit uuid;
  v_from uuid;
  v_to uuid;
  v_ref uuid := gen_random_uuid();
begin
  select id into v_company from companies where name = 'Acme Manufacturing Pvt Ltd' limit 1;
  select id into v_user from users where company_id = v_company and role = 'owner' limit 1;
  select id, unit_id into v_item, v_unit from inventory_items where company_id = v_company order by created_at limit 1;
  select id into v_from from warehouses where company_id = v_company order by created_at limit 1;
  select id into v_to from warehouses where company_id = v_company order by created_at desc limit 1;

  if v_company is null or v_user is null or v_item is null or v_unit is null or v_from is null or v_to is null then
    return;
  end if;

  -- only seed once
  if exists (select 1 from stock_transactions where company_id=v_company and reference_type='transfer' and notes like 'Seeded transfer%' ) then
    return;
  end if;

  insert into stock_transactions(company_id, txn_type, txn_date, item_id, warehouse_id, qty, unit_id, reference_type, reference_id, notes, created_by_user_id)
  values
    (v_company, 'transfer_out', now() - interval '2 hours', v_item, v_from, -1, v_unit, 'transfer', v_ref, 'Seeded transfer OUT (demo)', v_user),
    (v_company, 'transfer_in',  now() - interval '2 hours', v_item, v_to,    1, v_unit, 'transfer', v_ref, 'Seeded transfer IN (demo)',  v_user);
end $$;

-- Adjustment (one txn)
insert into stock_transactions(company_id, txn_type, txn_date, item_id, warehouse_id, qty, unit_id, notes, created_by_user_id)
select
  c.id,
  'adjustment_in',
  now() - interval '1 hour',
  i.id,
  w.id,
  2,
  i.unit_id,
  'Seeded adjustment (demo)',
  u.id
from companies c
join users u on u.company_id=c.id and u.role='owner'
join inventory_items i on i.company_id=c.id
join warehouses w on w.company_id=c.id
where c.name='Acme Manufacturing Pvt Ltd'
  and not exists (
    select 1 from stock_transactions st
    where st.company_id=c.id and st.notes='Seeded adjustment (demo)'
  )
limit 1;

-- ============================================
-- Stock movements tied to seeded documents (so ledger feels real)
-- ============================================

DO $$
DECLARE
  v_company uuid;
  v_user uuid;
  v_wh uuid;
BEGIN
  select id into v_company from companies where name='Acme Manufacturing Pvt Ltd' limit 1;
  select id into v_user from users where company_id=v_company and role='owner' limit 1;
  select id into v_wh from warehouses where company_id=v_company order by created_at limit 1;

  if v_company is null or v_user is null or v_wh is null then
    return;
  end if;

  -- Purchase receipt -> stock in
  insert into stock_transactions(company_id, txn_type, txn_date, item_id, warehouse_id, qty, unit_id, unit_cost_minor, reference_type, reference_id, notes, created_by_user_id)
  select
    v_company,
    'purchase_in',
    now() - interval '3 days',
    poi.item_id,
    coalesce(poi.warehouse_id, v_wh),
    poi.qty,
    poi.unit_id,
    poi.unit_cost_minor,
    'purchase_receipt',
    po.id,
    'Seeded from GRN (demo)',
    v_user
  from purchase_orders po
  join purchase_order_items poi on poi.purchase_order_id=po.id and poi.company_id=po.company_id
  where po.company_id=v_company and po.po_no='GRN-0001'
    and not exists (
      select 1 from stock_transactions st
      where st.company_id=v_company and st.reference_type='purchase_receipt' and st.reference_id=po.id
    );

  -- Sales invoice -> stock out
  insert into stock_transactions(company_id, txn_type, txn_date, item_id, warehouse_id, qty, unit_id, reference_type, reference_id, notes, created_by_user_id)
  select
    v_company,
    'sales_out',
    now() - interval '2 days',
    soi.item_id,
    coalesce(soi.warehouse_id, v_wh),
    -1 * soi.qty,
    soi.unit_id,
    'sales_invoice',
    so.id,
    'Seeded from Invoice (demo)',
    v_user
  from sales_orders so
  join sales_order_items soi on soi.sales_order_id=so.id and soi.company_id=so.company_id
  where so.company_id=v_company and so.order_no='INV-0001'
    and not exists (
      select 1 from stock_transactions st
      where st.company_id=v_company and st.reference_type='sales_invoice' and st.reference_id=so.id
    );

  -- Sales return -> stock in
  insert into stock_transactions(company_id, txn_type, txn_date, item_id, warehouse_id, qty, unit_id, reference_type, reference_id, notes, created_by_user_id)
  select
    v_company,
    'sales_return_in',
    now() - interval '1 days',
    soi.item_id,
    coalesce(soi.warehouse_id, v_wh),
    soi.qty,
    soi.unit_id,
    'sales_return',
    so.id,
    'Seeded from Sales Return (demo)',
    v_user
  from sales_orders so
  join sales_order_items soi on soi.sales_order_id=so.id and soi.company_id=so.company_id
  where so.company_id=v_company and so.order_no='SR-0001'
    and not exists (
      select 1 from stock_transactions st
      where st.company_id=v_company and st.reference_type='sales_return' and st.reference_id=so.id
    );

  -- Purchase return -> stock out
  insert into stock_transactions(company_id, txn_type, txn_date, item_id, warehouse_id, qty, unit_id, unit_cost_minor, reference_type, reference_id, notes, created_by_user_id)
  select
    v_company,
    'purchase_return_out',
    now() - interval '1 days',
    poi.item_id,
    coalesce(poi.warehouse_id, v_wh),
    -1 * poi.qty,
    poi.unit_id,
    poi.unit_cost_minor,
    'purchase_return',
    po.id,
    'Seeded from Purchase Return (demo)',
    v_user
  from purchase_orders po
  join purchase_order_items poi on poi.purchase_order_id=po.id and poi.company_id=po.company_id
  where po.company_id=v_company and po.po_no='PR-0001'
    and not exists (
      select 1 from stock_transactions st
      where st.company_id=v_company and st.reference_type='purchase_return' and st.reference_id=po.id
    );
END $$;

commit;
