import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled, requireFeatureEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'

// POST /api/inventory/adjustment - Adjust stock
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'inventory', 'create')
    await requireModuleEnabled(request, user.companyId, 'inventory')
    await requireFeatureEnabled(request, user.companyId, 'inventory.adjustments')
    const supabase = createRlsClient(request)
    const body = await request.json()

    const { item_id, warehouse_id, qty_change, reason, unit_id } = body

    const { data, error } = await supabase.from('stock_transactions').insert({
      company_id: user.companyId,
      txn_type: qty_change > 0 ? 'adjustment_in' : 'adjustment_out',
      txn_date: new Date().toISOString(),
      item_id,
      warehouse_id,
      qty: qty_change,
      unit_id,
      notes: reason,
      created_by_user_id: user.id,
    }).select().single()

    if (error) throw error
    return successResponse(data, 'Adjustment recorded')
  } catch (err: any) {
    console.error('Adjustment error:', err)
    return errorResponse('Failed to record adjustment')
  }
}
