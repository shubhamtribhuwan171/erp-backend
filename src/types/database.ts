// Database types for ERP - generated from schema
export type UUID = string

export interface Company {
  id: UUID
  name: string
  slug: string
  logo_url?: string
  address?: string
  phone?: string
  email?: string
  timezone: string
  currency: string
  created_at: string
  updated_at: string
}

export interface User {
  id: UUID
  email: string
  full_name: string
  avatar_url?: string
  company_id: UUID
  role: 'owner' | 'admin' | 'manager' | 'staff'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Module {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  is_core: boolean
}

export interface CompanyModule {
  id: UUID
  company_id: UUID
  module_id: string
  is_enabled: boolean
  settings?: Record<string, unknown>
  enabled_at?: string
}

// Core Module Types
export interface Customer {
  id: UUID
  company_id: UUID
  name: string
  email?: string
  phone?: string
  address?: string
  tax_number?: string
  payment_terms: number // days
  credit_limit?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: UUID
  company_id: UUID
  name: string
  email?: string
  phone?: string
  address?: string
  tax_number?: string
  payment_terms: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: UUID
  company_id: UUID
  sku: string
  name: string
  description?: string
  category_id?: UUID
  unit_id?: UUID
  barcode?: string
  image_url?: string
  cost_price: number
  sell_price: number
  reorder_level?: number
  is_stock_tracked: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface InventoryCategory {
  id: UUID
  company_id: UUID
  name: string
  parent_id?: UUID
  created_at: string
}

export interface UnitOfMeasure {
  id: UUID
  company_id: UUID
  name: string
  abbreviation: string
  is_decimal: boolean
  created_at: string
}

export interface SalesOrder {
  id: UUID
  company_id: UUID
  customer_id: UUID
  order_number: string
  order_date: string
  delivery_date?: string
  status: 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  notes?: string
  created_by: UUID
  created_at: string
  updated_at: string
}

export interface SalesOrderItem {
  id: UUID
  order_id: UUID
  item_id: UUID
  quantity: number
  unit_price: number
  tax_rate: number
  discount_percent: number
  total: number
}

export interface PurchaseOrder {
  id: UUID
  company_id: UUID
  vendor_id: UUID
  order_number: string
  order_date: string
  delivery_date?: string
  status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  notes?: string
  created_by: UUID
  created_at: string
  updated_at: string
}

export interface Account {
  id: UUID
  company_id: UUID
  account_number: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  parent_id?: UUID
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LedgerEntry {
  id: UUID
  company_id: UUID
  entry_number: string
  date: string
  description: string
  reference?: string
  created_by: UUID
  posted_at?: string
  created_at: string
}

export interface LedgerLine {
  id: UUID
  entry_id: UUID
  account_id: UUID
  debit: number
  credit: number
  description?: string
}

export interface Employee {
  id: UUID
  company_id: UUID
  user_id?: UUID
  employee_number: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  department_id?: UUID
  designation?: string
  join_date: string
  salary?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: UUID
  company_id: UUID
  user_id: UUID
  table_name: string
  record_id: UUID
  action: 'create' | 'update' | 'delete'
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  created_at: string
}
