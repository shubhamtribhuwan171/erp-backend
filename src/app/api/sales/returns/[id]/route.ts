import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled, requireFeatureEnabled } from '@/lib/features'
import { successResponse, notFoundResponse, handleApiError } from '@/lib/utils'

// GET /api/sales/returns/[id] - Get sales return details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'sales', 'read')
    await requireModuleEnabled(request, user.companyId, 'sales')
    await requireFeatureEnabled(request, user.companyId, 'sales.returns')

    const { id } = await params
    const supabase = createRlsClient(request)

    const { data: ret, error } = await supabase
      .from('sales_orders')
      .select('*, customer:customers(code, name, email, phone)')
      .eq('company_id', user.companyId)
      .eq('id', id)
      .eq('status', 'return')
      .single()

    if (error || !ret) {
      return notFoundResponse('Return')
    }

    const { data: items } = await supabase
      .from('sales_order_items')
      .select('*, item:inventory_items(name, sku), unit:units(name, code)')
      .eq('company_id', user.companyId)
      .eq('sales_order_id', id)
      .order('line_no', { ascending: true })

    return successResponse({
      ...ret,
      items: items || [],
      totals: {
        subtotal_minor: ret.subtotal_minor ?? 0,
        discount_minor: ret.discount_minor ?? 0,
        tax_minor: ret.tax_minor ?? 0,
        total_minor: ret.total_minor ?? 0,
      },
    })
  } catch (error) {
    console.error('Get return error:', error)
    return handleApiError(error, 'Failed to fetch return')
  }
}
