import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'
import {generateNextCode} from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'purchases', 'read')
    await requireModuleEnabled(user.companyId, 'purchases')
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, vendor:vendors(name)')
      .eq('company_id', user.companyId)
      .like('po_no', 'PR%')
      .order('created_at', { ascending: false })

    if (error) throw error
    return successResponse({ returns: data || [] })
  } catch (err: any) {
    return errorResponse('Failed to fetch returns')
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'purchases', 'create')
    await requireModuleEnabled(user.companyId, 'purchases')
    const supabase = await createClient()
    const body = await request.json()

    const { data: last } = await supabase
      .from('purchase_orders')
      .select('po_no')
      .eq('company_id', user.companyId)
      .like('po_no', 'PR%')
      .order('po_no', { ascending: false })
      .limit(1)
      .single()

    const retNo = generateNextCode('PR', last?.po_no || null)

    const { data, error } = await supabase.from('purchase_orders').insert({
      company_id: user.companyId,
      po_no: retNo,
      vendor_id: body.vendor_id,
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
