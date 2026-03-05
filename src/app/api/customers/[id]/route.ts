import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse, notFoundResponse, handleApiError } from '@/lib/utils'

// GET /api/customers/[id] - Get single customer
// PUT /api/customers/[id] - Update customer
// DELETE /api/customers/[id] - Delete customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'customers', 'read')
    await requireModuleEnabled(request, user.companyId, 'sales')

    const { id } = await params
    const supabase = createRlsClient(request)

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', user.companyId)
      .eq('id', id)
      .single()

    if (error || !data) {
      return notFoundResponse('Customer')
    }

    return successResponse(data)
  } catch (error) {
    console.error('Get customer error:', error)
    return handleApiError(error, 'Failed to fetch customer')}
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'customers', 'update')
    await requireModuleEnabled(request, user.companyId, 'sales')

    const { id } = await params
    const supabase = createRlsClient(request)
    const body = await request.json()

    const { data, error } = await supabase
      .from('customers')
      .update({
        name: body.name,
        email: body.email,
        phone: body.phone,
        billing_address: body.billing_address,
        shipping_address: body.shipping_address,
        tax_id: body.tax_id,
        payment_terms_days: body.payment_terms_days,
        credit_limit_minor: body.credit_limit_minor,
        status: body.status,
      })
      .eq('company_id', user.companyId)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return successResponse(data, 'Customer updated')
  } catch (error) {
    console.error('Update customer error:', error)
    return handleApiError(error, 'Failed to update customer')}
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'customers', 'delete')
    await requireModuleEnabled(request, user.companyId, 'sales')

    const { id } = await params
    const supabase = createRlsClient(request)

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('company_id', user.companyId)
      .eq('id', id)

    if (error) throw error

    return successResponse(null, 'Customer deleted')
  } catch (error) {
    console.error('Delete customer error:', error)
    return handleApiError(error, 'Failed to delete customer')}
}
