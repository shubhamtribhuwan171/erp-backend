import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import { successResponse, handleApiError, generateNextCode } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'purchases', 'read')
    await requireModuleEnabled(user.companyId, 'purchases')

    const supabase = createRlsClient(request)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''

    let query = supabase
      .from('purchase_orders')
      .select(`*, vendor:vendors(name, code)`, { count: 'exact' })
      .eq('company_id', user.companyId)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1)

    if (error) throw error
    return successResponse({ orders: data || [], page, limit, total: count || 0 })
  } catch (error) {
    console.error('Failed to fetch purchase orders:', error)
    return handleApiError(error, 'Failed to fetch orders')
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'purchases', 'create')
    await requireModuleEnabled(user.companyId, 'purchases')

    const supabase = createRlsClient(request)
    const body: any = await request.json()

    const { data: company } = await supabase
      .from('companies')
      .select('base_currency_code')
      .eq('id', user.companyId)
      .single()

    const { data: lastOrder } = await supabase
      .from('purchase_orders')
      .select('po_no')
      .eq('company_id', user.companyId)
      .order('po_no', { ascending: false })
      .limit(1)
      .single()

    const poNo = generateNextCode('PO', lastOrder?.po_no || null)

    let subtotal = 0,
      taxTotal = 0,
      discountTotal = 0

    const orderItems = (body.items || []).map((item: any, index: number) => {
      const qty = Number(item.qty || 0)
      const unitCost = Number(item.unit_cost_minor || 0)
      const discount = Number(item.discount_minor || 0)
      const tax = Number(item.tax_minor || 0)

      const lineTotal = qty * unitCost - discount + tax

      subtotal += qty * unitCost
      taxTotal += tax
      discountTotal += discount

      return {
        company_id: user.companyId,
        line_no: index + 1,
        item_id: item.item_id,
        description: item.description,
        warehouse_id: item.warehouse_id,
        qty,
        unit_id: item.unit_id,
        unit_cost_minor: unitCost,
        discount_minor: discount,
        tax_minor: tax,
        line_total_minor: lineTotal,
        received_qty: 0,
      }
    })

    const totalMinor = subtotal + taxTotal - discountTotal

    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .insert({
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
      })
      .select()
      .single()

    if (orderError) throw orderError

    if (orderItems.length) {
      await supabase.from('purchase_order_items').insert(orderItems.map((i: any) => ({ ...i, purchase_order_id: order.id })))
    }

    return successResponse(order, 'Purchase order created')
  } catch (err) {
    console.error('Create purchase order error:', err)
    return handleApiError(err, 'Failed to create order')
  }
}
