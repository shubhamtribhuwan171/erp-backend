import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'hr', 'read')
    await requireModuleEnabled(user.companyId, 'hr')
    const supabase = createApiClient()
    const { data, error } = await supabase.from('departments').select('*').eq('company_id', user.companyId).order('name')
    if (error) throw error
    return successResponse({ departments: data || [] })
  } catch (err: any) { return errorResponse('Failed') }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'hr', 'create')
    await requireModuleEnabled(user.companyId, 'hr')
    const supabase = createApiClient()
    const body = await request.json()
    const { data, error } = await supabase.from('departments').insert({
      company_id: user.companyId,
      code: body.code,
      name: body.name,
      parent_department_id: body.parent_department_id,
      created_by_user_id: user.id,
    }).select().single()
    if (error) throw error
    return successResponse(data, 'Department created')
  } catch (err: any) { return errorResponse('Failed') }
}
