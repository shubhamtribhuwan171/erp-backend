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

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('company_id', user.companyId)
      .eq('id', id)
      .single()

    if (error || !data) return errorResponse('Account not found', 404)

    // Get ledger entries for this account
    const { data: ledgerLines } = await supabase
      .from('ledger_lines')
      .select(`
        *,
        entry:ledger_entries(id, entry_number, date, description, reference, posted_at)
      `)
      .eq('company_id', user.companyId)
      .eq('account_id', id)
      .order('created_at', { ascending: false })
      .limit(50)

    // Calculate balance
    const totalDebit = ledgerLines?.reduce((sum: number, line: any) => sum + (Number(line.debit) || 0), 0) || 0
    const totalCredit = ledgerLines?.reduce((sum: number, line: any) => sum + (Number(line.credit) || 0), 0) || 0
    const balance = data.type === 'asset' ? totalDebit - totalCredit : totalCredit - totalDebit

    return successResponse({
      ...data,
      ledgerLines: ledgerLines || [],
      stats: {
        totalDebit,
        totalCredit,
        balance,
        entryCount: ledgerLines?.length || 0,
      },
    })
  } catch (err: any) {
    return errorResponse('Failed to fetch account')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'accounting', 'update')
    await requireModuleEnabled(request, user.companyId, 'accounting')
    const { id } = await params
    const supabase = createRlsClient(request)
    const body = await request.json()

    const { data, error } = await supabase
      .from('accounts')
      .update({ name: body.name, type: body.type, subtype: body.subtype })
      .eq('company_id', user.companyId)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return successResponse(data, 'Account updated')
  } catch (err: any) {
    return errorResponse('Failed to update account')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'accounting', 'delete')
    await requireModuleEnabled(request, user.companyId, 'accounting')
    const { id } = await params
    const supabase = createRlsClient(request)

    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('company_id', user.companyId)
      .eq('id', id)
    if (error) throw error

    return successResponse(null, 'Account deleted')
  } catch (err: any) {
    return errorResponse('Failed to delete account')
  }
}
