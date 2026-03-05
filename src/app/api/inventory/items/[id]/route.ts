import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse, notFoundResponse, handleApiError } from '@/lib/utils'

// GET /api/inventory/items/[id] - Get single item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'inventory', 'read')
    await requireModuleEnabled(request, user.companyId, 'inventory')

    const { id } = await params
    const supabase = createRlsClient(request)

    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        category:inventory_categories(name, code),
        unit:units(name, code)
      `)
      .eq('company_id', user.companyId)
      .eq('id', id)
      .single()

    if (error || !data) {
      return notFoundResponse('Item')
    }

    // Get stock balance
    const { data: stockData } = await supabase
      .from('stock_balances')
      .select('*')
      .eq('company_id', user.companyId)
      .eq('item_id', id)

    // Get recent stock transactions
    const { data: transactions } = await supabase
      .from('stock_transactions')
      .select(`
        *,
        warehouse:warehouses(name, code),
        reference:sales_orders!stock_transactions_reference_id_fkey(order_no)
      `)
      .eq('company_id', user.companyId)
      .eq('item_id', id)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get related purchase orders (where this item appears)
    const { data: purchaseOrders } = await supabase
      .from('purchase_order_items')
      .select(`
        *,
        order:purchase_orders(id, po_no, order_date, status, vendor:vendors(name))
      `)
      .eq('company_id', user.companyId)
      .eq('item_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get related sales orders (where this item appears)
    const { data: salesOrders } = await supabase
      .from('sales_order_items')
      .select(`
        *,
        order:sales_orders(id, order_no, order_date, status, customer:customers(name))
      `)
      .eq('company_id', user.companyId)
      .eq('item_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calculate stats
    const totalPurchased = purchaseOrders?.reduce((sum: number, po: any) => sum + (po.qty || po.quantity || 0), 0) || 0
    const totalSold = salesOrders?.reduce((sum: number, so: any) => sum + (so.qty || so.quantity || 0), 0) || 0
    const totalOnHand = (stockData || []).reduce((sum: number, s: any) => sum + (Number(s.qty_on_hand || s.quantity || 0) || 0), 0)

    return successResponse({
      ...data,
      stock: stockData || [],
      transactions: transactions || [],
      purchaseOrders: purchaseOrders || [],
      salesOrders: salesOrders || [],
      stats: {
        totalOnHand,
        totalPurchased,
        totalSold,
        reorderLevel: data.reorder_level || 0,
        reorderQty: data.reorder_qty || 0,
        needsReorder: totalOnHand <= (data.reorder_level || 0),
      },
    })
  } catch (error) {
    console.error('Get item error:', error)
    return handleApiError(error, 'Failed to fetch item')}
}

// PUT /api/inventory/items/[id] - Update item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'inventory', 'update')
    await requireModuleEnabled(request, user.companyId, 'inventory')

    const { id } = await params
    const supabase = createRlsClient(request)
    const body = await request.json()

    const { data, error } = await supabase
      .from('inventory_items')
      .update({
        name: body.name,
        description: body.description,
        category_id: body.category_id,
        unit_id: body.unit_id,
        track_inventory: body.track_inventory,
        is_serialized: body.is_serialized,
        is_batch_tracked: body.is_batch_tracked,
        reorder_level: body.reorder_level,
        reorder_qty: body.reorder_qty,
        standard_cost_minor: body.standard_cost_minor,
        sale_price_minor: body.sale_price_minor,
        status: body.status,
      })
      .eq('company_id', user.companyId)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return successResponse(data, 'Item updated')
  } catch (error) {
    console.error('Update item error:', error)
    return handleApiError(error, 'Failed to update item')}
}

// DELETE /api/inventory/items/[id] - Delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'inventory', 'delete')
    await requireModuleEnabled(request, user.companyId, 'inventory')

    const { id } = await params
    const supabase = createRlsClient(request)

    // Check for stock transactions
    const { data: transactions } = await supabase
      .from('stock_transactions')
      .select('id')
      .eq('company_id', user.companyId)
      .eq('item_id', id)
      .limit(1)

    if (transactions?.length) {
      return errorResponse('Cannot delete item with stock transactions')
    }

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('company_id', user.companyId)
      .eq('id', id)

    if (error) throw error

    return successResponse(null, 'Item deleted')
  } catch (error) {
    console.error('Delete item error:', error)
    return handleApiError(error, 'Failed to delete item')}
}
