import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'crm', 'read')
    await requireModuleEnabled(user.companyId, 'crm')
    const supabase = createApiClient()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', user.companyId)
      .eq('status', 'active')
      .order('name')
    if (error) throw error
    return successResponse({ contacts: data || [] })
  } catch (err: any) { return errorResponse('Failed') }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'crm', 'create')
    await requireModuleEnabled(user.companyId, 'crm')
    const supabase = createApiClient()
    const body = await request.json()

    const { data: last } = await supabase
      .from('customers').select('code').eq('company_id', user.companyId)
      .not('code', 'like', 'LEAD%').order('code', { ascending: false }).limit(1).single()

    const code = `CUST-${String((parseInt(last?.code?.replace('CUST-', '') || '0')) + 1).padStart(4, '0')}`

    const { data, error } = await supabase.from('customers').insert({
      company_id: user.companyId,
      code,
      name: body.name,
      email: body.email,
      phone: body.phone,
      status: 'active',
      created_by_user_id: user.id,
    }).select().single()

    if (error) throw error
    return successResponse(data, 'Contact created')
  } catch (err: any) { return errorResponse('Failed') }
}
