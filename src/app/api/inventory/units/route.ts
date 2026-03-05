import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse, handleApiError } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'inventory', 'read')
    await requireModuleEnabled(request, user.companyId, 'inventory')

    const supabase = createRlsClient(request)
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .eq('company_id', user.companyId)
      .order('name')

    if (error) throw error
    return successResponse(data || [])
  } catch (error) {
    console.error('Failed to fetch units:', error)
    return handleApiError(error, 'Failed to fetch units')}
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'inventory', 'create')
    await requireModuleEnabled(request, user.companyId, 'inventory')

    const supabase = createRlsClient(request)
    const body = await request.json()

    const { data, error } = await supabase
      .from('units')
      .insert({
        company_id: user.companyId,
        code: body.code,
        name: body.name,
        created_by_user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return successResponse(data, 'Unit created')
  } catch (err: any) {
    console.error('Create unit error:', err)
    if (err.message?.includes('Permission denied')) {
      return errorResponse(err.message, 403)
    }
    return errorResponse('Failed to create unit')
  }
}
