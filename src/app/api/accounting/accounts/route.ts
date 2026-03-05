import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled, requireFeatureEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'accounting', 'read')
    await requireModuleEnabled(request, user.companyId, 'accounting')
    await requireFeatureEnabled(request, user.companyId, 'accounting.accounts')
    const supabase = createRlsClient(request)
    
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('company_id', user.companyId)
      .order('code')

    if (error) throw error
    return successResponse({ accounts: data || [] })
  } catch (err: any) {
    return errorResponse('Failed to fetch accounts')
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'accounting', 'create')
    await requireModuleEnabled(request, user.companyId, 'accounting')
    await requireFeatureEnabled(request, user.companyId, 'accounting.accounts')
    const supabase = createRlsClient(request)
    const body = await request.json()

    const { data, error } = await supabase.from('accounts').insert({
      company_id: user.companyId,
      code: body.code,
      name: body.name,
      type: body.type,
      subtype: body.subtype,
      parent_account_id: body.parent_account_id,
      is_system: false,
      created_by_user_id: user.id,
    }).select().single()

    if (error) throw error
    return successResponse(data, 'Account created')
  } catch (err: any) {
    return errorResponse('Failed to create account')
  }
}
