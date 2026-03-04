# ERP Frontend Design Document

## 1. Design Philosophy

**Vibe:** Clean, professional, modern SaaS
- Like QuickBooks, Zoho, Odoo but simpler
- Not overwhelming - progressive disclosure
- Mobile-responsive but desktop-first

---

## 2. Layout Structure

### Main Layout
```
┌─────────────────────────────────────────────────────────┐
│ Top Bar (56px)                                         │
│ [Logo] [Search] [Notifications] [User Menu]            │
├──────────┬──────────────────────────────────────────────┤
│ Sidebar  │  Main Content Area                          │
│ (240px)  │                                              │
│          │  ┌────────────────────────────────────────┐  │
│ [Nav]    │  │ Page Header                           │  │
│          │  │ [Title] [Actions]                    │  │
│          │  ├────────────────────────────────────────┤  │
│          │  │ Content                               │  │
│          │  │ (Tables/Forms/Cards)                 │  │
│          │  │                                        │  │
│          │  └────────────────────────────────────────┘  │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### Sidebar Navigation
```
📊 Dashboard
📦 Inventory
   ├─ Items
   ├─ Categories
   ├─ Units
   ├─ Warehouses
   └─ Stock
🛒 Sales
   ├─ Orders
   ├─ Customers
   ├─ Quotations
   └─ Invoices
📥 Purchases
   ├─ Orders
   ├─ Vendors
   └─ Invoices
📊 Accounting
   ├─ Accounts
   ├─ Journal
   └─ Reports
👥 HR
   ├─ Employees
   └─ Departments
🤝 CRM
   ├─ Leads
   └─ Contacts
⚙️ Settings
   ├─ Company
   ├─ Users
   └─ Modules
```

---

## 3. Page Designs

### 3.1 Login Page
- Clean centered card
- Company logo at top
- Email/password fields
- "Remember me" checkbox
- Login button (primary)
- "Forgot password?" link
- "Register new company" link

### 3.2 Dashboard
**Top Section - KPI Cards (4 columns)**
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 💰 Sales │ │ 📦 Orders│ │ 👥 Customers│ │ 📊 Profit │
│ This Month│ │ Pending │ │ New This │ │ This Month│
│ $45,230  │ │ 12      │ │ 8        │ │ $12,450  │
│ +12%     │ │         │ │          │ │ +5%      │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

**Middle Section - Two Columns**
- Left: Recent Orders (table, 5 rows)
- Right: Low Stock Alerts (list, 5 items)

**Bottom Section**
- Mini chart: Sales trend (last 7 days)

### 3.3 Data List Pages (Items, Customers, etc.)
**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ [Title]                              [+ New] [Filters] │
├─────────────────────────────────────────────────────────┤
│ Search [________________] [Status ▼] [More Filters]    │
├─────────────────────────────────────────────────────────┤
│ ◻ │ Code   │ Name        │ Category │ Stock  │ Actions │
│───│────────│─────────────│──────────│────────│─────────│
│ ◻ │ SKU-01 │ Laptop      │ Electronics│ 45   │ ⋯      │
│ ◻ │ SKU-02 │ Mouse       │ Accessories│ 120  │ ⋯      │
│ ◻ │ SKU-03 │ Keyboard    │ Accessories│ 30   │ ⋯      │
├─────────────────────────────────────────────────────────┤
│ Showing 1-10 of 150    [<] [1] [2] [3] [>]           │
└─────────────────────────────────────────────────────────┘
```

