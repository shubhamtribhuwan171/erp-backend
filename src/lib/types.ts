// ============================================
// CORE DATABASE TYPES
// ============================================

export type UUID = string

// Timestamps
export interface Timestamps {
  created_at: string
  updated_at: string
}

// User reference
export interface UserReference {
  created_by_user_id: UUID | null
  updated_by_user_id: UUID | null
}

// Status mixin
export interface Status {
  status: string
}

// ============================================
// COMPANY & USER
// ============================================

export interface Company extends Timestamps, UserReference {
  id: UUID
  name: string
  legal_name: string | null
  gstin: string | null
  base_currency_code: string
  timezone: string
  settings: Record<string, unknown>
}

export interface User extends Timestamps, UserReference {
  id: UUID
  company_id: UUID
  email: string
  phone: string | null
  role: string
  is_admin: boolean
  is_active: boolean
  last_login_at: string | null
}

export interface Module {
  id: UUID
  key: string
  name: string
  description: string | null
  is_core: boolean
  sort_order: number
}

export interface CompanyModule extends Timestamps {
  id: UUID
  company_id: UUID
  module_id: UUID
  enabled: boolean
  enabled_at: string | null
}

// ============================================
// BUSINESS PARTNERS
// ============================================

export interface Address {
  line1?: string
  line2?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
}

export interface BankDetails {
  bank_name?: string
  account_number?: string
  ifsc_code?: string
  branch?: string
}

export interface Customer extends Timestamps, UserReference, Status {
  id: UUID
  company_id: UUID
  code: string
  name: string
  email: string | null
  phone: string | null
  billing_address: Address | null
  shipping_address: Address | null
  tax_id: string | null
  payment_terms_days: number | null
  credit_limit_minor: number | null
}

export interface Vendor extends Timestamps, UserReference, Status {
  id: UUID
  company_id: UUID
  code: string
  name: string
  email: string | null
  phone: string | null
  address: Address | null
  tax_id: string | null
  payment_terms_days: number | null
  default_lead_time_days: number | null
  bank_details: BankDetails | null
}

// ============================================
// INVENTORY
// ============================================

export interface InventoryCategory extends Timestamps, UserReference, Status {
  id: UUID
  company_id: UUID
  code: string
  name: string
  parent_category_id: UUID | null
}

export interface Unit extends Timestamps, UserReference, Status {
  id: UUID
  company_id: UUID
  code: string
  name: string
}

export interface Warehouse extends Timestamps, UserReference, Status {
  id: UUID
  company_id: UUID
  code: string
  name: string
  address: Address | null
  is_default: boolean
}

export interface InventoryItem extends Timestamps, UserReference, Status {
  id: UUID
  company_id: UUID
  sku: string
  name: string
  description: string | null
  category_id: UUID | null
  unit_id: UUID
  track_inventory: boolean
  is_serialized: boolean
  is_batch_tracked: boolean
  reorder_level: number | null
  reorder_qty: number | null
  standard_cost_minor: number | null
  sale_price_minor: number | null
  currency_code: string | null
}

export interface StockTransaction {
  id: UUID
  company_id: UUID
  txn_type: string
  txn_date: string
  item_id: UUID
  warehouse_id: UUID
  qty: number
  unit_id: UUID
  unit_cost_minor: number | null
  reference_type: string | null
  reference_id: UUID | null
  batch_no: string | null
  serial_no: string | null
  notes: string | null
  created_by_user_id: UUID | null
  created_at: string
}

// ============================================
// ORDERS
// ============================================

export interface SalesOrder extends Timestamps, UserReference {
  id: UUID
  company_id: UUID
  order_no: string
  customer_id: UUID
  order_date: string
  expected_ship_date: string | null
  status: string
  currency_code: string
  subtotal_minor: number
  discount_minor: number
  tax_minor: number
  total_minor: number
  billing_address: Address | null
  shipping_address: Address | null
  notes: string | null
}

export interface SalesOrderItem {
  id: UUID
  company_id: UUID
  sales_order_id: UUID
  line_no: number
  item_id: UUID | null
  description: string | null
  warehouse_id: UUID | null
  qty: number
  unit_id: UUID
  unit_price_minor: number
  discount_minor: number
  tax_minor: number
  line_total_minor: number
  fulfilled_qty: number
}

export interface PurchaseOrder extends Timestamps, UserReference {
  id: UUID
  company_id: UUID
  po_no: string
  vendor_id: UUID
  order_date: string
  expected_receipt_date: string | null
  status: string
  currency_code: string
  subtotal_minor: number
  discount_minor: number
  tax_minor: number
  total_minor: number
  notes: string | null
}

// ============================================
// ACCOUNTING
// ============================================

export interface Account extends Timestamps, UserReference, Status {
  id: UUID
  company_id: UUID
  code: string
  name: string
  type: string
  subtype: string | null
  parent_account_id: UUID | null
  is_system: boolean
}

export interface LedgerEntry extends Timestamps, UserReference {
  id: UUID
  company_id: UUID
  entry_no: string
  entry_date: string
  status: string
  source_type: string | null
  source_id: UUID | null
  memo: string | null
  posted_at: string | null
}

export interface LedgerLine {
  id: UUID
  company_id: UUID
  ledger_entry_id: UUID
  line_no: number
  account_id: UUID
  description: string | null
  currency_code: string
  debit_minor: number
  credit_minor: number
  department_id: UUID | null
  customer_id: UUID | null
  vendor_id: UUID | null
}

// ============================================
// HR
// ============================================

export interface Department extends Timestamps, UserReference, Status {
  id: UUID
  company_id: UUID
  code: string
  name: string
  parent_department_id: UUID | null
  manager_employee_id: UUID | null
}

export interface Employee extends Timestamps, UserReference {
  id: UUID
  company_id: UUID
  employee_no: string
  user_id: UUID | null
  department_id: UUID | null
  name: string
  email: string | null
  phone: string | null
  job_title: string | null
  hire_date: string | null
  exit_date: string | null
  status: string
}
