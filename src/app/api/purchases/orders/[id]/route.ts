import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse, notFoundResponse, handleApiError } from '@/lib/utils'

// GET /api/purchases/orders/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'purchases', 'read')
    await requireModuleEnabled(user.companyId, 'purchases')

    const { id } = await params
    const supabase = await createClient()

    const { data: order, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        vendor:vendors(code, name, email, phone)
      `)
      .eq('id', id)
      .eq('company_id', user.companyId)
      .single()

    if (error || !order) {
      return notFoundResponse('Order')
    }

    const { data: items } = await supabase
      .from('purchase_order_items')
      .select(`
        *,
        item:inventory_items(name, sku),
        unit:units(name, code)
      `)
      .eq('purchase_order_id', id)
      .eq('company_id', user.companyId)

    return successResponse({
      ...order,
      items: items || [],
    })
  } catch (error) {
    console.error('Get purchase order error:', error)
    return handleApiError(error, 'Failed to fetch order')}
}

// PUT /api/purchases/orders/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'purchases', 'update')
    await requireModuleEnabled(user.companyId, 'purchases')

    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    const { data: existing } = await supabase
      .from('purchase_orders')
      .select('status')
      .eq('id', id)
      .eq('company_id', user.companyId)
      .single()

    if (existing?.status !== 'draft') {
      return errorResponse('Only draft orders can be edited')
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        vendor_id: body.vendor_id,
        order_date: body.order_date,
        expected_receipt_date: body.expected_receipt_date,
        notes: body.notes,
      })
      .eq('id', id)
      .eq('company_id', user.companyId)
      .select()
      .single()

    if (error) throw error

    return successResponse(data, 'Order updated')
  } catch (error) {
    console.error('Update purchase order error:', error)
    return handleApiError(error, 'Failed to update order')}
}

// PATCH /api/purchases/orders/[id] - Update status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'purchases', 'update')
    await requireModuleEnabled(user.companyId, 'purchases')

    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    const { status } = body

    const validTransitions: Record<string, string[]> = {
      draft: ['approved', 'cancelled'],
      approved: ['sent', 'cancelled'],
      sent: ['part_received', 'closed', 'cancelled'],
      part_received: ['part_received', 'closed', 'cancelled'],
    }

    const { data: existing } = await supabase
      .from('purchase_orders')
      .select('status')
      .eq('id', id)
      .eq('company_id', user.companyId)
      .single()

    if (!existing) return notFoundResponse('Order')

    if (!validTransitions[existing.status]?.includes(status)) {
      return errorResponse(`Cannot transition from ${existing.status} to ${status}`)
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({ status })
      .eq('id', id)
      .eq('company_id', user.companyId)
      .select()
      .single()

    if (error) throw error

    return successResponse(data, `Order ${status}`)
  } catch (error) {
    console.error('Update purchase order status error:', error)
    return handleApiError(error, 'Failed to update order status')}
}
