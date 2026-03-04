// Validation schemas using Zod
import { z } from 'zod'

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  companyName: z.string().min(1, 'Company name is required'),
  fullName: z.string().optional(),
})

// Customer schemas
export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  billing_address: z.record(z.string(), z.any()).optional(),
  shipping_address: z.record(z.string(), z.any()).optional(),
  tax_id: z.string().optional(),
  payment_terms_days: z.number().int().positive().optional(),
  credit_limit_minor: z.number().int().optional(),
})

// Vendor schemas
export const vendorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.record(z.string(), z.any()).optional(),
  tax_id: z.string().optional(),
  payment_terms_days: z.number().int().positive().optional(),
  default_lead_time_days: z.number().int().positive().optional(),
})

// Inventory item schemas
export const inventoryItemSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category_id: z.string().uuid().optional(),
  unit_id: z.string().uuid('Invalid unit ID'),
  track_inventory: z.boolean().default(true),
  is_serialized: z.boolean().default(false),
  is_batch_tracked: z.boolean().default(false),
  reorder_level: z.number().int().optional(),
  reorder_qty: z.number().int().optional(),
  standard_cost_minor: z.number().int().optional(),
  sale_price_minor: z.number().int().optional(),
})

// Sales order schemas
export const salesOrderSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  order_date: z.string().min(1, 'Order date is required'),
  expected_ship_date: z.string().optional(),
  billing_address: z.record(z.string(), z.any()).optional(),
  shipping_address: z.record(z.string(), z.any()).optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    item_id: z.string().uuid().optional(),
    description: z.string().optional(),
    warehouse_id: z.string().uuid().optional(),
    qty: z.number().positive('Quantity must be positive'),
    unit_id: z.string().uuid(),
    unit_price_minor: z.number().int(),
    discount_minor: z.number().int().optional(),
    tax_minor: z.number().int().optional(),
  })).min(1, 'At least one item is required'),
})

// Purchase order schemas
export const purchaseOrderSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID'),
  order_date: z.string().min(1, 'Order date is required'),
  expected_receipt_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    item_id: z.string().uuid().optional(),
    description: z.string().optional(),
    warehouse_id: z.string().uuid().optional(),
    qty: z.number().positive('Quantity must be positive'),
    unit_id: z.string().uuid(),
    unit_cost_minor: z.number().int(),
    discount_minor: z.number().int().optional(),
    tax_minor: z.number().int().optional(),
  })).min(1, 'At least one item is required'),
})

// Account schemas
export const accountSchema = z.object({
  code: z.string().min(1, 'Account code is required'),
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  subtype: z.string().optional(),
})

// Journal entry schemas
export const journalEntrySchema = z.object({
  entry_date: z.string().min(1, 'Entry date is required'),
  memo: z.string().optional(),
  source_type: z.string().optional(),
  source_id: z.string().uuid().optional(),
  lines: z.array(z.object({
    account_id: z.string().uuid('Invalid account ID'),
    description: z.string().optional(),
    debit_minor: z.number().int().min(0),
    credit_minor: z.number().int().min(0),
  })).min(2, 'At least two lines required'),
}).refine(data => {
  // Debits must equal credits
  const totalDebit = data.lines.reduce((sum, line) => sum + line.debit_minor, 0)
  const totalCredit = data.lines.reduce((sum, line) => sum + line.credit_minor, 0)
  return totalDebit === totalCredit
}, {
  message: 'Debits must equal credits',
  path: ['lines'],
})

// Employee schemas
export const employeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  department_id: z.string().uuid().optional(),
  job_title: z.string().optional(),
  hire_date: z.string().optional(),
  salary: z.number().int().optional(),
})

// Lead schemas
export const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  source: z.string().optional(),
  probability: z.number().min(0).max(100).optional(),
})

// Helper to validate and return errors
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  const errors = result.error.issues.map(issue => 
    `${issue.path.join('.')}: ${issue.message}`
  )
  
  return { success: false, errors }
}
