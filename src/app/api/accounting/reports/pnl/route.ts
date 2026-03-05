import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'accounting', 'read')
    await requireModuleEnabled(user.companyId, 'accounting')
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('from') || '2026-01-01'
    const toDate = searchParams.get('to') || '2026-12-31'

    const { data: entries } = await supabase
      .from('ledger_entries').select('id').eq('company_id', user.companyId)
      .eq('status', 'posted').gte('entry_date', fromDate).lte('entry_date', toDate)

    if (!entries?.length) return successResponse({ revenue: [], expenses: [], netProfit: 0 })

    const { data: lines } = await supabase
      .from('ledger_lines')
      .select('debit_minor, credit_minor, accounts:account_id(name, type)')
      .in('ledger_entry_id', entries.map(e => e.id))

    let revenue = 0, expenses = 0
    for (const line of (lines as any[]) || []) {
      const account = line.accounts as any
      if (account?.type === 'revenue') revenue += Number(line.credit_minor || 0) - Number(line.debit_minor || 0)
      else if (account?.type === 'expense') expenses += Number(line.debit_minor || 0) - Number(line.credit_minor || 0)
    }

    return successResponse({ totalRevenue: revenue, totalExpenses: expenses, netProfit: revenue - expenses, fromDate, toDate })
  } catch (err: any) {
    return errorResponse('Failed to generate P&L')
  }
}
