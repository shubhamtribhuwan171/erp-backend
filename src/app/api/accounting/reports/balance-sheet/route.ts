import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { successResponse, errorResponse } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'accounting', 'read')
    const supabase = await createClient()
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

    const assets = [], liabilities = [], equity = []
    for (const line of lines || []) {
      const bal = Number(line.debit_minor || 0) - Number(line.credit_minor || 0)
      if (line.accounts.type === 'asset' && bal > 0) assets.push({ name: line.accounts.name, amount: bal })
      else if (line.accounts.type === 'liability') liabilities.push({ name: line.accounts.name, amount: Math.abs(bal) })
      else if (line.accounts.type === 'equity') equity.push({ name: line.accounts.name, amount: Math.abs(bal) })
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
