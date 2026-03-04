import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { successResponse, errorResponse } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'crm', 'read')
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', user.companyId)
      .eq('status', 'lead')
      .order('created_at', { ascending: false })
    if (error) throw error
    return successResponse({ leads: data || [] })
  } catch (err: any) { return errorResponse('Failed') }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'crm', 'create')
    const supabase = await createClient()
    const body = await request.json()

    const { data: last } = await supabase
      .from('customers').select('code').eq('company_id', user.companyId)
      .like('code', 'LEAD%').order('code', { ascending: false }).limit(1).single()

    const leadCode = `LEAD-${String((parseInt(last?.code?.replace('LEAD-', '') || '0')) + 1).padStart(4, '0')}`

    const { data, error } = await supabase.from('customers').insert({
      company_id: user.companyId,
      code: leadCode,
      name: body.name,
      email: body.email,
      phone: body.phone,
      status: 'lead',
      created_by_user_id: user.id,
    }).select().single()

    if (error) throw error
    return successResponse(data, 'Lead created')
  } catch (err: any) { return errorResponse('Failed') }
}
