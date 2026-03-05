import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled, requireFeatureEnabled } from '@/lib/features'
import { successResponse, errorResponse } from '@/lib/utils'
import { generateNextCode } from '@/lib/utils'

// Alias route for UI: Vendor Invoices
// Same data model as /api/purchases/invoices (purchase_orders with status 'invoiced')

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'purchases', 'read')
    await requireModuleEnabled(request, user.companyId, 'purchases')
    await requireFeatureEnabled(request, user.companyId, 'purchases.vendorInvoices')

    const supabase = createRlsClient(request)

    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, vendor:vendors(name)')
      .eq('company_id', user.companyId)
      .eq('status', 'invoiced')
      .order('created_at', { ascending: false })

    if (error) throw error
    return successResponse({ invoices: data || [] })
  } catch (err: any) {
    console.error('Vendor invoices list error:', err)
    return errorResponse('Failed to fetch vendor invoices')
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'purchases', 'create')
    await requireModuleEnabled(request, user.companyId, 'purchases')
    await requireFeatureEnabled(request, user.companyId, 'purchases.vendorInvoices')

    const supabase = createRlsClient(request)
    const body = await request.json()

    const { data: last } = await supabase
      .from('purchase_orders')
      .select('po_no')
      .eq('company_id', user.companyId)
      .like('po_no', 'BILL%')
      .order('po_no', { ascending: false })
      .limit(1)
      .single()

    const billNo = generateNextCode('BILL', last?.po_no || null)

    const { data, error } = await supabase
      .from('purchase_orders')
      .insert({
        company_id: user.companyId,
        po_no: billNo,
        vendor_id: body.vendor_id,
        order_date: body.invoice_date || new Date().toISOString().split('T')[0],
        status: 'invoiced',
        currency_code: 'INR',
        subtotal_minor: body.subtotal_minor || 0,
        tax_minor: body.tax_minor || 0,
        total_minor: body.total_minor || 0,
        notes: body.notes,
        created_by_user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return successResponse(data, 'Vendor invoice created')
  } catch (err: any) {
    console.error('Vendor invoice create error:', err)
    return errorResponse('Failed to create vendor invoice')
  }
}
