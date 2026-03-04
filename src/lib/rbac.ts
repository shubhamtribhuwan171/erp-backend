// RBAC System for ERP

export type Permission = 'create' | 'read' | 'update' | 'delete' | 'export' | 'approve'
export type Module = 'customers' | 'vendors' | 'inventory' | 'sales' | 'purchases' | 'accounting' | 'hr' | 'reports' | 'settings' | 'users'

// Role definitions with default permissions
export const ROLE_PERMISSIONS: Record<string, Module[]> = {
  owner: [
    'customers', 'vendors', 'inventory', 'sales', 'purchases', 
    'accounting', 'hr', 'reports', 'settings', 'users'
  ],
  admin: [
    'customers', 'vendors', 'inventory', 'sales', 'purchases', 
    'accounting', 'hr', 'reports', 'settings'
  ],
  manager: [
    'customers', 'vendors', 'inventory', 'sales', 'purchases'
  ],
  staff: [
    'customers', 'inventory', 'sales'
  ],
}

// Check if role has permission on module
export function hasPermission(role: string, module: Module, action: Permission): boolean {
  const allowedModules = ROLE_PERMISSIONS[role] || []
  
  // Owners and admins can do anything on their modules
  if (role === 'owner' || role === 'admin') {
    return allowedModules.includes(module)
  }
  
  // Staff can only create/read, not delete
  if (role === 'staff') {
    return allowedModules.includes(module) && ['create', 'read', 'update'].includes(action)
  }
  
  // Managers can do create/read/update, no delete
  if (role === 'manager') {
    return allowedModules.includes(module) && action !== 'delete'
  }
  
  return false
}

// Module name to API module mapping
export const MODULE_MAP: Record<string, Module> = {
  'customers': 'customers',
  'customer': 'customers',
  'vendors': 'vendors',
  'vendor': 'vendors',
  'inventory_items': 'inventory',
  'inventory': 'inventory',
  'sales_orders': 'sales',
  'sales': 'sales',
  'purchase_orders': 'purchases',
  'purchases': 'purchases',
  'accounts': 'accounting',
  'ledger_entries': 'accounting',
  'accounting': 'accounting',
  'employees': 'hr',
  'departments': 'hr',
  'hr': 'hr',
  'users': 'users',
  'settings': 'settings',
}

// Get action from HTTP method
export function getActionFromMethod(method: string): Permission {
  switch (method.toUpperCase()) {
    case 'POST': return 'create'
    case 'GET': return 'read'
    case 'PUT':
    case 'PATCH': return 'update'
    case 'DELETE': return 'delete'
    default: return 'read'
  }
}
