// ============================================
// ADMIN DASHBOARD STATS API
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin, createErrorResponse, createSuccessResponse } from '@/lib/admin-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth
  
  try {
    // Get organization stats
    const { count: totalOrgs } = await supabaseAdmin
      .from('companies')
      .select('*', { count: 'exact', head: true })
    
    const { count: activeOrgs } = await supabaseAdmin
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    // Get user stats
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    // Get recent organizations
    const { data: recentOrgs } = await supabaseAdmin
      .from('companies')
      .select('id, name, created_at, is_active')
      .order('created_at', { ascending: false })
      .limit(5)
    
    // Get recent admin actions
    const { data: recentActions } = await supabaseAdmin
      .from('admin_audit_logs')
      .select(`
        *,
        admin:platform_admins(email)
      `)
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Get plans distribution
    const { data: plans } = await supabaseAdmin
      .from('organization_plans')
      .select('plan_name, subscription_status')
    
    const planDistribution = plans?.reduce((acc, p) => {
      acc[p.plan_name] = (acc[p.plan_name] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    // Get login history stats (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: logins24h } = await supabaseAdmin
      .from('user_login_history')
      .select('*', { count: 'exact', head: true })
      .gte('login_at', yesterday)
      .eq('success', true)
    
    return createSuccessResponse({
      stats: {
        totalOrganizations: totalOrgs || 0,
        activeOrganizations: activeOrgs || 0,
        totalUsers: totalUsers || 0,
        loginsLast24h: logins24h || 0,
      },
      recentOrganizations: recentOrgs,
      recentActions,
      planDistribution,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return createErrorResponse('Failed to fetch stats', 500)
  }
}
