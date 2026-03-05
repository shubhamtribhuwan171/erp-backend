-- Migration: align document status check constraints with API expectations
-- Date: 2026-03-05
-- Idempotent-ish: drops and recreates check constraints if present.

begin;

-- =========================
-- sales_orders statuses
-- API uses: draft, confirmed, shipped, invoiced, cancelled, quotation, return
-- =========================

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'chk_sales_orders_status') then
    alter table sales_orders drop constraint chk_sales_orders_status;
  end if;

  alter table sales_orders
    add constraint chk_sales_orders_status
    check (status = any (array[
      'draft',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'invoiced',
      'cancelled',
      'quotation',
      'return'
    ]));
end $$;

-- =========================
-- purchase_orders statuses
-- API uses: draft, approved, sent, part_received, closed, cancelled, received, invoiced, return
-- =========================

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'chk_purchase_orders_status') then
    alter table purchase_orders drop constraint chk_purchase_orders_status;
  end if;

  alter table purchase_orders
    add constraint chk_purchase_orders_status
    check (status = any (array[
      'draft',
      'approved',
      'sent',
      'part_received',
      'received',
      'invoiced',
      'closed',
      'cancelled',
      'return'
    ]));
end $$;

commit;
