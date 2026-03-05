import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled, requireFeatureEnabled } from '@/lib/features'
import { successResponse, notFoundResponse, handleApiError } from '@/lib/utils'

// GET /api/sales/invoices/[id] - Get invoice with items
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'sales', 'read')
    await requireModuleEnabled(request, user.companyId, 'sales')
    await requireFeatureEnabled(request, user.companyId, 'sales.invoices')

    const { id } = await params
    const supabase = createRlsClient(request)

    const { data: invoice, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:customers(code, name, email, phone)
      `)
      .eq('id', id)
      .eq('company_id', user.companyId)
      .eq('status', 'invoiced')
      .single()

    if (error || !invoice) {
      return notFoundResponse('Invoice')
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
      .order('line_no', { ascending: true })

    return successResponse({
      ...invoice,
      items: items || [],
      totals: {
        subtotal_minor: invoice.subtotal_minor ?? 0,
        discount_minor: invoice.discount_minor ?? 0,
        tax_minor: invoice.tax_minor ?? 0,
        total_minor: invoice.total_minor ?? 0,
      },
    })
  } catch (error) {
    console.error('Get invoice error:', error)
    return handleApiError(error, 'Failed to fetch invoice')
  }
}
