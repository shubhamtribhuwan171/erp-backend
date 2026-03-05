import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'accounting', 'read')
    await requireModuleEnabled(request, user.companyId, 'accounting')
    const { id } = await params
    const supabase = createRlsClient(request)

    const { data: entry, error } = await supabase
      .from('ledger_entries')
      .select('*, lines:ledger_lines(*)')
      .eq('company_id', user.companyId)
      .eq('id', id)
      .single()

    if (error || !entry) return errorResponse('Entry not found', 404)

    // Enrich lines with account details
    const lines = entry.lines || []
    const accountIds = [...new Set(lines.map((l: any) => l.account_id).filter(Boolean))]
    
    if (accountIds.length > 0) {
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id, name, code, type')
        .in('id', accountIds)
      
      const accountMap = new Map((accounts || []).map((a: any) => [a.id, a]))
      
      // Add account info to each line
      entry.lines = lines.map((line: any) => ({
        ...line,
        account: accountMap.get(line.account_id) || null,
      }))
    }

    // Calculate totals
    const totalDebit = lines.reduce((sum: number, l: any) => sum + (Number(l.debit) || 0), 0)
    const totalCredit = lines.reduce((sum: number, l: any) => sum + (Number(l.credit) || 0), 0)

    return successResponse({
      ...entry,
      totals: { totalDebit, totalCredit, isBalanced: totalDebit === totalCredit },
    })
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
    await requireModuleEnabled(request, user.companyId, 'accounting')
    const { id } = await params
    const supabase = createRlsClient(request)
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
