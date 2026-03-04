// ============================================
// STATUS ENUMS
// ============================================

// User roles
export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
}

// User role hierarchy (higher = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.OWNER]: 4,
  [UserRole.ADMIN]: 3,
  [UserRole.MANAGER]: 2,
  [UserRole.STAFF]: 1,
}

// Order statuses
export enum OrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  INVOICED = 'invoiced',
  CANCELLED = 'cancelled',
}

// Purchase order statuses
export enum PurchaseStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  SENT = 'sent',
  PARTIAL = 'partial',
  RECEIVED = 'received',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

// Ledger entry statuses
export enum LedgerStatus {
  DRAFT = 'draft',
  POSTED = 'posted',
  VOID = 'void',
}

// Lead statuses
export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  WON = 'won',
  LOST = 'lost',
}

// Entity statuses
export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// Account types
export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

// Transaction types
export enum TransactionType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  ADJUSTMENT_IN = 'adjustment_in',
  ADJUSTMENT_OUT = 'adjustment_out',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  RETURN = 'return',
}

// ============================================
// PERMISSIONS
// ============================================

export enum Permission {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  APPROVE = 'approve',
}

// Module permissions
export enum Module {
  CUSTOMERS = 'customers',
  VENDORS = 'vendors',
  INVENTORY = 'inventory',
  SALES = 'sales',
  PURCHASES = 'purchases',
  ACCOUNTING = 'accounting',
  HR = 'hr',
  REPORTS = 'reports',
  SETTINGS = 'settings',
  USERS = 'users',
}

// Role-based module permissions
export const ROLE_PERMISSIONS: Record<UserRole, Record<Module, Permission[]>> = {
  [UserRole.OWNER]: {
    [Module.CUSTOMERS]: Object.values(Permission),
    [Module.VENDORS]: Object.values(Permission),
    [Module.INVENTORY]: Object.values(Permission),
    [Module.SALES]: Object.values(Permission),
    [Module.PURCHASES]: Object.values(Permission),
    [Module.ACCOUNTING]: Object.values(Permission),
    [Module.HR]: Object.values(Permission),
    [Module.REPORTS]: Object.values(Permission),
    [Module.SETTINGS]: Object.values(Permission),
    [Module.USERS]: Object.values(Permission),
  },
  [UserRole.ADMIN]: {
    [Module.CUSTOMERS]: Object.values(Permission),
    [Module.VENDORS]: Object.values(Permission),
    [Module.INVENTORY]: Object.values(Permission),
    [Module.SALES]: Object.values(Permission),
    [Module.PURCHASES]: Object.values(Permission),
    [Module.ACCOUNTING]: Object.values(Permission),
    [Module.HR]: Object.values(Permission),
    [Module.REPORTS]: Object.values(Permission),
    [Module.SETTINGS]: Object.values(Permission),
    [Module.USERS]: [Permission.READ, Permission.CREATE, Permission.UPDATE],
  },
  [UserRole.MANAGER]: {
    [Module.CUSTOMERS]: Object.values(Permission),
    [Module.VENDORS]: Object.values(Permission),
    [Module.INVENTORY]: Object.values(Permission),
    [Module.SALES]: Object.values(Permission),
    [Module.PURCHASES]: Object.values(Permission),
    [Module.ACCOUNTING]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.APPROVE],
    [Module.HR]: [Permission.READ],
    [Module.REPORTS]: [Permission.READ, Permission.EXPORT],
    [Module.SETTINGS]: [Permission.READ],
    [Module.USERS]: [Permission.READ],
  },
  [UserRole.STAFF]: {
    [Module.CUSTOMERS]: [Permission.CREATE, Permission.READ, Permission.UPDATE],
    [Module.VENDORS]: [Permission.READ],
    [Module.INVENTORY]: [Permission.CREATE, Permission.READ, Permission.UPDATE],
    [Module.SALES]: [Permission.CREATE, Permission.READ, Permission.UPDATE],
    [Module.PURCHASES]: [Permission.READ],
    [Module.ACCOUNTING]: [Permission.READ],
    [Module.HR]: [],
    [Module.REPORTS]: [Permission.READ],
    [Module.SETTINGS]: [],
    [Module.USERS]: [],
  },
}

// ============================================
// PAGINATION
// ============================================

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 100

// ============================================
// CURRENCY & LOCALE
// ============================================

export const DEFAULT_CURRENCY = 'INR'
export const DEFAULT_TIMEZONE = 'Asia/Kolkata'
export const DEFAULT_LOCALE = 'en-IN'

// ============================================
// API MESSAGES
// ============================================

export const MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Login successful',
  LOGIN_FAILED: 'Invalid email or password',
  REGISTER_SUCCESS: 'Registration successful',
  REGISTER_FAILED: 'Registration failed',
  
  // CRUD
  CREATE_SUCCESS: 'Created successfully',
  CREATE_FAILED: 'Failed to create',
  UPDATE_SUCCESS: 'Updated successfully',
  UPDATE_FAILED: 'Failed to update',
  DELETE_SUCCESS: 'Deleted successfully',
  DELETE_FAILED: 'Failed to delete',
  NOT_FOUND: 'Record not found',
  
  // Permissions
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Access denied',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  
  // Validation
  VALIDATION_FAILED: 'Validation failed',
  INVALID_INPUT: 'Invalid input',
  
  // Business logic
  INVALID_STATUS_TRANSITION: 'Invalid status transition',
  INSUFFICIENT_STOCK: 'Insufficient stock',
  CREDIT_LIMIT_EXCEEDED: 'Credit limit exceeded',
  
  // System
  SERVER_ERROR: 'Server error',
  MAINTENANCE_MODE: 'System under maintenance',
} as const

// ============================================
// REGEX PATTERNS
// ============================================

export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_INDIA: /^[+]?[\d]{10,12}$/,
  GSTIN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  PINCODE: /^[1-9][0-9]{5}$/,
} as const
