# Backend API Completion Checklist

## Status: In Progress

---

## ✅ Completed (15 endpoints)

### Auth
- [x] `POST /api/auth/register`
- [x] `POST /api/auth/login`

### Customers
- [x] `GET /api/customers` - List
- [x] `POST /api/customers` - Create
- [x] `GET /api/customers/[id]` - Get
- [x] `PUT /api/customers/[id]` - Update
- [x] `DELETE /api/customers/[id]` - Delete

### Vendors
- [x] `GET /api/vendors`
- [x] `POST /api/vendors`
- [x] `GET /api/vendors/[id]`
- [x] `PUT /api/vendors/[id]`
- [x] `DELETE /api/vendors/[id]`

### Inventory
- [x] `GET /api/inventory/items`
- [x] `POST /api/inventory/items`
- [x] `GET /api/inventory/items/[id]`
- [x] `PUT /api/inventory/items/[id]`
- [x] `DELETE /api/inventory/items/[id]`
- [x] `GET /api/inventory/categories`
- [x] `POST /api/inventory/categories`
- [x] `GET /api/inventory/units`
- [x] `POST /api/inventory/units`
- [x] `GET /api/inventory/warehouses`
- [x] `POST /api/inventory/warehouses`

### Sales
- [x] `GET /api/sales/orders`
- [x] `POST /api/sales/orders`
- [x] `GET /api/sales/orders/[id]`
- [x] `PUT /api/sales/orders/[id]`
- [x] `PATCH /api/sales/orders/[id]/status`

### Purchases
- [x] `GET /api/purchases/orders`
- [x] `POST /api/purchases/orders`
- [x] `GET /api/purchases/orders/[id]`
- [x] `PUT /api/purchases/orders/[id]`
- [x] `PATCH /api/purchases/orders/[id]/status`

---

## 🔄 To Do

### Auth (2 endpoints)
- [ ] `POST /api/auth/logout`
- [ ] `GET /api/auth/me`

### Settings (8 endpoints)
- [ ] `GET /api/settings/company`
- [ ] `PUT /api/settings/company`
- [ ] `GET /api/settings/users`
- [ ] `POST /api/settings/users`
- [ ] `GET /api/settings/users/[id]`
- [ ] `PUT /api/settings/users/[id]`
- [ ] `DELETE /api/settings/users/[id]`
- [ ] `GET /api/settings/roles`

### Inventory (8 endpoints)
- [ ] `GET /api/inventory/stock` - Stock balances view
- [ ] `POST /api/inventory/transactions` - Stock movement
- [ ] `POST /api/inventory/transfer` - Transfer between warehouses
- [ ] `POST /api/inventory/adjustment` - Stock adjustment
- [ ] `GET /api/inventory/categories/[id]`
- [ ] `PUT /api/inventory/categories/[id]`
- [ ] `DELETE /api/inventory/categories/[id]`
- [ ] `GET /api/inventory/units/[id]`

### Sales (10 endpoints)
- [ ] `GET /api/sales/customers` (separate from general customers?)
- [ ] `GET /api/sales/invoices`
- [ ] `POST /api/sales/invoices`
- [ ] `GET /api/sales/invoices/[id]`
- [ ] `PATCH /api/sales/invoices/[id]/status`
- [ ] `GET /api/sales/quotations`
- [ ] `POST /api/sales/quotations`
- [ ] `POST /api/sales/quotations/[id]/convert` - To order
- [ ] `POST /api/sales/returns` - Sales returns
- [ ] `GET /api/sales/returns`

### Purchases (10 endpoints)
- [ ] `GET /api/purchases/vendors` (separate?)
- [ ] `GET /api/purchases/receipts` - Goods receipt notes
- [ ] `POST /api/purchases/receipts`
- [ ] `GET /api/purchases/receipts/[id]`
- [ ] `GET /api/purchases/invoices` - Vendor bills
- [ ] `POST /api/purchases/invoices`
- [ ] `PATCH /api/purchases/invoices/[id]/status`
- [ ] `GET /api/purchases/returns`
- [ ] `POST /api/purchases/returns`

### Accounting (15 endpoints)
- [ ] `GET /api/accounting/accounts`
- [ ] `POST /api/accounting/accounts`
- [ ] `GET /api/accounting/accounts/[id]`
- [ ] `PUT /api/accounting/accounts/[id]`
- [ ] `DELETE /api/accounting/accounts/[id]`
- [ ] `GET /api/accounting/journal`
- [ ] `POST /api/accounting/journal`
- [ ] `GET /api/accounting/journal/[id]`
- [ ] `PATCH /api/accounting/journal/[id]/post` - Post entry
- [ ] `PATCH /api/accounting/journal/[id]/void` - Void entry
- [ ] `GET /api/accounting/reports/trial-balance`
- [ ] `GET /api/accounting/reports/pnl`
- [ ] `GET /api/accounting/reports/balance-sheet`

### HR (8 endpoints)
- [ ] `GET /api/hr/employees`
- [ ] `POST /api/hr/employees`
- [ ] `GET /api/hr/employees/[id]`
- [ ] `PUT /api/hr/employees/[id]`
- [ ] `DELETE /api/hr/employees/[id]`
- [ ] `GET /api/hr/departments`
- [ ] `POST /api/hr/departments`
- [ ] `GET /api/hr/attendance`

### CRM (8 endpoints)
- [ ] `GET /api/crm/leads`
- [ ] `POST /api/crm/leads`
- [ ] `GET /api/crm/leads/[id]`
- [ ] `PUT /api/crm/leads/[id]`
- [ ] `POST /api/crm/leads/[id]/convert`
- [ ] `GET /api/crm/contacts`
- [ ] `POST /api/crm/contacts`
- [ ] `GET /api/crm/contacts/[id]`

---

## Priority Order

### Phase 1: Core Settings (needed for frontend)
1. Settings - Company
2. Settings - Users
3. Auth - Me endpoint

### Phase 2: Inventory Completion
1. Stock transactions
2. Stock transfer
3. Stock adjustment

### Phase 3: Sales/Purchase Extensions
1. Quotations
2. Invoices
3. Goods receipts
4. Returns

### Phase 4: Accounting
1. Chart of accounts
2. Journal entries
3. Reports

### Phase 5: HR & CRM
1. Employees
2. Departments
3. Leads
4. Contacts
