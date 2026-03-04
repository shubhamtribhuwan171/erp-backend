import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return notFoundResponse('Vendor')
    }

    return successResponse(data)
  } catch (error) {
    console.error('Get vendor error:', error)
    return errorResponse('Failed to fetch vendor')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
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
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return successResponse(data, 'Vendor updated')
  } catch (error) {
    console.error('Update vendor error:', error)
    return errorResponse('Failed to update vendor')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id)

    if (error) throw error

    return successResponse(null, 'Vendor deleted')
  } catch (error) {
    console.error('Delete vendor error:', error)
    return errorResponse('Failed to delete vendor')
  }
}
