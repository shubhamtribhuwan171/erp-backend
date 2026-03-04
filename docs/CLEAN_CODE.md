# ERP Project - Clean Code Structure

## 📁 Project Organization

```
erp-project/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   │   ├── auth/           # Authentication
│   │   │   ├── customers/      # Customer CRUD
│   │   │   ├── inventory/       # Inventory management
│   │   │   ├── sales/          # Sales orders
│   │   │   ├── purchases/      # Purchase orders
│   │   │   ├── accounting/      # Ledger & reports
│   │   │   ├── hr/             # Employees
│   │   │   ├── crm/            # Leads & contacts
│   │   │   └── settings/        # Company settings
│   │   │
│   │   └── layout.tsx
│   │
│   ├── lib/                    # Core libraries
│   │   ├── api/               # API client
│   │   ├── api-response.ts    # Standardized responses
│   │   ├── auth-rbac.ts        # Authentication + RBAC
│   │   ├── constants/          # Enums & constants
│   │   │   └── index.ts       # All constants
│   │   ├── services/          # Database services
│   │   │   └── database.ts    # Base CRUD service
│   │   ├── types.ts          # TypeScript types
│   │   ├── utils.ts           # Utility functions
│   │   ├── validation.ts      # Zod schemas
│   │   └── logger.ts          # Error logging
│   │
│   └── types/                  # Shared types
│
├── supabase/
│   ├── migration.sql          # Base schema
│   └── optimizations.sql       # Indexes, views, RLS
│
└── docs/
    ├── FRONTEND_SPEC.md       # UI specification
    ├── API_CHECKLIST.md       # API endpoints
    ├── PERFORMANCE.md        # Optimization docs
    └── README.md
```

## 🎯 Key Improvements

### 1. Constants & Enums
```typescript
// Instead of magic strings
OrderStatus.CONFIRMED  // ✅
'confirmed'            // ❌
```

### 2. Standardized API Responses
```typescript
// All responses follow same format
{ success: true, data: {...} }
{ success: false, message: 'error' }
```

### 3. Service Layer
```typescript
// Reusable CRUD operations
const customers = new CustomerService(companyId)
await customers.findAllForCompany()
await customers.create({ name: 'Acme' })
```

### 4. TypeScript Types
```typescript
// Strict typing throughout
interface Customer extends Timestamps, UserReference, Status { ... }
```

## 📦 Constants Available

| Constant | Usage |
|----------|-------|
| `UserRole` | owner, admin, manager, staff |
| `OrderStatus` | draft, confirmed, shipped, etc. |
| `Module` | customers, inventory, sales, etc. |
| `Permission` | create, read, update, delete |
| `MESSAGES` | Standardized messages |

## 🔧 Utilities

| Function | Purpose |
|----------|---------|
| `generateId()` | UUID generation |
| `minorToDisplay()` | Format currency |
| `generateNextCode()` | Auto-increment codes |
| `groupBy()` | Array grouping |
| `debounce()` | Function debouncing |

## ✅ Best Practices Applied

1. **Single responsibility** - Each file has one job
2. **Consistent naming** - camelCase, PascalCase
3. **Type safety** - No `any`, strict interfaces
4. **Error handling** - Centralized logging
5. **Validation** - Zod schemas on all inputs
6. **Pagination** - Standard limits everywhere
7. **Constants** - No magic strings

## 🚀 Ready for Production

- [x] Clean architecture
- [x] Type safety
- [x] Error handling
- [x] Validation
- [x] Performance optimized
- [x] Security (RLS, auth)
