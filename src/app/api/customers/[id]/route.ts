import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import { successResponse, notFoundResponse, handleApiError } from '@/lib/utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'sales', 'read')
    await requireModuleEnabled(request, user.companyId, 'sales')

    const { id } = await params
    const supabase = createRlsClient(request)

    // Get customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('company_id', user.companyId)
      .single()

    if (customerError || !customer) {
      return notFoundResponse('Customer')
    }

    // Get orders from this customer
    const { data: orders } = await supabase
      .from('sales_orders')
      .select('id, order_no, order_date, status, total_minor')
      .eq('customer_id', id)
      .eq('company_id', user.companyId)
      .order('created_at', { ascending: false })
      .limit(20)

    return successResponse({
      ...customer,
      orders: orders || [],
    })
  } catch (error) {
    console.error('Get customer error:', error)
    return handleApiError(error, 'Failed to fetch customer')
  }
}
