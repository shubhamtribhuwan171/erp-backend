import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'hr', 'read')
    await requireModuleEnabled(user.companyId, 'hr')

    const { id } = await params
    const supabase = createApiClient()

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', user.companyId)
      .eq('id', id)
      .single()

    if (error || !data) return errorResponse('Employee not found', 404)
    return successResponse(data)
  } catch (err: any) {
    console.error('Get employee error:', err)
    return errorResponse('Failed to fetch employee')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'hr', 'update')
    await requireModuleEnabled(user.companyId, 'hr')

    const { id } = await params
    const supabase = createApiClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('employees')
      .update(body)
      .eq('company_id', user.companyId)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) return errorResponse('Employee not found', 404)
    return successResponse(data, 'Employee updated')
  } catch (err: any) {
    console.error('Update employee error:', err)
    return errorResponse('Failed to update employee')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'hr', 'delete')
    await requireModuleEnabled(user.companyId, 'hr')

    const { id } = await params
    const supabase = createApiClient()

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('company_id', user.companyId)
      .eq('id', id)

    if (error) throw error

    return successResponse(null, 'Employee deleted')
  } catch (err: any) {
    console.error('Delete employee error:', err)
    return errorResponse('Failed to delete employee')
  }
}
