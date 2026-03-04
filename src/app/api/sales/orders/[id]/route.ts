import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils'

// GET /api/sales/orders/[id] - Get order with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: order, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:customers(code, name, email, phone)
      `)
      .eq('id', id)
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

    return successResponse({
      ...order,
      items: items || [],
    })
  } catch (error) {
    console.error('Get order error:', error)
    return errorResponse('Failed to fetch order')
  }
}

// PUT /api/sales/orders/[id] - Update order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Check if order can be edited
    const { data: existing } = await supabase
      .from('sales_orders')
      .select('status')
      .eq('id', id)
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
      .select()
      .single()

    if (error) throw error

    return successResponse(data, 'Order updated')
  } catch (error) {
    console.error('Update order error:', error)
    return errorResponse('Failed to update order')
  }
}

// PATCH /api/sales/orders/[id] - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
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
      .single()

    if (!existing) return notFoundResponse('Order')

    if (!validTransitions[existing.status]?.includes(status)) {
      return errorResponse(`Cannot transition from ${existing.status} to ${status}`)
    }

    const { data, error } = await supabase
      .from('sales_orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return successResponse(data, `Order ${status}`)
  } catch (error) {
    console.error('Update order status error:', error)
    return errorResponse('Failed to update order status')
  }
}
