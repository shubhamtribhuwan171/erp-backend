import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('warehouses').select('*').order('name')
    if (error) throw error
    return successResponse(data || [])
  } catch (error) { return errorResponse('Failed to fetch warehouses') }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    if (!user) return errorResponse(authError || 'Unauthorized', 401)

    const supabase = await createClient()
    const body = await request.json()

    if (body.is_default) {
      await supabase.from('warehouses').update({ is_default: false }).eq('company_id', user.companyId)
    }

    const { data, error } = await supabase.from('warehouses').insert({
      company_id: user.companyId,
      code: body.code,
      name: body.name,
      address: body.address,
      is_default: body.is_default ?? false,
      created_by_user_id: user.id,
    }).select().single()

    if (error) throw error
    return successResponse(data, 'Warehouse created')
  } catch (err) { return errorResponse('Failed to create warehouse') }
}
