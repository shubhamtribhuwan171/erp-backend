import { NextRequest } from 'next/server'
import { createClientWithToken } from '@/lib/supabase/server'
import { successResponse, errorResponse, unauthorizedResponse, handleApiError } from '@/lib/utils'
import { signAuthToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return errorResponse('Email and password required')
    }

    // Use PostgREST RPC with anon key (no JWT yet). Proxy strips anon-key Authorization.
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClientWithToken(anonKey)

    const { data: rows, error: rpcError } = await supabase.rpc('rpc_login', {
      p_email: String(email).toLowerCase(),
      p_password: String(password),
    })

    if (rpcError || !rows || rows.length === 0) {
      return unauthorizedResponse()
    }

    const userData = rows[0] as any

    const accessToken = signAuthToken({
      sub: userData.user_id,
      email: userData.email,
      company_id: userData.company_id,
      role: 'authenticated',
      is_admin: !!userData.is_admin,
    })

    return successResponse({
      user: {
        id: userData.user_id,
        email: userData.email,
        fullName: userData.full_name || userData.email.split('@')[0],
        role: userData.role,
        companyId: userData.company_id,
      },
      session: {
        access_token: accessToken,
        token_type: 'bearer',
        expires_in: 60 * 60 * 24 * 7,
      },
    }, 'Login successful')
  } catch (error) {
    console.error('Login error:', error)
    return handleApiError(error, 'Login failed')}
}
