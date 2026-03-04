import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { successResponse, errorResponse } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'accounting', 'read')
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
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
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('accounts')
      .update({ name: body.name, type: body.type, subtype: body.subtype })
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
    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase.from('accounts').delete().eq('id', id)
    if (error) throw error

    return successResponse(null, 'Account deleted')
  } catch (err: any) {
    return errorResponse('Failed to delete account')
  }
}
