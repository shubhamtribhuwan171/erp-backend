import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import { successResponse, errorResponse } from '@/lib/utils'
import { generateNextCode } from '@/lib/utils'
import { CreateSalesOrderBody } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'sales', 'read')
    await requireModuleEnabled(user.companyId, 'sales')

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''

    let query = supabase
      .from('sales_orders')
      .select(`*, customer:customers(name, code)`, { count: 'exact' })
      .eq('company_id', user.companyId)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    if (search) {
      // Order number / customer name / customer code
      query = query.or(`order_no.ilike.%${search}%`)
    }

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1)

    if (error) throw error
    return successResponse({ orders: data || [], page, limit, total: count || 0 })
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return errorResponse('Failed to fetch orders')
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'sales', 'create')
    await requireModuleEnabled(user.companyId, 'sales')

    const supabase = await createClient()
    const body: CreateSalesOrderBody = await request.json()

    const { data: company } = await supabase.from('companies').select('base_currency_code').eq('id', user.companyId).single()

    const { data: lastOrder } = await supabase
      .from('sales_orders').select('order_no').eq('company_id', user.companyId)
      .order('order_no', { ascending: false }).limit(1).single()

    const orderNo = generateNextCode('SO', lastOrder?.order_no || null)

    let subtotal = 0, taxTotal = 0, discountTotal = 0
    const orderItems = body.items.map((item, index) => {
      const lineTotal = (item.qty * item.unit_price_minor) - (item.discount_minor || 0) + (item.tax_minor || 0)
      subtotal += item.qty * item.unit_price_minor
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
        unit_price_minor: item.unit_price_minor,
        discount_minor: item.discount_minor || 0,
        tax_minor: item.tax_minor || 0,
        line_total_minor: lineTotal,
        fulfilled_qty: 0,
      }
    })

    const totalMinor = subtotal + taxTotal - discountTotal

    const { data: order, error: orderError } = await supabase.from('sales_orders').insert({
      company_id: user.companyId,
      order_no: orderNo,
      customer_id: body.customer_id,
      order_date: body.order_date,
      expected_ship_date: body.expected_ship_date,
      billing_address: body.billing_address,
      shipping_address: body.shipping_address,
      notes: body.notes,
      currency_code: company?.base_currency_code || 'INR',
      subtotal_minor: subtotal,
      tax_minor: taxTotal,
      discount_minor: discountTotal,
      total_minor: totalMinor,
      created_by_user_id: user.id,
    }).select().single()

    if (orderError) throw orderError

    await supabase.from('sales_order_items').insert(orderItems.map(item => ({ ...item, sales_order_id: order.id })))

    return successResponse(order, 'Order created')
  } catch (err) {
    console.error('Create order error:', err)
    return errorResponse('Failed to create order')
  }
}
