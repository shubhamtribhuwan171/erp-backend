// ============================================
// ADMIN MIDDLEWARE
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey)

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  is_super_admin: boolean
}

export async function requireAdmin(request: NextRequest): Promise<AdminUser | NextResponse> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  // Verify token against platform_admins
  const { data: admin, error } = await supabaseAdmin
    .from('platform_admins')
    .select('id, email, full_name, role, is_super_admin, is_active')
    .eq('id', token)
    .single()
  
  if (error || !admin) {
    // Try email-based lookup
    const { data: adminByEmail } = await supabaseAdmin
      .from('platform_admins')
      .select('id, email, full_name, role, is_super_admin, is_active')
      .eq('email', token)
      .single()
    
    if (!adminByEmail || !adminByEmail.is_active) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    
    return adminByEmail as AdminUser
  }
  
  if (!admin.is_active) {
    return NextResponse.json({ error: 'Account disabled' }, { status: 403 })
  }
  
  return admin as AdminUser
}

export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ success: false, message }, { status })
}

export function createSuccessResponse(data: any, message?: string) {
  return NextResponse.json({ success: true, message, data })
}
