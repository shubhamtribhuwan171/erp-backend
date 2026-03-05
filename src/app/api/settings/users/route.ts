import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import {successResponse, errorResponse} from '@/lib/utils'
import bcrypt from 'bcryptjs'

// GET /api/settings/users - List users
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'users', 'read')
    const supabase = createRlsClient(request)

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, role, is_admin, is_active, created_at')
      .eq('company_id', user.companyId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return successResponse({ users: data || [] })
  } catch (err: unknown) {
    console.error('List users error:', err)
    const message = err instanceof Error ? err.message : 'Failed to list users'
    if (message.includes('Permission denied')) {
      return errorResponse(message, 403)
    }
    return errorResponse('Failed to list users')
  }
}

// POST /api/settings/users - Create user
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'users', 'create')
    const supabase = createRlsClient(request)
    const body = await request.json()

    if (!body.email || !body.password) {
      return errorResponse('Email and password are required')
    }

    const passwordHash = await bcrypt.hash(body.password, 10)

    // Create user profile
    const { data, error } = await supabase.from('users').insert({
      company_id: user.companyId,
      email: String(body.email).toLowerCase(),
      full_name: body.full_name || String(body.email).split('@')[0],
      password_hash: passwordHash,
      auth_provider: 'password',
      phone: body.phone,
      role: body.role || 'staff',
      is_admin: body.role === 'owner' || body.role === 'admin',
      created_by_user_id: user.id,
      status: 'active',
    }).select().single()

    if (error) throw error

    return successResponse(data, 'User created')
  } catch (err: unknown) {
    console.error('Create user error:', err)
    const message = err instanceof Error ? err.message : 'Failed to create user'
    if (message.includes('Permission denied')) {
      return errorResponse(message, 403)
    }
    return errorResponse('Failed to create user')
  }
}
