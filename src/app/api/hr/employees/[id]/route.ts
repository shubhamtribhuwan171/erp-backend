import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'hr', 'read')
    await requireModuleEnabled(request, user.companyId, 'hr')

    const { id } = await params
    const supabase = createRlsClient(request)

    const { data, error } = await supabase
      .from('employees')
      .select('*, department:departments(name, code)')
      .eq('company_id', user.companyId)
      .eq('id', id)
      .single()

    if (error || !data) return errorResponse('Employee not found', 404)

    // Get recent attendance records
    const { data: attendance } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('company_id', user.companyId)
      .eq('employee_id', id)
      .order('attendance_date', { ascending: false })
      .limit(30)

    // Calculate attendance stats
    const present = attendance?.filter((a: any) => a.status === 'present').length || 0
    const absent = attendance?.filter((a: any) => a.status === 'absent').length || 0
    const late = attendance?.filter((a: any) => a.status === 'late').length || 0
    const leave = attendance?.filter((a: any) => a.status === 'leave').length || 0
    const total = attendance?.length || 0

    return successResponse({
      ...data,
      attendance: attendance || [],
      attendanceStats: {
        total,
        present,
        absent,
        late,
        leave,
        presentPercent: total > 0 ? Math.round((present / total) * 100) : 0,
      },
    })
  } catch (err: any) {
    console.error('Get employee error:', err)
    return errorResponse('Failed to fetch employee')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(request, 'hr', 'update')
    await requireModuleEnabled(request, user.companyId, 'hr')

    const { id } = await params
    const supabase = createRlsClient(request)
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
    await requireModuleEnabled(request, user.companyId, 'hr')

    const { id } = await params
    const supabase = createRlsClient(request)

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
