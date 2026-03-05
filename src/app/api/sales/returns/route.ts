import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled, requireFeatureEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'
import {generateNextCode} from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'sales', 'read')
    await requireModuleEnabled(request, user.companyId, 'sales')
    await requireFeatureEnabled(request, user.companyId, 'sales.returns')
    const supabase = createRlsClient(request)
    
    // Returns are sales_orders with status starting 'return'
    const { data, error } = await supabase
      .from('sales_orders')
      .select('*, customer:customers(name)')
      .eq('company_id', user.companyId)
      .like('order_no', 'SR%')
      .order('created_at', { ascending: false })

    if (error) throw error
    return successResponse({ returns: data || [] })
  } catch (err: any) {
    return errorResponse('Failed to fetch returns')
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'sales', 'create')
    await requireModuleEnabled(request, user.companyId, 'sales')
    await requireFeatureEnabled(request, user.companyId, 'sales.returns')
    const supabase = createRlsClient(request)
    const body = await request.json()

    const { data: last } = await supabase
      .from('sales_orders')
      .select('order_no')
      .eq('company_id', user.companyId)
      .like('order_no', 'SR%')
      .order('order_no', { ascending: false })
      .limit(1)
      .single()

    const retNo = generateNextCode('SR', last?.order_no || null)

    const { data, error } = await supabase.from('sales_orders').insert({
      company_id: user.companyId,
      order_no: retNo,
      customer_id: body.customer_id,
      order_date: body.return_date || new Date().toISOString().split('T')[0],
      status: 'return',
      currency_code: 'INR',
      subtotal_minor: body.subtotal_minor || 0,
      total_minor: body.total_minor || 0,
      notes: body.reason,
      created_by_user_id: user.id,
    }).select().single()

    if (error) throw error
    return successResponse(data, 'Return created')
  } catch (err: any) {
    return errorResponse('Failed to create return')
  }
}
