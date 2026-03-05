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
      .from('employees')
      .select('*')
      .eq('company_id', user.companyId)
      .order('name')

    if (error) throw error
    return successResponse({ employees: data || [] })
  } catch (err: any) {
    console.error('Employees error:', err)
    return errorResponse('Failed to fetch employees')
  }
}
