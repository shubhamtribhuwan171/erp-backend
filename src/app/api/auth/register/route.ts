import { NextRequest } from 'next/server'
import { createClientWithToken } from '@/lib/supabase/server'
import { successResponse, errorResponse, handleApiError } from '@/lib/utils'
import { signAuthToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const { email, password, companyName, fullName } = await request.json()

    if (!email || !password || !companyName) {
      return errorResponse('Email, password, and company name required')
    }

    // Use PostgREST RPC with anon key (no JWT yet). Proxy strips anon-key Authorization.
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClientWithToken(anonKey)

    const { data: rows, error: rpcError } = await supabase.rpc('rpc_register', {
      p_email: String(email).toLowerCase(),
      p_password: String(password),
      p_company_name: String(companyName),
      p_full_name: fullName ? String(fullName) : '',
    })

    if (rpcError || !rows || rows.length === 0) {
      return errorResponse(rpcError?.message || 'Failed to register', 400)
    }

    const reg = rows[0] as any

    const accessToken = signAuthToken({
      sub: reg.user_id,
      email: reg.email,
      company_id: reg.company_id,
      role: 'authenticated',
      is_admin: true,
    })

    return successResponse({
      company: {
        id: reg.company_id,
        name: reg.company_name,
      },
      user: {
        id: reg.user_id,
        email: reg.email,
      },
      session: {
        access_token: accessToken,
        token_type: 'bearer',
        expires_in: 60 * 60 * 24 * 7,
      },
    }, 'Company created successfully')
  } catch (error) {
    console.error('Register error:', error)
    return handleApiError(error, 'Registration failed')}
}
