# ERP Frontend Specification

## Overview
- **Type:** Web Application (Next.js)
- **Target Users:** Small to medium businesses
- **Core Modules:** Inventory, Sales, Purchases, Accounting, HR, CRM

---

## Pages Structure

### 1. Authentication Pages
| Page | URL | Features |
|------|-----|----------|
| Login | `/login` | Email/password login, remember me, forgot password |
| Register | `/register` | Company name, email, password, referral code |

### 2. Dashboard (Home)
| Page | URL | Features |
|------|-----|----------|
| Main Dashboard | `/dashboard` | KPIs, charts, recent orders, low stock alerts, pending approvals |

### 3. Settings
| Page | URL | Features |
|------|-----|----------|
| Company Settings | `/settings/company` | Logo, name, address, GSTIN, timezone, currency |
| User Management | `/settings/users` | List users, add/edit/remove, assign roles |
| Role Management | `/settings/roles` | Create roles, assign permissions |
| Module Settings | `/settings/modules` | Enable/disable modules |

### 4. Inventory Module
| Page | URL | Features |
|------|-----|----------|
| Items List | `/inventory/items` | Search, filter by category, paginated, bulk actions |
| Item Create/Edit | `/inventory/items/new`, `/inventory/items/[id]` | Form with all fields, image upload |
| Categories | `/inventory/categories` | CRUD, hierarchical view |
| Units | `/inventory/units` | CRUD |
| Warehouses | `/inventory/warehouses` | CRUD, set default |
| Stock Report | `/inventory/stock` | Current stock levels, movements |
| Stock Transfer | `/inventory/transfer` | Transfer between warehouses |
| Stock Adjustment | `/inventory/adjustment` | Add/remove stock with reason |

### 5. Sales Module
| Page | URL | Features |
|------|-----|----------|
| Customers List | `/sales/customers` | Search, filter, list |
| Customer Create/Edit | `/sales/customers/new`, `/sales/customers/[id]` | Full form |
| Orders List | `/sales/orders` | Filter by status, date, customer |
| Order Create | `/sales/orders/new` | Multi-item, customer selection, pricing |
| Order Detail | `/sales/orders/[id]` | View, print, change status |
| Invoices | `/sales/invoices` | Generate from orders |
| quotations | `/sales/quotations` | Create, convert to order |

### 6. Purchases Module
| Page | URL | Features |
|------|-----|----------|
| Vendors List | `/purchases/vendors` | Search, filter |
| Vendor Create/Edit | `/purchases/vendors/new`, `/purchases/vendors/[id]` | Full form |
| Orders List | `/purchases/orders` | Filter by status |
| Order Create | `/purchases/orders/new` | Multi-item, vendor selection |
| Order Detail | `/purchases/orders/[id]` | View, change status |
| Goods Receipt | `/purchases/receipts` | Receive items against PO |
| Invoices | `/purchases/invoices` | Vendor bills |

### 7. Accounting Module
| Page | URL | Features |
|------|-----|----------|
| Chart of Accounts | `/accounting/accounts` | Tree view, CRUD |
| Journal Entries | `/accounting/journal` | List, create, post/void |
| Trial Balance | `/accounting/trial-balance` | Date range report |
| Profit & Loss | `/accounting/pnl` | Date range report |
| Balance Sheet | `/accounting/balance-sheet` | Date range report |

### 8. HR Module
| Page | URL | Features |
|------|-----|----------|
| Employees List | `/hr/employees` | Search, filter by department |
| Employee Create/Edit | `/hr/employees/new`, `/hr/employees/[id]` | Full profile |
| Departments | `/hr/departments` | Org chart view |
| Attendance | `/hr/attendance` | Daily attendance sheet |
| Leave Requests | `/hr/leave` | Approve/reject |

### 9. CRM Module
| Page | URL | Features |
|------|-----|----------|
| Leads | `/crm/leads` | Kanban or list view |
| Lead Detail | `/crm/leads/[id]` | Activities, notes, convert |
| Contacts | `/crm/contacts` | All contacts |

---

## UI Components Needed

### Common Components
- [ ] Sidebar Navigation
- [ ] Top Header (search, notifications, user menu)
- [ ] Breadcrumbs
- [ ] Data Table (sort, filter, pagination, bulk actions)
- [ ] Form Components (input, select, date picker, file upload)
- [ ] Modal/Dialog
- [ ] Toast Notifications
- [ ] Confirmation Dialogs
- [ ] Loading States
- [ ] Empty States
- [ ] Error States

### Feature-Specific Components
- [ ] Item Card (inventory grid view)
- [ ] Order Line Items Editor
- [ ] Stock Movement Timeline
- [ ] Customer/Vendor Card
- [ ] Invoice Preview
- [ ] Report Charts

---

## Features by Module

### Inventory
- [ ] Create/Edit/Delete items
- [ ] Barcode/SKU management
- [ ] Category hierarchy
- [ ] Multiple units of measure
- [ ] Stock tracking per warehouse
- [ ] Low stock alerts
- [ ] Stock transfer between warehouses
- [ ] Stock adjustment with audit trail
- [ ] Batch/serial number tracking (future)
- [ ] Import/Export items (CSV)

