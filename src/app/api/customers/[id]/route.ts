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

    // Get all orders (including quotations and invoices which are also sales_orders)
    const { data: allOrders } = await supabase
      .from('sales_orders')
      .select('id, order_no, order_date, status, total_minor, subtotal_minor, created_at')
      .eq('customer_id', id)
      .eq('company_id', user.companyId)
      .order('created_at', { ascending: false })

    const orders = (allOrders || []).filter((o: any) => !['quotation', 'invoiced'].includes(o.status))
    const quotations = (allOrders || []).filter((o: any) => o.status === 'quotation')
    const invoices = (allOrders || []).filter((o: any) => o.status === 'invoiced')

    // Calculate summary stats
    const totalRevenue = invoices.reduce((sum: number, o: any) => sum + (o.total_minor || 0), 0)
    const totalOrders = orders.reduce((sum: number, o: any) => sum + (o.total_minor || 0), 0)
    const pendingOrders = orders.filter((o: any) => ['confirmed', 'shipped'].includes(o.status))
    const pendingOrdersValue = pendingOrders.reduce((sum: number, o: any) => sum + (o.total_minor || 0), 0)

    return successResponse({
      ...customer,
      orders: orders.slice(0, 10),
      quotations: quotations.slice(0, 5),
      invoices: invoices.slice(0, 10),
      stats: {
        totalRevenue,
        totalOrdersValue: totalOrders,
        orderCount: orders.length,
        quotationCount: quotations.length,
        invoiceCount: invoices.length,
        pendingOrdersCount: pendingOrders.length,
        pendingOrdersValue,
      },
    })
  } catch (error) {
    console.error('Get customer error:', error)
    return handleApiError(error, 'Failed to fetch customer')
  }
}
