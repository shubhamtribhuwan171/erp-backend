import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import { successResponse, handleApiError, generateNextCode } from '@/lib/utils'

// GET /api/vendors
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'vendors', 'read')
    await requireModuleEnabled(user.companyId, 'purchases')

    const supabase = createRlsClient(request)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    let query = supabase
      .from('vendors')
      .select('*', { count: 'exact' })
      .eq('company_id', user.companyId)
      .order('name')

    if (search) query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`)

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1)
    if (error) throw error
    return successResponse({ vendors: data || [], page, limit, total: count || 0 })
  } catch (error) {
    console.error('Failed to fetch vendors:', error)
    return handleApiError(error, 'Failed to fetch vendors')
  }
}

// POST /api/vendors
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'vendors', 'create')
    await requireModuleEnabled(user.companyId, 'purchases')

    const supabase = createRlsClient(request)
    const body: any = await request.json()

    const { data: lastVendor } = await supabase
      .from('vendors')
      .select('code')
      .eq('company_id', user.companyId)
      .order('code', { ascending: false })
      .limit(1)
      .single()

    const code = generateNextCode('VEND', lastVendor?.code || null)

    const { data, error } = await supabase
      .from('vendors')
      .insert({
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
      })
      .select()
      .single()

    if (error) throw error
    return successResponse(data, 'Vendor created')
  } catch (err) {
    console.error('Create vendor error:', err)
    return handleApiError(err, 'Failed to create vendor')
  }
}
