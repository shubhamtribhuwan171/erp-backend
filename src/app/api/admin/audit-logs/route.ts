// ============================================
// ADMIN AUDIT LOGS API
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin, createErrorResponse, createSuccessResponse } from '@/lib/admin-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET - List audit logs
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth
  
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'))
  const offset = (page - 1) * limit
  const adminId = searchParams.get('admin_id')
  const action = searchParams.get('action')
  const targetType = searchParams.get('target_type')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  
  try {
    let query = supabaseAdmin
      .from('admin_audit_logs')
      .select(`
        *,
        admin:platform_admins(id, email, full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (adminId) {
      query = query.eq('admin_user_id', adminId)
    }
    
    if (action) {
      query = query.eq('action', action)
    }
    
    if (targetType) {
      query = query.eq('target_type', targetType)
    }
    
    if (from) {
      query = query.gte('created_at', from)
    }
    
    if (to) {
      query = query.lte('created_at', to)
    }
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    // Get unique actions for filter
    const { data: actions } = await supabaseAdmin
      .from('admin_audit_logs')
      .select('action')
      .order('action')
    
    const uniqueActions = [...new Set(actions?.map(a => a.action) || [])]
    
    return createSuccessResponse({
      logs: data,
      filters: {
        actions: uniqueActions,
      },
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return createErrorResponse('Failed to fetch audit logs', 500)
  }
}
