import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse, notFoundResponse, handleApiError } from '@/lib/utils'

// GET /api/sales/orders/[id] - Get order with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'sales', 'read')
    await requireModuleEnabled(request, user.companyId, 'sales')

    const { id } = await params
    const supabase = createRlsClient(request)

    const { data: order, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:customers(code, name, email, phone)
      `)
      .eq('id', id)
      .eq('company_id', user.companyId)
      .single()

    if (error || !order) {
      return notFoundResponse('Order')
    }

    const { data: items } = await supabase
      .from('sales_order_items')
      .select(`
        *,
        item:inventory_items(name, sku),
        unit:units(name, code)
      `)
      .eq('sales_order_id', id)
      .eq('company_id', user.companyId)

    // Get related quotation if this order was converted from one
    let relatedQuotation = null
    if (order.quotation_id) {
      const { data: quo } = await supabase
        .from('sales_orders')
        .select('id, order_no, order_date, status')
        .eq('id', order.quotation_id)
        .single()
      relatedQuotation = quo
    }

    // Check if there are any invoices derived from this order
    const { data: relatedInvoices } = await supabase
      .from('sales_orders')
      .select('id, order_no, order_date, status, total_minor')
      .eq('customer_id', order.customer_id)
      .eq('company_id', user.companyId)
      .eq('status', 'invoiced')
      .gte('created_at', order.created_at)

    return successResponse({
      ...order,
      items: items || [],
      relatedQuotation,
      relatedInvoices: relatedInvoices || [],
      totals: {
        subtotal_minor: order.subtotal_minor ?? 0,
        discount_minor: order.discount_minor ?? 0,
        tax_minor: order.tax_minor ?? 0,
        total_minor: order.total_minor ?? 0,
      },
    })
  } catch (error) {
    console.error('Get order error:', error)
    return handleApiError(error, 'Failed to fetch order')}
}

// PUT /api/sales/orders/[id] - Update order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'sales', 'update')
    await requireModuleEnabled(request, user.companyId, 'sales')

    const { id } = await params
    const supabase = createRlsClient(request)
    const body = await request.json()

    // Check if order can be edited
    const { data: existing } = await supabase
      .from('sales_orders')
      .select('status')
      .eq('id', id)
      .eq('company_id', user.companyId)
      .single()

    if (existing?.status !== 'draft') {
      return errorResponse('Only draft orders can be edited')
    }

    const { data, error } = await supabase
      .from('sales_orders')
      .update({
        customer_id: body.customer_id,
        order_date: body.order_date,
        expected_ship_date: body.expected_ship_date,
        billing_address: body.billing_address,
        shipping_address: body.shipping_address,
        notes: body.notes,
      })
      .eq('id', id)
      .eq('company_id', user.companyId)
      .select()
      .single()

    if (error) throw error

    return successResponse(data, 'Order updated')
  } catch (error) {
    console.error('Update order error:', error)
    return handleApiError(error, 'Failed to update order')}
}

// PATCH /api/sales/orders/[id] - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'sales', 'update')
    await requireModuleEnabled(request, user.companyId, 'sales')

    const { id } = await params
    const supabase = createRlsClient(request)
    const body = await request.json()

    const { status } = body

    const validTransitions: Record<string, string[]> = {
      draft: ['confirmed', 'cancelled'],
      confirmed: ['shipped', 'cancelled'],
      shipped: ['invoiced', 'cancelled'],
      invoiced: ['cancelled'],
    }

    const { data: existing } = await supabase
      .from('sales_orders')
      .select('status')
      .eq('id', id)
      .eq('company_id', user.companyId)
      .single()

    if (!existing) return notFoundResponse('Order')

    if (!validTransitions[existing.status]?.includes(status)) {
      return errorResponse(`Cannot transition from ${existing.status} to ${status}`)
    }

    const { data, error } = await supabase
      .from('sales_orders')
      .update({ status })
      .eq('id', id)
      .eq('company_id', user.companyId)
      .select()
      .single()

    if (error) throw error

    return successResponse(data, `Order ${status}`)
  } catch (error) {
    console.error('Update order status error:', error)
    return handleApiError(error, 'Failed to update order status')}
}
