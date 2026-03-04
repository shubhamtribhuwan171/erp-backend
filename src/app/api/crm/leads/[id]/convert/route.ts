import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { successResponse, errorResponse } from '@/lib/utils'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'crm', 'update')
    const { id } = await params
    const supabase = await createClient()

    // Get lead
    const { data: lead } = await supabase.from('customers').select('*').eq('id', id).single()
    if (!lead) return errorResponse('Lead not found', 404)

    // Generate new customer code
    const { data: last } = await supabase
      .from('customers').select('code').eq('company_id', user.companyId)
      .not('code', 'like', 'LEAD%').order('code', { ascending: false }).limit(1).single()

    const custCode = `CUST-${String((parseInt(last?.code?.replace('CUST-', '') || '0')) + 1).padStart(4, '0')}`

    // Update to customer
    const { data, error } = await supabase.from('customers').update({
      code: custCode,
      status: 'active',
    }).eq('id', id).select().single()

    if (error) throw error
    return successResponse(data, 'Lead converted to customer')
  } catch (err: any) { return errorResponse('Failed to convert lead') }
}
