import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'hr', 'read')
    await requireModuleEnabled(user.companyId, 'hr')
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('employees').select('id, name, department_id, departments!inner(name)')
      .eq('company_id', user.companyId).eq('status', 'active')
    if (error) throw error
    return successResponse({ employees: data || [] })
  } catch (err: any) { return errorResponse('Failed') }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'hr', 'create')
    await requireModuleEnabled(user.companyId, 'hr')
    const supabase = await createClient()
    const body = await request.json()
    // Attendance marking - would need attendance table
    return successResponse(null, 'Attendance recorded')
  } catch (err: any) { return errorResponse('Failed') }
}
