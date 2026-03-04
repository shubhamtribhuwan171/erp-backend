// ============================================
// ADMIN USERS API - Global User Management
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { requireAdmin, createErrorResponse, createSuccessResponse } from '@/lib/admin-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET - List all users across organizations
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth
  
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'))
  const offset = (page - 1) * limit
  const orgId = searchParams.get('org_id')
  const role = searchParams.get('role')
  const search = searchParams.get('search')
  const isActive = searchParams.get('is_active')
  
  try {
    let query = supabaseAdmin
      .from('users')
      .select(`
        *,
        company:companies(id, name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (orgId) {
      query = query.eq('company_id', orgId)
    }
    
    if (role) {
      query = query.eq('role', role)
    }
    
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }
    
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    return createSuccessResponse({
      users: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return createErrorResponse('Failed to fetch users', 500)
  }
}

// POST - Create user in any organization
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth
  
  try {
    const { email, password, full_name, company_id, role, is_admin } = await request.json()
    
    // Validate required fields
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return createErrorResponse('Email is required', 400)
    }
    
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      return createErrorResponse('Password is required', 400)
    }
    
    if (!company_id || typeof company_id !== 'string' || company_id.trim().length === 0) {
      return createErrorResponse('Company is required', 400)
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return createErrorResponse('Invalid email format', 400)
    }
    
    // Validate password length
    if (password.length < 6) {
      return createErrorResponse('Password must be at least 6 characters', 400)
    }
    
    // Check company exists
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', company_id)
      .single()
    
    if (!company) {
      return createErrorResponse('Company not found', 404)
    }
    
    // Check email not taken
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()
    
    if (existing) {
      return createErrorResponse('Email already in use', 400)
    }
    
    const password_hash = await bcrypt.hash(password, 10)
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        company_id,
        email: email.toLowerCase(),
        full_name: full_name || null,
        role: role || 'staff',
        is_admin: is_admin || false,
        is_active: true,
        password_hash,
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Log admin action
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_user_id: auth.id,
      action: 'create_user',
      target_type: 'user',
      target_id: data.id,
      details: { email, company_id, role },
    })
    
    return createSuccessResponse(data, 'User created successfully')
  } catch (error: any) {
    console.error('Error creating user:', error)
    return createErrorResponse(error.message || 'Failed to create user', 500)
  }
}

// PATCH - Update any user
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth
  
  try {
    const { id, full_name, role, is_admin, is_active, password } = await request.json()
    
    if (!id) {
      return createErrorResponse('User ID required', 400)
    }
    
    const updateData: any = {}
    if (full_name !== undefined) updateData.full_name = full_name
    if (role !== undefined) updateData.role = role
    if (is_admin !== undefined) updateData.is_admin = is_admin
    if (is_active !== undefined) updateData.is_active = is_active
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10)
    }
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    // Log admin action
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_user_id: auth.id,
      action: 'update_user',
      target_type: 'user',
      target_id: id,
      details: { changes: updateData },
    })
    
    return createSuccessResponse(data, 'User updated')
  } catch (error: any) {
    console.error('Error updating user:', error)
    return createErrorResponse(error.message || 'Failed to update user', 500)
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return createErrorResponse('User ID required', 400)
    }
    
    // Prevent deleting self
    if (id === auth.id) {
      return createErrorResponse('Cannot delete your own account', 400)
    }
    
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    // Log admin action
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_user_id: auth.id,
      action: 'delete_user',
      target_type: 'user',
      target_id: id,
    })
    
    return createSuccessResponse(null, 'User deleted')
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return createErrorResponse(error.message || 'Failed to delete user', 500)
  }
}
