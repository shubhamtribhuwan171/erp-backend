import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'crm', 'read')
    await requireModuleEnabled(request, user.companyId, 'crm')

    const { id } = await params
    const supabase = createRlsClient(request)

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', user.companyId)
      .eq('id', id)
      .single()

    if (error || !data) return errorResponse('Lead not found', 404)

    // Get quotations sent to this lead
    const { data: quotations } = await supabase
      .from('sales_orders')
      .select('id, order_no, order_date, status, total_minor')
      .eq('customer_id', id)
      .eq('company_id', user.companyId)
      .eq('status', 'quotation')
      .order('created_at', { ascending: false })

    // Get orders (if converted)
    const { data: orders } = await supabase
      .from('sales_orders')
      .select('id, order_no, order_date, status, total_minor')
      .eq('customer_id', id)
      .eq('company_id', user.companyId)
      .neq('status', 'quotation')
      .order('created_at', { ascending: false })
      .limit(10)

    return successResponse({
      ...data,
      quotations: quotations || [],
      orders: orders || [],
    })
  } catch (err: any) {
    console.error('Get lead error:', err)
    return errorResponse('Failed')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'crm', 'update')
    await requireModuleEnabled(request, user.companyId, 'crm')

    const { id } = await params
    const supabase = createRlsClient(request)
    const body = await request.json()

    const { data, error } = await supabase
      .from('customers')
      .update(body)
      .eq('company_id', user.companyId)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) return errorResponse('Lead not found', 404)
    return successResponse(data, 'Lead updated')
  } catch (err: any) {
    console.error('Update lead error:', err)
    return errorResponse('Failed')
  }
}
