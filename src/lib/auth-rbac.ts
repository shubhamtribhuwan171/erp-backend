// Auth helper for API routes with RBAC
import { createClient } from '@supabase/supabase-js'
import { hasPermission, Module, Permission, MODULE_MAP, getActionFromMethod } from '@/lib/rbac'

export interface AuthUser {
  id: string
  email: string
  companyId: string
  role: string
  roleId?: string
  isAdmin: boolean
}

/**
 * Get authenticated user from request headers (Bearer token)
 */
export async function getAuthUser(request: Request): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null, error: 'No auth token' }
    }
    
    const token = authHeader.substring(7)
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${token}` } }
      }
    )
    
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData.user) {
      return { user: null, error: userError?.message || 'Invalid token' }
    }
    
    // Get user profile - just use role field directly
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, company_id, email, role, is_admin')
      .eq('id', userData.user.id)
      .single()
    
    if (profileError || !profile) {
      return { user: null, error: 'User profile not found' }
    }
    
    return {
      user: {
        id: userData.user.id,
        email: userData.user.email || '',
        companyId: profile.company_id,
        role: profile.role || 'staff', // Default to staff if not set
        isAdmin: profile.is_admin || false,
      },
      error: null,
    }
  } catch (error: any) {
    console.error('Auth error:', error)
    return { user: null, error: error.message || 'Authentication failed' }
  }
}

/**
 * Require authentication - returns user or throws 401
 */
export async function requireAuth(request: Request): Promise<AuthUser> {
  const { user, error } = await getAuthUser(request)
  if (!user) {
    throw new Error(error || 'Unauthorized')
  }
  return user
}

/**
 * Check permission for a module/action
 */
export function checkPermission(user: AuthUser, module: string, action: Permission): boolean {
  // Owners and admins have full access
  if (user.isAdmin || user.role === 'owner') {
    return true
  }
  
  const mappedModule = MODULE_MAP[module] as Module
  if (!mappedModule) {
    // Unknown module - allow for now (could be restrictive)
    return true
  }
  
  return hasPermission(user.role, mappedModule, action)
}

/**
 * Require permission - throws 403 if denied
 */
export async function requirePermission(
  request: Request, 
  module: string, 
  action?: Permission
): Promise<AuthUser> {
  const user = await requireAuth(request)
  
  // If no specific action, derive from method
  const requiredAction = action || getActionFromMethod(request.method)
  
  if (!checkPermission(user, module, requiredAction)) {
    throw new Error(`Permission denied: ${requiredAction} on ${module}`)
  }
  
  return user
}

/**
 * Require specific role
 */
export async function requireRole(request: Request, allowedRoles: string[]): Promise<AuthUser> {
  const user = await requireAuth(request)
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Role '${user.role}' not allowed. Required: ${allowedRoles.join(', ')}`)
  }
  
  return user
}
