import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils'
import { signAuthToken } from '@/lib/jwt'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return errorResponse('Email and password required')
    }

    const supabase = await createClient()

    // DB-backed login for local/dev setup
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        company_id,
        is_admin,
        is_active,
        password_hash,
        companies!inner(name)
      `)
      .eq('email', String(email).toLowerCase())
      .single()

    if (userError || !userData || !userData.is_active || !userData.password_hash) {
      return unauthorizedResponse()
    }

    const passwordValid = await bcrypt.compare(password, userData.password_hash)
    if (!passwordValid) {
      return unauthorizedResponse()
    }

    const accessToken = signAuthToken({
      sub: userData.id,
      email: userData.email,
      companyId: userData.company_id,
      role: userData.role || 'staff',
      isAdmin: !!userData.is_admin,
    })

    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userData.id)

    return successResponse({
      user: {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name || userData.email.split('@')[0],
        role: userData.role,
        companyId: userData.company_id,
        companyName: Array.isArray(userData.companies) ? userData.companies[0]?.name : (userData.companies as any)?.name,
      },
      session: {
        access_token: accessToken,
        token_type: 'bearer',
        expires_in: 60 * 60 * 24 * 7,
      },
    }, 'Login successful')
  } catch (error) {
    console.error('Login error:', error)
    return errorResponse('Login failed')
  }
}
