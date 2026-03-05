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

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('company_id', user.companyId)
      .eq('id', id)
      .single()

    if (error || !data) return errorResponse('Account not found', 404)
    return successResponse(data)
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
    await requireModuleEnabled(user.companyId, 'accounting')
    const { id } = await params
    const supabase = createApiClient()
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
    await requireModuleEnabled(user.companyId, 'accounting')
    const { id } = await params
    const supabase = createApiClient()

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
