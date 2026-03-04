// ============================================
// ADMIN ORGANIZATIONS API
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin, createErrorResponse, createSuccessResponse } from '@/lib/admin-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET - List all organizations
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth
  
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'))
  const offset = (page - 1) * limit
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  
  try {
    let query = supabaseAdmin
      .from('companies')
      .select(`
        *,
        plan:organization_plans(*),
        users(count)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,legal_name.ilike.%${search}%`)
    }
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    return createSuccessResponse({
      organizations: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return createErrorResponse('Failed to fetch organizations', 500)
  }
}

// POST - Create new organization
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth
  
  try {
    const { name, legal_name, gstin, email, admin_email, admin_password } = await request.json()
    
    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return createErrorResponse('Name is required', 400)
    }
    
    if (!admin_email || typeof admin_email !== 'string' || admin_email.trim().length === 0) {
      return createErrorResponse('Admin email is required', 400)
    }
    
    if (!admin_password || typeof admin_password !== 'string' || admin_password.trim().length === 0) {
      return createErrorResponse('Admin password is required', 400)
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(admin_email.trim())) {
      return createErrorResponse('Invalid email format', 400)
    }
    
    // Validate password length (min 6 chars)
    if (admin_password.length < 6) {
      return createErrorResponse('Password must be at least 6 characters', 400)
    }
    
    // Validate name length (max 255)
    if (name.length > 255) {
      return createErrorResponse('Name too long (max 255 characters)', 400)
    }
    
    // Create company
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name,
        legal_name: legal_name || name,
        gstin,
        base_currency_code: 'INR',
        timezone: 'Asia/Kolkata',
        settings: {},
        is_active: true,
        activated_at: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (companyError) throw companyError
    
    // Create default plan
    await supabaseAdmin.from('organization_plans').insert({
      company_id: company.id,
      plan_name: 'basic',
      subscription_status: 'active',
    })
    
    // Create admin user for the company
    const bcrypt = require('bcryptjs')
    const password_hash = await bcrypt.hash(admin_password, 10)
    
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        company_id: company.id,
        email: admin_email,
        role: 'owner',
        is_admin: true,
        is_active: true,
        password_hash,
      })
    
    if (userError) {
      // Rollback company creation
      await supabaseAdmin.from('companies').delete().eq('id', company.id)
      throw userError
    }
    
    // Log admin action
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_user_id: auth.id,
      action: 'create_organization',
      target_type: 'company',
      target_id: company.id,
      details: { company_name: name, admin_email },
    })
    
    return createSuccessResponse(company, 'Organization created successfully')
  } catch (error: any) {
    console.error('Error creating organization:', error)
    return createErrorResponse(error.message || 'Failed to create organization', 500)
  }
}

// PATCH - Update organization
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth
  
  try {
    const { id, name, legal_name, gstin, is_active } = await request.json()
    
    if (!id) {
      return createErrorResponse('Organization ID required', 400)
    }
    
    const updateData: any = {}
    if (name) updateData.name = name
    if (legal_name) updateData.legal_name = legal_name
    if (gstin) updateData.gstin = gstin
    if (is_active !== undefined) {
      updateData.is_active = is_active
      updateData.deactivated_at = is_active ? null : new Date().toISOString()
      updateData.activated_at = is_active ? new Date().toISOString() : null
    }
    
    const { data, error } = await supabaseAdmin
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    // Log admin action
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_user_id: auth.id,
      action: 'update_organization',
      target_type: 'company',
      target_id: id,
      details: { changes: updateData },
    })
    
    return createSuccessResponse(data, 'Organization updated')
  } catch (error: any) {
    console.error('Error updating organization:', error)
    return createErrorResponse(error.message || 'Failed to update', 500)
  }
}

// DELETE - Delete organization
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return createErrorResponse('Organization ID required', 400)
    }
    
    const { error } = await supabaseAdmin
      .from('companies')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    // Log admin action
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_user_id: auth.id,
      action: 'delete_organization',
      target_type: 'company',
      target_id: id,
    })
    
    return createSuccessResponse(null, 'Organization deleted')
  } catch (error: any) {
    console.error('Error deleting organization:', error)
    return createErrorResponse(error.message || 'Failed to delete', 500)
  }
}
