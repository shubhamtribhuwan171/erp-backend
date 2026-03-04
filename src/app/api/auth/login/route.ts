import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return errorResponse('Email and password required')
    }

    const supabase = await createClient()

    // Sign in with email/password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return unauthorizedResponse()
    }

    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*, companies!inner(name)')
      .eq('id', authData.user.id)
      .single()

    if (userError || !userData) {
      return unauthorizedResponse()
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', authData.user.id)

    return successResponse({
      user: {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        role: userData.role,
        companyId: userData.company_id,
        companyName: userData.companies?.name,
      },
      session: authData.session,
    }, 'Login successful')
  } catch (error) {
    console.error('Login error:', error)
    return errorResponse('Login failed')
  }
}
