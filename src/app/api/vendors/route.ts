import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'
import { generateNextCode } from '@/lib/utils'
import { CreateVendorBody } from '@/lib/types'

// GET /api/vendors
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    let query = supabase.from('vendors').select('*', { count: 'exact' }).order('name')
    if (search) query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`)

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1)
    if (error) throw error
    return successResponse({ vendors: data || [], page, limit, total: count || 0 })
  } catch (error) {
    return errorResponse('Failed to fetch vendors')
  }
}

// POST /api/vendors
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    if (!user) return errorResponse(authError || 'Unauthorized', 401)

    const supabase = await createClient()
    const body: CreateVendorBody = await request.json()

    const { data: lastVendor } = await supabase
      .from('vendors').select('code').eq('company_id', user.companyId)
      .order('code', { ascending: false }).limit(1).single()

    const code = generateNextCode('VEND', lastVendor?.code || null)

    const { data, error } = await supabase.from('vendors').insert({
      company_id: user.companyId,
      code,
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      tax_id: body.tax_id,
      payment_terms_days: body.payment_terms_days,
      default_lead_time_days: body.default_lead_time_days,
      bank_details: body.bank_details,
      created_by_user_id: user.id,
    }).select().single()

    if (error) throw error
    return successResponse(data, 'Vendor created')
  } catch (err) {
    console.error('Create vendor error:', err)
    return errorResponse('Failed to create vendor')
  }
}
