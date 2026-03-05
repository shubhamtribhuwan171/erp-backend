-- Migration: Enable RLS on tenant tables to protect PostgREST/anon access
-- Date: 2026-03-05
-- Note: Our Next.js API routes use service role (createApiClient), so they continue to work.

begin;

-- Core tenant tables
alter table if exists customers enable row level security;
alter table if exists vendors enable row level security;
alter table if exists inventory_items enable row level security;
alter table if exists inventory_categories enable row level security;
alter table if exists warehouses enable row level security;
alter table if exists units enable row level security;

alter table if exists sales_orders enable row level security;
alter table if exists sales_order_items enable row level security;
alter table if exists purchase_orders enable row level security;
alter table if exists purchase_order_items enable row level security;

alter table if exists stock_transactions enable row level security;
alter table if exists inventory_reservations enable row level security;
alter table if exists attendance_records enable row level security;
alter table if exists employees enable row level security;
alter table if exists departments enable row level security;

alter table if exists accounts enable row level security;
alter table if exists ledger_entries enable row level security;
alter table if exists ledger_lines enable row level security;

-- If you later integrate Supabase Auth JWTs, add explicit policies for role=authenticated.
-- For now, no policies are created: anon/authenticated direct access is denied by default.

commit;
