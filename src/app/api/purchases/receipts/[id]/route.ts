import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled, requireFeatureEnabled } from '@/lib/features'
import { successResponse, notFoundResponse, handleApiError } from '@/lib/utils'

// GET /api/purchases/receipts/[id] - Get receipt/GRN details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'purchases', 'read')
    await requireModuleEnabled(request, user.companyId, 'purchases')
    await requireFeatureEnabled(request, user.companyId, 'purchases.receipts')

    const { id } = await params
    const supabase = createRlsClient(request)

    // Receipts are purchase_orders with status 'received'
    const { data: receipt, error } = await supabase
      .from('purchase_orders')
      .select('*, vendor:vendors(code, name, email, phone)')
      .eq('company_id', user.companyId)
      .eq('id', id)
      .eq('status', 'received')
      .single()

    if (error || !receipt) {
      return notFoundResponse('Receipt')
    }

    // We don't yet have purchase_order_items wiring in all create flows.
    // Return empty lines so UI still renders coherently.
    return successResponse({
      ...receipt,
      lines: [],
      totals: {
        subtotal_minor: receipt.subtotal_minor ?? 0,
        discount_minor: receipt.discount_minor ?? 0,
        tax_minor: receipt.tax_minor ?? 0,
        total_minor: receipt.total_minor ?? 0,
      },
    })
  } catch (error) {
    console.error('Get receipt error:', error)
    return handleApiError(error, 'Failed to fetch receipt')
  }
}
