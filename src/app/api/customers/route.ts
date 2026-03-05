import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import { successResponse, errorResponse, handleApiError, generateNextCode } from '@/lib/utils'

// GET /api/customers - List all customers
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'customers', 'read')
    await requireModuleEnabled(request, user.companyId, 'sales')

    const supabase = createRlsClient(request)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('company_id', user.companyId)
      .order('name')

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`)
    }

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1)

    if (error) throw error

    return successResponse({
      customers: data || [],
      page,
      limit,
      total: count || 0,
    })
  } catch (error) {
    console.error('Get customers error:', error)
    return handleApiError(error, 'Failed to fetch customers')
  }
}

// POST /api/customers - Create customer
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'customers', 'create')
    await requireModuleEnabled(request, user.companyId, 'sales')

    const supabase = createRlsClient(request)
    const body: any = await request.json()

    const { data: lastCustomer } = await supabase
      .from('customers')
      .select('code')
      .eq('company_id', user.companyId)
      .order('code', { ascending: false })
      .limit(1)
      .single()

    const code = generateNextCode('CUST', lastCustomer?.code || null)

    const { data, error } = await supabase
      .from('customers')
      .insert({
        company_id: user.companyId,
        code,
        name: body.name,
        email: body.email,
        phone: body.phone,
        billing_address: body.billing_address,
        shipping_address: body.shipping_address,
        tax_id: body.tax_id,
        payment_terms_days: body.payment_terms_days,
        credit_limit_minor: body.credit_limit_minor,
        created_by_user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return successResponse(data, 'Customer created')
  } catch (error) {
    console.error('Create customer error:', error)
    return handleApiError(error, 'Failed to create customer')
  }
}
