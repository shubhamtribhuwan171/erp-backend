import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse, handleApiError } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'inventory', 'read')
    await requireModuleEnabled(user.companyId, 'inventory')

    const supabase = createApiClient()
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('company_id', user.companyId)
      .order('name')

    if (error) throw error
    return successResponse(data || [])
  } catch (error) {
    console.error('Failed to fetch warehouses:', error)
    return handleApiError(error, 'Failed to fetch warehouses')}
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'inventory', 'create')
    await requireModuleEnabled(user.companyId, 'inventory')

    const supabase = createApiClient()
    const body = await request.json()

    if (body.is_default) {
      await supabase
        .from('warehouses')
        .update({ is_default: false })
        .eq('company_id', user.companyId)
    }

    const { data, error } = await supabase
      .from('warehouses')
      .insert({
        company_id: user.companyId,
        code: body.code,
        name: body.name,
        address: body.address,
        is_default: body.is_default ?? false,
        created_by_user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return successResponse(data, 'Warehouse created')
  } catch (err) {
    console.error('Failed to create warehouse:', err)
    return handleApiError(err, 'Failed to create warehouse')}
}
