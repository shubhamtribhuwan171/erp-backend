import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'
import { generateNextCode } from '@/lib/utils'
import { CreatePurchaseOrderBody } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const { data, error, count } = await supabase
      .from('purchase_orders').select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error
    return successResponse({ orders: data || [], page, limit, total: count || 0 })
  } catch (error) { return errorResponse('Failed to fetch orders') }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    if (!user) return errorResponse(authError || 'Unauthorized', 401)

    const supabase = await createClient()
    const body: CreatePurchaseOrderBody = await request.json()

    const { data: company } = await supabase.from('companies').select('base_currency_code').eq('id', user.companyId).single()

    const { data: lastOrder } = await supabase
      .from('purchase_orders').select('po_no').eq('company_id', user.companyId)
      .order('po_no', { ascending: false }).limit(1).single()

    const poNo = generateNextCode('PO', lastOrder?.po_no || null)

    let subtotal = 0, taxTotal = 0, discountTotal = 0
    const orderItems = body.items.map((item, index) => {
      const lineTotal = (item.qty * item.unit_cost_minor) - (item.discount_minor || 0) + (item.tax_minor || 0)
      subtotal += item.qty * item.unit_cost_minor
      taxTotal += item.tax_minor || 0
      discountTotal += item.discount_minor || 0
      return {
        company_id: user.companyId,
        line_no: index + 1,
        item_id: item.item_id,
        description: item.description,
        warehouse_id: item.warehouse_id,
        qty: item.qty,
        unit_id: item.unit_id,
        unit_cost_minor: item.unit_cost_minor,
        discount_minor: item.discount_minor || 0,
        tax_minor: item.tax_minor || 0,
        line_total_minor: lineTotal,
        received_qty: 0,
      }
    })

    const totalMinor = subtotal + taxTotal - discountTotal

    const { data: order, error: orderError } = await supabase.from('purchase_orders').insert({
      company_id: user.companyId,
      po_no: poNo,
      vendor_id: body.vendor_id,
      order_date: body.order_date,
      expected_receipt_date: body.expected_receipt_date,
      notes: body.notes,
      currency_code: company?.base_currency_code || 'INR',
      subtotal_minor: subtotal,
      tax_minor: taxTotal,
      discount_minor: discountTotal,
      total_minor: totalMinor,
      created_by_user_id: user.id,
    }).select().single()

    if (orderError) throw orderError

    await supabase.from('purchase_order_items').insert(orderItems.map(item => ({ ...item, purchase_order_id: order.id })))

    return successResponse(order, 'Purchase order created')
  } catch (err) {
    console.error('Create purchase order error:', err)
    return errorResponse('Failed to create order')
  }
}
