import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'accounting', 'read')
    await requireModuleEnabled(user.companyId, 'accounting')
    const { id } = await params
    const supabase = createApiClient()

    const { data: entry, error } = await supabase
      .from('ledger_entries')
      .select('*, lines:ledger_lines(*)')
      .eq('company_id', user.companyId)
      .eq('id', id)
      .single()

    if (error || !entry) return errorResponse('Entry not found', 404)
    return successResponse(entry)
  } catch (err: any) {
    return errorResponse('Failed to fetch entry')
  }
}

// PATCH to post/void
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'accounting', 'update')
    await requireModuleEnabled(user.companyId, 'accounting')
    const { id } = await params
    const supabase = createApiClient()
    const body = await request.json()

    const { action } = body // 'post' or 'void'

    if (action === 'post') {
      const { data, error } = await supabase
        .from('ledger_entries')
        .update({
          status: 'posted',
          posted_at: new Date().toISOString(),
          posted_by_user_id: user.id,
        })
        .eq('company_id', user.companyId)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return successResponse(data, 'Entry posted')
    } else if (action === 'void') {
      const { data, error } = await supabase
        .from('ledger_entries')
        .update({
          status: 'void',
        })
        .eq('company_id', user.companyId)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return successResponse(data, 'Entry voided')
    }

    return errorResponse('Invalid action')
  } catch (err: any) {
    return errorResponse('Failed to update entry')
  }
}
