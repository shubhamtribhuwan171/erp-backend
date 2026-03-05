import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled, requireFeatureEnabled } from '@/lib/features'
import { successResponse, errorResponse } from '@/lib/utils'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'purchases', 'read')
    await requireModuleEnabled(request, user.companyId, 'purchases')
    await requireFeatureEnabled(request, user.companyId, 'purchases.vendorInvoices')

    const { id } = await context.params
    const supabase = createRlsClient(request)

    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, vendor:vendors(name)')
      .eq('company_id', user.companyId)
      .eq('id', id)
      .eq('status', 'invoiced')
      .single()

    if (error) throw error
    return successResponse(data)
  } catch (err: any) {
    console.error('Vendor invoice get error:', err)
    return errorResponse('Failed to fetch vendor invoice')
  }
}
