import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled, requireFeatureEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'

// GET /api/inventory/transfers - List stock transfers
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'inventory', 'read')
    await requireModuleEnabled(request, user.companyId, 'inventory')
    await requireFeatureEnabled(request, user.companyId, 'inventory.transfers')
    const supabase = createRlsClient(request)

    // Get all transfer transactions grouped by reference_id
    const { data: txns, error } = await supabase
      .from('stock_transactions')
      .select(`
        *,
        item:inventory_items(name, sku),
        from_warehouse:warehouse_from(name, code),
        to_warehouse:warehouse_to(name, code),
        created_user:users(name)
      `)
      .eq('company_id', user.companyId)
      .in('txn_type', ['transfer_out', 'transfer_in'])
      .order('created_at', { ascending: false })

    if (error) throw error

    // Group by transfer (reference_id)
    const transfersMap = new Map()
    
    for (const txn of txns || []) {
      const refId = txn.reference_id
      if (!refId) continue
      
      if (!transfersMap.has(refId)) {
        transfersMap.set(refId, {
          id: refId,
          transfer_no: `TRF-${refId.slice(0, 8).toUpperCase()}`,
          from_warehouse: null,
          to_warehouse: null,
          transfer_date: txn.txn_date,
          status: 'completed',
          items: [],
          created_at: txn.created_at,
        })
      }
      
      const transfer = transfersMap.get(refId)
      
      if (txn.txn_type === 'transfer_out') {
        transfer.from_warehouse = txn.warehouse
        transfer.status = 'pending'
      } else {
        transfer.to_warehouse = txn.warehouse
      }
      
      transfer.items.push({
        item: txn.item,
        qty: Math.abs(txn.qty),
        unit: txn.unit,
      })
    }

    const transfers = Array.from(transfersMap.values())
    return successResponse({ transfers })
  } catch (err: any) {
    console.error('List transfers error:', err)
    return errorResponse('Failed to list transfers')
  }
}
