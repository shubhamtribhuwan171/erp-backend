import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled, requireFeatureEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'
import {generateNextCode} from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'sales', 'read')
    await requireModuleEnabled(request, user.companyId, 'sales')
    await requireFeatureEnabled(request, user.companyId, 'sales.invoices')
    const supabase = createRlsClient(request)
    
    // Invoices are sales_orders with status 'invoiced'
    const { data, error } = await supabase
      .from('sales_orders')
      .select('*, customer:customers(name)')
      .eq('company_id', user.companyId)
      .eq('status', 'invoiced')
      .order('created_at', { ascending: false })

    if (error) throw error
    return successResponse({ invoices: data || [] })
  } catch (err: any) {
    return errorResponse('Failed to fetch invoices')
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'sales', 'create')
    await requireModuleEnabled(request, user.companyId, 'sales')
    await requireFeatureEnabled(request, user.companyId, 'sales.invoices')
    const supabase = createRlsClient(request)
    const body = await request.json()

    // Generate invoice number
    const { data: last } = await supabase
      .from('sales_orders')
      .select('order_no')
      .eq('company_id', user.companyId)
      .like('order_no', 'INV%')
      .order('order_no', { ascending: false })
      .limit(1)
      .single()

    const invNo = generateNextCode('INV', last?.order_no || null)

    // Create invoice (as sales order with invoiced status)
    const { data, error } = await supabase.from('sales_orders').insert({
      company_id: user.companyId,
      order_no: invNo,
      customer_id: body.customer_id,
      order_date: body.invoice_date || new Date().toISOString().split('T')[0],
      status: 'invoiced',
      currency_code: 'INR',
      subtotal_minor: body.subtotal_minor || 0,
      discount_minor: body.discount_minor || 0,
      tax_minor: body.tax_minor || 0,
      total_minor: body.total_minor || 0,
      notes: body.notes,
      created_by_user_id: user.id,
    }).select().single()

    if (error) throw error

    if (body.items?.length) {
      const items = body.items.map((item: any, i: number) => ({
        ...item,
        sales_order_id: data.id,
        line_no: i + 1,
        company_id: user.companyId,
      }))
      await supabase.from('sales_order_items').insert(items)
    }

    return successResponse(data, 'Invoice created')
  } catch (err: any) {
    console.error('Create invoice error:', err)
    return errorResponse('Failed to create invoice')
  }
}
