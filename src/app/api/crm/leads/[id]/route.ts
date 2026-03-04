import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import { successResponse, errorResponse } from '@/lib/utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'crm', 'read')
    await requireModuleEnabled(user.companyId, 'crm')

    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', user.companyId)
      .eq('id', id)
      .single()

    if (error || !data) return errorResponse('Lead not found', 404)
    return successResponse(data)
  } catch (err: any) {
    console.error('Get lead error:', err)
    return errorResponse('Failed')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'crm', 'update')
    await requireModuleEnabled(user.companyId, 'crm')

    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('customers')
      .update(body)
      .eq('company_id', user.companyId)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) return errorResponse('Lead not found', 404)
    return successResponse(data, 'Lead updated')
  } catch (err: any) {
    console.error('Update lead error:', err)
    return errorResponse('Failed')
  }
}
