import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { successResponse, errorResponse } from '@/lib/utils'

// GET /api/settings/users - List users
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'users', 'read')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, role, is_admin, is_active, created_at')
      .eq('company_id', user.companyId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return successResponse({ users: data || [] })
  } catch (err: any) {
    console.error('List users error:', err)
    if (err.message?.includes('Permission denied')) {
      return errorResponse(err.message, 403)
    }
    return errorResponse('Failed to list users')
  }
}

// POST /api/settings/users - Create user
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'users', 'create')
    const supabase = await createClient()
    const body = await request.json()

    // Create auth user
    const adminClient = require('@supabase/supabase-js').createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return errorResponse(authError?.message || 'Failed to create user')
    }

    // Create user profile
    const { data, error } = await supabase.from('users').insert({
      id: authData.user.id,
      company_id: user.companyId,
      email: body.email,
      full_name: body.full_name,
      phone: body.phone,
      role: body.role || 'staff',
      is_admin: body.role === 'owner' || body.role === 'admin',
      created_by_user_id: user.id,
    }).select().single()

    if (error) {
      await adminClient.auth.admin.deleteUser(authData.user.id)
      throw error
    }

    return successResponse(data, 'User created')
  } catch (err: any) {
    console.error('Create user error:', err)
    if (err.message?.includes('Permission denied')) {
      return errorResponse(err.message, 403)
    }
    return errorResponse('Failed to create user')
  }
}
