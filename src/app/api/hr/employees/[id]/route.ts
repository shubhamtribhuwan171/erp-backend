import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { successResponse, errorResponse } from '@/lib/utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'hr', 'read')
    const { id } = await params
    const supabase = await createClient()
    const { data, error } = await supabase.from('employees').select('*').eq('id', id).single()
    if (error || !data) return errorResponse('Employee not found', 404)
    return successResponse(data)
  } catch (err: any) { return errorResponse('Failed') }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'hr', 'update')
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()
    const { data, error } = await supabase.from('employees').update(body).eq('id', id).select().single()
    if (error) throw error
    return successResponse(data, 'Employee updated')
  } catch (err: any) { return errorResponse('Failed') }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'hr', 'delete')
    const { id } = await params
    const supabase = await createClient()
    await supabase.from('employees').delete().eq('id', id)
    return successResponse(null, 'Employee deleted')
  } catch (err: any) { return errorResponse('Failed') }
}
