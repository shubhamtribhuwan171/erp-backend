import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'accounting', 'read')
    await requireModuleEnabled(user.companyId, 'accounting')
    const supabase = createRlsClient(request)
    const { searchParams } = new URL(request.url)
    const asDate = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const { data: accounts } = await supabase
      .from('accounts').select('code, name, type').eq('company_id', user.companyId).eq('is_active', true)

    const { data: entries } = await supabase
      .from('ledger_entries').select('id').eq('company_id', user.companyId)
      .eq('status', 'posted').lte('entry_date', asDate)

    if (!entries?.length) return successResponse({ assets: [], liabilities: [], equity: [] })

    const { data: lines } = await supabase
      .from('ledger_lines')
      .select('account_id, debit_minor, credit_minor, accounts:account_id(name, type)')
      .in('ledger_entry_id', entries.map(e => e.id))

    const assets: any[] = [], liabilities: any[] = [], equity: any[] = []
    for (const line of (lines as any[]) || []) {
      const bal = Number(line.debit_minor || 0) - Number(line.credit_minor || 0)
      const account = line.accounts as any
      if (account?.type === 'asset' && bal > 0) assets.push({ name: account?.name, amount: bal })
      else if (account?.type === 'liability') liabilities.push({ name: account?.name, amount: Math.abs(bal) })
      else if (account?.type === 'equity') equity.push({ name: account?.name, amount: Math.abs(bal) })
    }

    return successResponse({
      assets, liabilities, equity,
      totalAssets: assets.reduce((s, a) => s + a.amount, 0),
      totalLiabilities: liabilities.reduce((s, a) => s + a.amount, 0),
      totalEquity: equity.reduce((s, a) => s + a.amount, 0),
      asDate
    })
  } catch (err: any) {
    return errorResponse('Failed to generate balance sheet')
  }
}
