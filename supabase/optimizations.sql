-- ============================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================

-- 1. ADD MORE INDEXES FOR COMMON QUERIES
-- ============================================

-- Foreign key indexes (already have some, add missing)
CREATE INDEX IF NOT EXISTS idx_customers_company_email ON customers(company_id, email);
CREATE INDEX IF NOT EXISTS idx_vendors_company_email ON vendors(company_id, email);
CREATE INDEX IF NOT EXISTS idx_users_company_email ON users(company_id, email);
CREATE INDEX IF NOT EXISTS idx_employees_company_email ON employees(company_id, email);

-- Status + Date indexes for filtering
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON sales_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_orders_company_status ON sales_orders(company_id, status);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_company_status ON purchase_orders(company_id, status);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_status ON ledger_entries(status);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_date ON ledger_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_company_date ON ledger_entries(company_id, entry_date);

CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON stock_transactions(txn_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_item_date ON stock_transactions(item_id, txn_date DESC);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_customers_name_search ON customers USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_vendors_name_search ON vendors USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_inventory_items_name_search ON inventory_items USING gin(to_tsvector('english', name));

-- 2. MATERIALIZED VIEWS FOR REPORTS
-- ============================================

-- Stock summary by warehouse
CREATE MATERIALIZED VIEW IF NOT EXISTS stock_summary AS
SELECT 
    company_id,
    item_id,
    warehouse_id,
    SUM(qty) as quantity,
    SUM(qty * COALESCE(unit_cost_minor, 0)) as total_value
FROM stock_transactions
GROUP BY company_id, item_id, warehouse_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_summary ON stock_summary(company_id, item_id, warehouse_id);

-- Sales summary by month
CREATE MATERIALIZED VIEW IF NOT EXISTS sales_summary_monthly AS
SELECT 
    company_id,
    DATE_TRUNC('month', order_date) as month,
    COUNT(*) as order_count,
    SUM(total_minor) as total_sales
FROM sales_orders
WHERE status NOT IN ('cancelled', 'draft')
GROUP BY company_id, DATE_TRUNC('month', order_date);

CREATE INDEX IF NOT EXISTS idx_sales_summary_monthly ON sales_summary_monthly(company_id, month);

-- Purchase summary by month
CREATE MATERIALIZED VIEW IF NOT EXISTS purchases_summary_monthly AS
SELECT 
    company_id,
    DATE_TRUNC('month', order_date) as month,
    COUNT(*) as order_count,
    SUM(total_minor) as total_purchases
FROM purchase_orders
WHERE status NOT IN ('cancelled', 'draft')
GROUP BY company_id, DATE_TRUNC('month', order_date);

CREATE INDEX IF NOT EXISTS idx_purchases_summary_monthly ON purchases_summary_monthly(company_id, month);

-- 3. PARTITIONING FUNCTIONS
-- ============================================

-- Function to refresh stock summary
CREATE OR REPLACE FUNCTION refresh_stock_summary()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY stock_summary;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh sales summary
CREATE OR REPLACE FUNCTION refresh_sales_summary()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY sales_summary_monthly;
END;
$$ LANGUAGE plpgsql;

-- 4. QUERY OPTIMIZATIONS
-- ============================================

-- Add compound index for common lookup patterns
CREATE INDEX IF NOT EXISTS idx_inventory_items_category_company ON inventory_items(category_id, company_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_items_unit_company ON inventory_items(unit_id, company_id);

-- 5. ANALYZE TABLES
-- ============================================
ANALYZE companies;
ANALYZE users;
ANALYZE customers;
ANALYZE vendors;
ANALYZE inventory_items;
ANALYZE sales_orders;
ANALYZE purchase_orders;
ANALYZE stock_transactions;
ANALYZE ledger_entries;
ANALYZE ledger_lines;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all company-scoped tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their company's data

-- Companies (users see their own company)
CREATE POLICY "Users can view own company" ON companies
    FOR ALL
    USING (id IN (SELECT company_id FROM users WHERE id = current_user));

-- Users
CREATE POLICY "Users can view company users" ON users
    FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = current_user));

-- Customers
CREATE POLICY "Customers company access" ON customers
    FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = current_user));

-- Vendors
CREATE POLICY "Vendors company access" ON vendors
    FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = current_user));

-- Inventory Items
CREATE POLICY "Items company access" ON inventory_items
    FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = current_user));

-- Categories
CREATE POLICY "Categories company access" ON inventory_categories
    FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = current_user));

-- Units
CREATE POLICY "Units company access" ON units
    FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = current_user));

-- Warehouses
CREATE POLICY "Warehouses company access" ON warehouses
    FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = current_user));

-- Stock Transactions
CREATE POLICY "Stock txn company access" ON stock_transactions
    FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = current_user));

-- Sales Orders
CREATE POLICY "Sales orders company access" ON sales_orders
    FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = current_user));

-- Sales Order Items
CREATE POLICY "Sales order items access" ON sales_order_items
    FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = current_user));

-- Purchase Orders
CREATE POLICY "Purchase orders company access" ON purchase_orders
    FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = current_user));

-- Purchase Order Items
CREATE POLICY "Purchase order items access" ON purchase_order_items
    FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = current_user));

-- Accounts
CREATE POLICY "Accounts company access" ON accounts
    FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = current_user));

-- Ledger Entries
CREATE POLICY "Ledger entries company access" ON ledger_entries
    FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = current_user));

-- Ledger Lines
CREATE POLICY "Ledger lines company access" ON ledger_lines
    FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = current_user));

-- Employees
CREATE POLICY "Employees company access" ON employees
    FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = current_user));

-- Departments
CREATE POLICY "Departments company access" ON departments
    FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = current_user));

-- NOTE: auth.users table doesn't have company_id, so we use a workaround
-- The application layer handles company_id validation
