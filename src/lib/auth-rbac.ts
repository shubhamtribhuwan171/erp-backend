// Auth helper for API routes with RBAC
import { createRlsClient } from '@/lib/supabase/server'
import { hasPermission, Module, Permission, MODULE_MAP, getActionFromMethod } from '@/lib/rbac'
import { verifyAuthToken } from '@/lib/jwt'
import { httpErrors } from '@/lib/http-error'

export interface AuthUser {
  id: string
  email: string
  companyId: string
  role: string
  roleId?: string
  isAdmin: boolean
  dbRole: string
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

    const payload = verifyAuthToken(token)
    if (!payload) {
      return { user: null, error: 'Invalid token' }
    }

    const supabase = createRlsClient(request)
    
    // Get user profile - just use role field directly
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, company_id, email, role, is_admin, is_active')
      .eq('id', payload.sub)
      .single()
    
    if (profileError || !profile || !profile.is_active) {
      return { user: null, error: 'User profile not found' }
    }
    
    return {
      user: {
        id: profile.id,
        email: profile.email || payload.email,
        companyId: profile.company_id,
        role: profile.role || 'staff', // app role
        isAdmin: profile.is_admin || false,
        dbRole: payload.role || 'authenticated', // db/JWT role used by PostgREST
      },
      error: null,
    }
  } catch (error: unknown) {
    console.error('Auth error:', error)
    return { user: null, error: error instanceof Error ? error.message : 'Authentication failed' }
  }
}

/**
 * Require authentication - returns user or throws 401
 */
export async function requireAuth(request: Request): Promise<AuthUser> {
  const { user, error } = await getAuthUser(request)
  if (!user) {
    throw httpErrors.unauthorized(error || 'Unauthorized')
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
    // Unknown module - deny by default (safer).
    return false
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
    throw httpErrors.forbidden(`Permission denied: ${requiredAction} on ${module}`)
  }
  
  return user
}

/**
 * Require specific role
 */
export async function requireRole(request: Request, allowedRoles: string[]): Promise<AuthUser> {
  const user = await requireAuth(request)
  
  if (!allowedRoles.includes(user.role)) {
    throw httpErrors.forbidden(`Role '${user.role}' not allowed. Required: ${allowedRoles.join(', ')}`)
  }
  
  return user
}
