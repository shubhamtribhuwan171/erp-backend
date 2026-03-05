import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse, notFoundResponse, handleApiError } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'vendors', 'read')
    await requireModuleEnabled(request, user.companyId, 'purchases')

    const { id } = await params
    const supabase = createRlsClient(request)

    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('company_id', user.companyId)
      .eq('id', id)
      .single()

    if (error || !data) {
      return notFoundResponse('Vendor')
    }

    // Get purchase orders for this vendor
    const { data: purchaseOrders } = await supabase
      .from('purchase_orders')
      .select('id, po_no, order_date, status, total_minor, subtotal_minor')
      .eq('vendor_id', id)
      .eq('company_id', user.companyId)
      .order('created_at', { ascending: false })

    // Get vendor invoices
    const { data: vendorInvoices } = await supabase
      .from('purchase_orders')
      .select('id, po_no, order_date, status, total_minor')
      .eq('vendor_id', id)
      .eq('company_id', user.companyId)
      .eq('status', 'invoiced')
      .order('created_at', { ascending: false })

    // Calculate stats
    const totalSpend = (vendorInvoices || []).reduce((sum: number, o: any) => sum + (o.total_minor || 0), 0)
    const pendingOrders = (purchaseOrders || []).filter((o: any) => ['draft', 'sent', 'confirmed'].includes(o.status))
    const pendingValue = pendingOrders.reduce((sum: number, o: any) => sum + (o.total_minor || 0), 0)

    return successResponse({
      ...data,
      purchaseOrders: purchaseOrders || [],
      vendorInvoices: vendorInvoices || [],
      stats: {
        totalSpend,
        orderCount: purchaseOrders?.length || 0,
        invoiceCount: vendorInvoices?.length || 0,
        pendingOrdersCount: pendingOrders.length,
        pendingOrdersValue: pendingValue,
      },
    })
  } catch (error) {
    console.error('Get vendor error:', error)
    return handleApiError(error, 'Failed to fetch vendor')}
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'vendors', 'update')
    await requireModuleEnabled(request, user.companyId, 'purchases')

    const { id } = await params
    const supabase = createRlsClient(request)
    const body = await request.json()

    const { data, error } = await supabase
      .from('vendors')
      .update({
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        tax_id: body.tax_id,
        payment_terms_days: body.payment_terms_days,
        default_lead_time_days: body.default_lead_time_days,
        bank_details: body.bank_details,
        status: body.status,
      })
      .eq('company_id', user.companyId)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return successResponse(data, 'Vendor updated')
  } catch (error) {
    console.error('Update vendor error:', error)
    return handleApiError(error, 'Failed to update vendor')}
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'vendors', 'delete')
    await requireModuleEnabled(request, user.companyId, 'purchases')

    const { id } = await params
    const supabase = createRlsClient(request)

    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('company_id', user.companyId)
      .eq('id', id)

    if (error) throw error

    return successResponse(null, 'Vendor deleted')
  } catch (error) {
    console.error('Delete vendor error:', error)
    return handleApiError(error, 'Failed to delete vendor')}
}
