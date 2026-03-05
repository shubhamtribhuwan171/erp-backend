import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled, requireFeatureEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'accounting', 'read')
    await requireModuleEnabled(user.companyId, 'accounting')
    await requireFeatureEnabled(user.companyId, 'accounting.journal')

    const supabase = createRlsClient(request)

    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('company_id', user.companyId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return successResponse({ entries: data || [] })
  } catch (err: any) {
    console.error('Journal error:', err)
    return errorResponse('Failed to fetch journal entries')
  }
}
