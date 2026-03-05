import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse, handleApiError } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'inventory', 'read')
    await requireModuleEnabled(user.companyId, 'inventory')

    const supabase = createRlsClient(request)
    const { data, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .eq('company_id', user.companyId)
      .order('name')

    if (error) throw error
    return successResponse(data || [])
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return handleApiError(error, 'Failed to fetch categories')}
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'inventory', 'create')
    await requireModuleEnabled(user.companyId, 'inventory')

    const supabase = createRlsClient(request)
    const body = await request.json()

    const code = body.code || String(body.name || '').substring(0, 3).toUpperCase()

    const { data, error } = await supabase
      .from('inventory_categories')
      .insert({
        company_id: user.companyId,
        code,
        name: body.name,
        parent_category_id: body.parent_category_id,
        created_by_user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return successResponse(data, 'Category created')
  } catch (err) {
    console.error('Failed to create category:', err)
    return handleApiError(err, 'Failed to create category')}
}
