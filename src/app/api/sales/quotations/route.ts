import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { successResponse, errorResponse } from '@/lib/utils'
import { generateNextCode } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'sales', 'read')
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('sales_orders')
      .select('*, customer:customers(name)')
      .eq('company_id', user.companyId)
      .eq('status', 'quotation')
      .order('created_at', { ascending: false })

    if (error) throw error
    return successResponse({ quotations: data || [] })
  } catch (err: any) {
    return errorResponse('Failed to fetch quotations')
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'sales', 'create')
    const supabase = await createClient()
    const body = await request.json()

    const { data: last } = await supabase
      .from('sales_orders')
      .select('order_no')
      .eq('company_id', user.companyId)
      .like('order_no', 'QUO%')
      .order('order_no', { ascending: false })
      .limit(1)
      .single()

    const quoNo = generateNextCode('QUO', last?.order_no || null)

    // Create as quotation (status = 'quotation')
    const { data, error } = await supabase.from('sales_orders').insert({
      company_id: user.companyId,
      order_no: quoNo,
      customer_id: body.customer_id,
      order_date: body.order_date,
      status: 'quotation',
      currency_code: 'INR',
      subtotal_minor: body.subtotal_minor || 0,
      discount_minor: body.discount_minor || 0,
      tax_minor: body.tax_minor || 0,
      total_minor: body.total_minor || 0,
      notes: body.notes,
      created_by_user_id: user.id,
    }).select().single()

    if (error) throw error

    // Add items if provided
    if (body.items?.length) {
      const items = body.items.map((item: any, i: number) => ({
        ...item,
        sales_order_id: data.id,
        line_no: i + 1,
        company_id: user.companyId,
      }))
      await supabase.from('sales_order_items').insert(items)
    }

    return successResponse(data, 'Quotation created')
  } catch (err: any) {
    console.error('Create quotation error:', err)
    return errorResponse('Failed to create quotation')
  }
}