### 3.4 Form Pages (Create/Edit)
**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ Items / New Item                                       │
├─────────────────────────────────────────────────────────┤
│ Basic Info                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ SKU *        │ [____________]                      │ │
│ │ Name *       │ [____________]                      │ │
│ │ Description  │ [________________________]         │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Pricing                                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Cost Price    │ [₹ ________]                        │ │
│ │ Selling Price│ [₹ ________]                        │ │
│ │ Tax Rate     │ [____ %]                            │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Inventory                                              │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Category     │ [Select ▼]                          │ │
│ │ Unit         │ [Select ▼]                          │ │
│ │ Track Stock  │ [✓] Yes                             │ │
│ │ Reorder Level│ [____]                              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Cancel]                              [Save] [Save & New]│
└─────────────────────────────────────────────────────────┘
```

### 3.5 Order Detail Page
```
┌─────────────────────────────────────────────────────────┐
│ Order #SO-0001                    [Print] [Edit] [More] │
│ Status: ● Confirmed    Date: Mar 4, 2026              │
├─────────────────────────────────────────────────────────┤
│ Customer: Acme Corp         Bill To / Ship To          │
│ John Doe                     View addresses            │
├─────────────────────────────────────────────────────────┤
│ Line Items                                             │
│ ┌────┬────────────┬────────┬──────────┬──────────┐   │
│ │ #  │ Item      │ Qty    │ Price    │ Total    │   │
│ ├────┼────────────┼────────┼──────────┼──────────┤   │
│ │ 1  │ Laptop     │ 2      │ ₹60,000  │ ₹1,20,000│   │
│ │ 2  │ Mouse     │ 5      │ ₹500     │ ₹2,500   │   │
│ └────┴────────────┴────────┴──────────┴──────────┘   │
│                                          Subtotal    ₹1,22,500│
│                                          Tax        ₹0    │
│                                          Total      ₹1,22,500│
├─────────────────────────────────────────────────────────┤
│ [← Back to Orders]  [Cancel Order] [Mark as Shipped] │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Component Library

### Buttons
- Primary (blue): Save, Confirm, Submit
- Secondary (gray): Cancel, Back
- Danger (red): Delete, Cancel
- Success (green): Approved, Complete

### Form Inputs
- Text, Number, Email, Phone
- Select (dropdown)
- Multi-select (tags)
- Date picker
- File upload (drag & drop)
- Currency input (with ₹ symbol)
- Percentage input

### Data Display
- Table (sortable columns)
- Cards (grid view)
- Badge/Status chips
- Avatar
- Empty state illustration

### Feedback
- Toast notifications (top-right)
- Loading spinners
- Skeleton loaders
- Empty states
- Error boundaries

---

## 5. Color Palette

```css
--primary: #2563EB        /* Blue - main actions */
--primary-hover: #1D4ED8
--secondary: #64748B      /* Gray - secondary */
--success: #10B981        /* Green - positive */
--warning: #F59E0B        /* Orange - warnings */
--danger: #EF4444         /* Red - errors/delete */
--background: #F8FAFC     /* Light gray bg */
--surface: #FFFFFF        /* White cards */
--border: #E2E8F0         /* Borders */
--text-primary: #0F172A   /* Main text */
--text-secondary: #64748B  /* Muted text */
```

---

## 6. Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 640px | Single column, bottom nav |
| Tablet | 640-1024px | Collapsible sidebar |
| Desktop | > 1024px | Full sidebar |

---

## 7. User Flows

### Create Sales Order
1. Click "New Order" → Order form opens
2. Select customer (searchable dropdown)
3. Add items (search by SKU/name, auto-fill price)
4. Adjust quantities
5. Add discount (optional)
6. See live total calculation
7. Save as Draft or Confirm

### Stock Transfer
1. Go to Inventory → Transfer
2. Select item
3. Select "From" warehouse
4. Select "To" warehouse
5. Enter quantity
6. Add notes
7. Submit → Two transactions created

---

## 8. Tech Stack

- **Framework:** Next.js 15
- **UI Library:** Tailwind CSS + shadcn/ui
- **State:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod
- **Tables:** TanStack Table
- **Charts:** Recharts
- **Icons:** Lucide React

---

## 9. Priority Pages (MVP)

### Phase 1: Core
1. Login
2. Dashboard
3. Items List + Create/Edit
4. Customers List + Create/Edit
5. Sales Orders List + Create + Detail

### Phase 2: Complete
6. Vendors
7. Purchase Orders
8. Stock Transactions
9. Settings (Company, Users)

### Phase 3: Advanced
10. Accounting Entries
11. Reports
12. HR Employees
13. CRM Leads

---

## 10. File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx (Dashboard)
│   │   ├── inventory/
│   │   │   ├── items/page.tsx
│   │   │   └── items/[id]/page.tsx
│   │   ├── sales/
│   │   │   ├── orders/page.tsx
│   │   │   └── orders/[id]/page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/           # Reusable components
│   ├── forms/         # Form components
│   ├── tables/       # Table components
│   └── layouts/      # Layout components
├── lib/
│   ├── api.ts        # API calls
│   ├── auth.ts       # Auth helpers
│   └── utils.ts
└── types/
    └── index.ts
```

---

This is the vision. Want me to start building it?