### Sales
- [ ] Customer management
- [ ] Sales order workflow (draft → confirmed → shipped → invoiced)
- [ ] Multi-item orders
- [ ] Pricing with tax
- [ ] Partial shipments
- [ ] Sales return/credit notes
- [ ] quotations management
- [ ] Recurring orders (future)

### Purchases
- [ ] Vendor management
- [ ] Purchase order workflow (draft → sent → received)
- [ ] Multi-item orders
- [ ] Partial receiving
- [ ] Purchase return/debit notes
- [ ] Goods receipt notes

### Accounting
- [ ] Chart of accounts
- [ ] Manual journal entries
- [ ] Auto-posting from orders
- [ ] Trial balance
- [ ] P&L report
- [ ] Balance sheet
- [ ] Bank reconciliation (future)

### HR
- [ ] Employee database
- [ ] Department structure
- [ ] Attendance tracking
- [ ] Leave management
- [ ] Employee documents (future)

### CRM
- [ ] Lead pipeline (kanban)
- [ ] Lead → Customer conversion
- [ ] Contact management
- [ ] Activity logging
- [ ] Email integration (future)

---

## API Calls Required

### Auth
- `POST /api/auth/register` - Register company + user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

### Settings
- `GET/PUT /api/settings/company` - Company info
- `GET/POST /api/settings/users` - User list/create
- `GET/PUT/DELETE /api/settings/users/[id]` - User CRUD
- `GET/POST /api/settings/roles` - Roles list/create

### Inventory
- `GET /api/inventory/items` - List items
- `POST /api/inventory/items` - Create item
- `GET/PUT/DELETE /api/inventory/items/[id]` - Item CRUD
- `GET /api/inventory/categories` - List categories
- `POST /api/inventory/categories` - Create category
- `GET /api/inventory/units` - List units
- `POST /api/inventory/units` - Create unit
- `GET /api/inventory/warehouses` - List warehouses
- `POST /api/inventory/warehouses` - Create warehouse
- `GET /api/inventory/stock` - Stock balances
- `POST /api/inventory/transactions` - Stock movement

### Sales
- `GET/POST /api/sales/customers` - List/create
- `GET/PUT/DELETE /api/sales/customers/[id]` - Customer CRUD
- `GET/POST /api/sales/orders` - List/create orders
- `GET/PUT/PATCH /api/sales/orders/[id]` - Order CRUD/status
- `GET /api/sales/invoices` - List invoices
- `POST /api/sales/invoices` - Create invoice

### Purchases
- `GET/POST /api/purchases/vendors` - List/create
- `GET/PUT/DELETE /api/purchases/vendors/[id]` - Vendor CRUD
- `GET/POST /api/purchases/orders` - List/create PO
- `GET/PUT/PATCH /api/purchases/orders/[id]` - PO CRUD/status
- `GET /api/purchases/receipts` - List receipts
- `POST /api/purchases/receipts` - Create receipt

### Accounting
- `GET/POST /api/accounting/accounts` - List/create accounts
- `GET/PUT/DELETE /api/accounting/accounts/[id]` - Account CRUD
- `GET/POST /api/accounting/journal` - List/create entries
- `GET/PATCH /api/accounting/journal/[id]` - Entry detail/post
- `GET /api/accounting/reports/trial-balance`
- `GET /api/accounting/reports/pnl`
- `GET /api/accounting/reports/balance-sheet`

### HR
- `GET/POST /api/hr/employees` - List/create
- `GET/PUT/DELETE /api/hr/employees/[id]` - Employee CRUD
- `GET/POST /api/hr/departments` - List/create
- `GET /api/hr/attendance` - Attendance data
- `POST /api/hr/attendance` - Mark attendance

### CRM
- `GET/POST /api/crm/leads` - List/create
- `GET/PUT /api/crm/leads/[id]` - Lead CRUD
- `POST /api/crm/leads/[id]/convert` - Convert to customer
- `GET/POST /api/crm/contacts` - List/create

---

## User Flows

### 1. Create Sales Order
1. Go to Sales → Orders → New
2. Select customer
3. Add line items (search/select product)
4. Set quantities, prices
5. Add discount (optional)
6. Review totals
7. Save as Draft or Confirm

### 2. Receive Purchase Order
1. Go to Purchases → Orders
2. Find PO, click Receive
3. Enter received quantities
4. Add any rejections
5. Submit → Stock auto-updated

### 3. Stock Adjustment
1. Go to Inventory → Adjustment
2. Select warehouse
3. Search item
4. Enter qty change (+/-)
5. Add reason
6. Submit → Transaction logged

---

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **UI:** Tailwind CSS + shadcn/ui components
- **State:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Tables:** TanStack Table

---

## Future Enhancements
- Multi-company support
- Multi-currency
- REST API for mobile apps
- Webhooks
- Audit trail UI
- Approval workflows
- Recurring transactions
- Barcode scanning (mobile)
