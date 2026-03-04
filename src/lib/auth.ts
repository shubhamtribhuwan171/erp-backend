// Auth helper for API routes
import { createClient } from '@/lib/supabase/server'
import { verifyAuthToken } from '@/lib/jwt'

export interface AuthUser {
  id: string
  email: string
  companyId: string
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

    const supabase = await createClient()
    
    // Get user profile from our users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, company_id, email, is_active')
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
      },
      error: null,
    }
  } catch (error) {
    console.error('Auth error:', error)
    return { user: null, error: 'Authentication failed' }
  }
}
