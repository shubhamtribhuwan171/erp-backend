import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'

// POST /api/inventory/transfer - Transfer stock between warehouses
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'inventory', 'create')
    await requireModuleEnabled(user.companyId, 'inventory')
    const supabase = createApiClient()
    const body = await request.json()

    const { from_warehouse_id, to_warehouse_id, item_id, qty, unit_id, notes } = body

    if (from_warehouse_id === to_warehouse_id) {
      return errorResponse('Source and destination must be different')
    }

    // Create two transactions: one out, one in
    const txnDate = new Date().toISOString()
    const transferId = crypto.randomUUID()

    // Transfer out
    const { error: outError } = await supabase.from('stock_transactions').insert({
      company_id: user.companyId,
      txn_type: 'transfer_out',
      txn_date: txnDate,
      item_id,
      warehouse_id: from_warehouse_id,
      qty: -Math.abs(qty),
      unit_id,
      reference_type: 'transfer',
      reference_id: transferId,
      notes: `Transfer to ${to_warehouse_id}: ${notes}`,
      created_by_user_id: user.id,
    })

    if (outError) throw outError

    // Transfer in
    const { error: inError } = await supabase.from('stock_transactions').insert({
      company_id: user.companyId,
      txn_type: 'transfer_in',
      txn_date: txnDate,
      item_id,
      warehouse_id: to_warehouse_id,
      qty: Math.abs(qty),
      unit_id,
      reference_type: 'transfer',
      reference_id: transferId,
      notes: `Transfer from ${from_warehouse_id}: ${notes}`,
      created_by_user_id: user.id,
    })

    if (inError) throw inError

    return successResponse({ transfer_id: transferId }, 'Transfer completed')
  } catch (err: any) {
    console.error('Transfer error:', err)
    return errorResponse('Failed to complete transfer')
  }
}
