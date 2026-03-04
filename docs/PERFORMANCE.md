# Database Performance Optimizations Applied

## ✅ Indexes Added

### Foreign Key Indexes
- `idx_customers_company_email` - customer lookups
- `idx_vendors_company_email` - vendor lookups  
- `idx_users_company_email` - user lookups
- `idx_employees_company_email` - employee lookups

### Status + Date Indexes
- `idx_sales_orders_status` - filter by status
- `idx_sales_orders_date` - date sorting
- `idx_sales_orders_company_status` - company + status
- `idx_purchase_orders_status` - filter by status
- `idx_purchase_orders_date` - date sorting
- `idx_purchase_orders_company_status` - company + status
- `idx_ledger_entries_status` - posted/draft filtering
- `idx_ledger_entries_date` - date sorting
- `idx_ledger_entries_company_date` - compound
- `idx_stock_transactions_date` - stock history
- `idx_stock_transactions_item_date` - item stock history

### Full Text Search
- `idx_customers_name_search` - customers search
- `idx_vendors_name_search` - vendors search
- `idx_inventory_items_name_search` - items search

### Compound Indexes
- `idx_inventory_items_category_company` - category filtering
- `idx_inventory_items_unit_company` - unit filtering

---

## ✅ Materialized Views

### stock_summary
Pre-computed stock levels per item/warehouse:
```sql
SELECT * FROM stock_summary 
WHERE company_id = 'xxx' AND item_id = 'xxx'
```
Much faster than calculating SUM() on every query.

### sales_summary_monthly
Monthly sales aggregates:
```sql
SELECT * FROM sales_summary_monthly 
WHERE company_id = 'xxx' AND month >= '2026-01-01'
```

### purchases_summary_monthly
Monthly purchase aggregates.

---

## ✅ Refresh Functions

- `refresh_stock_summary()` - refresh stock view
- `refresh_sales_summary()` - refresh sales view

---

## ✅ Connection Pooling (PgBouncer)

Config ready in `docker-compose.optimized.yml`:
```yaml
pgbouncer:
  ports: ["6432:5432"]
  POOL_MODE: transaction
  MAX_CLIENT_CONN: 200
  DEFAULT_POOL_SIZE: 20
```

Run with: `docker-compose -f docker-compose.optimized.yml up`

---

## ✅ API Optimizations

### Backend
- Pagination defaults (20 items, max 100)
- Query limits applied
- Proper indexing on foreign keys

### Frontend  
- Client-side response caching (1 min)
- Cache auto-clear on mutations

---

## 📊 Performance Gains

| Query | Before | After |
|-------|--------|-------|
| List orders | Full table scan | Index on status + date |
| Stock report | SUM on millions | Materialized view |
| Customer search | LIKE %% | Full-text index |
| Monthly sales | GROUP BY runtime | Pre-aggregated view |

---

## 🔄 Regular Maintenance

Run weekly:
```sql
-- Refresh materialized views
SELECT refresh_stock_summary();
SELECT refresh_sales_summary();

-- Analyze tables for optimizer
ANALYZE;
```
