// Auth helper for API routes
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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
    
    // Create client with the token in header
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )
    
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData.user) {
      return { user: null, error: userError?.message || 'Invalid token' }
    }
    
    // Get user profile from our users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('company_id, email')
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
      },
      error: null,
    }
  } catch (error) {
    console.error('Auth error:', error)
    return { user: null, error: 'Authentication failed' }
  }
}
