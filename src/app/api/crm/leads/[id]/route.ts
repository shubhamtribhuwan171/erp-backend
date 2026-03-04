import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { successResponse, errorResponse } from '@/lib/utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'crm', 'read')
    const { id } = await params
    const supabase = await createClient()
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single()
    if (error || !data) return errorResponse('Lead not found', 404)
    return successResponse(data)
  } catch (err: any) { return errorResponse('Failed') }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'crm', 'update')
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()
    const { data, error } = await supabase.from('customers').update(body).eq('id', id).select().single()
    if (error) throw error
    return successResponse(data, 'Lead updated')
  } catch (err: any) { return errorResponse('Failed') }
}
