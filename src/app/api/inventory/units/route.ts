import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser, requirePermission } from '@/lib/auth-rbac'
import { successResponse, errorResponse } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('units').select('*').order('name')
    if (error) throw error
    return successResponse(data || [])
  } catch (error) { return errorResponse('Failed to fetch units') }
}

export async function POST(request: NextRequest) {
  try {
    // RBAC: Require create permission on inventory
    const user = await requirePermission(request, 'inventory', 'create')
    
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase.from('units').insert({
      company_id: user.companyId,
      code: body.code,
      name: body.name,
      created_by_user_id: user.id,
    }).select().single()

    if (error) {
      console.error('Unit insert error:', error)
      throw error
    }
    return successResponse(data, 'Unit created')
  } catch (err: any) {
    console.error('Create unit error:', err)
    if (err.message?.includes('Permission denied')) {
      return errorResponse(err.message, 403)
    }
    return errorResponse('Failed to create unit')
  }
}
