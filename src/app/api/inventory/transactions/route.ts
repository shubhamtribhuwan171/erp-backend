import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'

// GET /api/inventory/transactions - List stock movements
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'inventory', 'read')
    await requireModuleEnabled(user.companyId, 'inventory')
    const supabase = createApiClient()
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('item_id')
    const warehouseId = searchParams.get('warehouse_id')

    let query = supabase
      .from('stock_transactions')
      .select(`
        *,
        item:inventory_items(name, sku),
        warehouse:warehouses(name, code),
        unit:units(name, code)
      `)
      .eq('company_id', user.companyId)
      .order('created_at', { ascending: false })

    if (itemId) query = query.eq('item_id', itemId)
    if (warehouseId) query = query.eq('warehouse_id', warehouseId)

    const { data, error } = await query.limit(100)

    if (error) throw error
    return successResponse({ transactions: data || [] })
  } catch (err: any) {
    console.error('List transactions error:', err)
    return errorResponse('Failed to list transactions')
  }
}

// POST /api/inventory/transactions - Create stock movement
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'inventory', 'create')
    await requireModuleEnabled(user.companyId, 'inventory')
    const supabase = createApiClient()
    const body = await request.json()

    const { data, error } = await supabase.from('stock_transactions').insert({
      company_id: user.companyId,
      txn_type: body.txn_type, // purchase, sale, adjustment, transfer_in, transfer_out
      txn_date: new Date().toISOString(),
      item_id: body.item_id,
      warehouse_id: body.warehouse_id,
      qty: body.qty,
      unit_id: body.unit_id,
      unit_cost_minor: body.unit_cost_minor,
      reference_type: body.reference_type,
      reference_id: body.reference_id,
      batch_no: body.batch_no,
      serial_no: body.serial_no,
      notes: body.notes,
      created_by_user_id: user.id,
    }).select().single()

    if (error) throw error
    return successResponse(data, 'Transaction recorded')
  } catch (err: any) {
    console.error('Create transaction error:', err)
    return errorResponse('Failed to record transaction')
  }
}
