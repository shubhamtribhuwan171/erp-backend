-- Migration: document sequences + stock balances view + inventory reservations
-- Date: 2026-03-05
-- Idempotent / safe-ish: uses IF NOT EXISTS and CREATE OR REPLACE.

-- =====================
-- 1) Document sequences (race-safe numbering)
-- =====================

create table if not exists document_sequences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  doc_type text not null, -- e.g. sales_order, purchase_order, sales_invoice, purchase_invoice
  prefix text not null,   -- e.g. SO, PO, INV
  next_number bigint not null default 1,
  padding int not null default 4,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references users(id),
  updated_by_user_id uuid references users(id),
  status text not null default 'active',
  unique (company_id, doc_type)
);

create index if not exists ix_document_sequences_company on document_sequences(company_id);

-- next_doc_no(company_id, doc_type) -> returns formatted doc no and increments sequence
create or replace function next_doc_no(p_company_id uuid, p_doc_type text)
returns text
language plpgsql
as $$
declare
  v_prefix text;
  v_next bigint;
  v_padding int;
  v_out text;
begin
  -- Row-level lock ensures concurrency safety.
  select prefix, next_number, padding
    into v_prefix, v_next, v_padding
  from document_sequences
  where company_id = p_company_id and doc_type = p_doc_type
  for update;

  if v_prefix is null then
    raise exception 'Missing document sequence for doc_type=%', p_doc_type;
  end if;

  v_out := v_prefix || '-' || lpad(v_next::text, v_padding, '0');

  update document_sequences
    set next_number = next_number + 1,
        updated_at = now()
  where company_id = p_company_id and doc_type = p_doc_type;

  return v_out;
end;
$$;

-- =====================
-- 2) Stock balances view (fast read model)
-- =====================

-- NOTE: qty in stock_transactions is assumed positive=in, negative=out.
create or replace view stock_balances as
select
  company_id,
  item_id,
  warehouse_id,
  sum(qty) as qty_on_hand
from stock_transactions
group by company_id, item_id, warehouse_id;

-- =====================
-- 3) Inventory reservations (prevent oversell)
-- =====================

create table if not exists inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  item_id uuid not null references inventory_items(id),
  warehouse_id uuid not null references warehouses(id),
  qty numeric(18,6) not null,
  source_type text not null, -- e.g. sales_order
  source_id uuid not null,
  status text not null default 'active', -- active/released/consumed
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_user_id uuid references users(id),
  updated_by_user_id uuid references users(id)
);

create index if not exists ix_inventory_reservations_lookup on inventory_reservations(company_id, item_id, warehouse_id);
create index if not exists ix_inventory_reservations_source on inventory_reservations(company_id, source_type, source_id);

-- Trigger updated_at
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_document_sequences_set_updated_at') then
    create trigger trg_document_sequences_set_updated_at
    before update on document_sequences
    for each row execute function set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_inventory_reservations_set_updated_at') then
    create trigger trg_inventory_reservations_set_updated_at
    before update on inventory_reservations
    for each row execute function set_updated_at();
  end if;
end $$;

-- Seed default sequences (safe upsert)
insert into document_sequences(company_id, doc_type, prefix, next_number, padding)
select c.id, x.doc_type, x.prefix, 1, 4
from companies c
cross join (values
  ('sales_order','SO'),
  ('purchase_order','PO'),
  ('sales_invoice','INV'),
  ('purchase_invoice','BILL'),
  ('customer_receipt','RCPT'),
  ('vendor_payment','PAY')
) as x(doc_type, prefix)
on conflict (company_id, doc_type) do nothing;
