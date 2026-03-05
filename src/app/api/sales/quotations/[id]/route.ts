import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled, requireFeatureEnabled } from '@/lib/features'
import { successResponse, notFoundResponse, handleApiError } from '@/lib/utils'

// GET /api/sales/quotations/[id] - Get quotation with items
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'sales', 'read')
    await requireModuleEnabled(request, user.companyId, 'sales')
    await requireFeatureEnabled(request, user.companyId, 'sales.quotations')

    const { id } = await params
    const supabase = createRlsClient(request)

    const { data: quotation, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:customers(code, name, email, phone)
      `)
      .eq('id', id)
      .eq('company_id', user.companyId)
      .eq('status', 'quotation')
      .single()

    if (error || !quotation) {
      return notFoundResponse('Quotation')
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
      ...quotation,
      items: items || [],
      totals: {
        subtotal_minor: quotation.subtotal_minor ?? 0,
        discount_minor: quotation.discount_minor ?? 0,
        tax_minor: quotation.tax_minor ?? 0,
        total_minor: quotation.total_minor ?? 0,
      },
    })
  } catch (error) {
    console.error('Get quotation error:', error)
    return handleApiError(error, 'Failed to fetch quotation')
  }
}
