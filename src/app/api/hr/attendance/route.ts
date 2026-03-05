import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled, requireFeatureEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'hr', 'read')
    await requireModuleEnabled(request, user.companyId, 'hr')
    await requireFeatureEnabled(request, user.companyId, 'hr.attendance')
    const supabase = createRlsClient(request)

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // yyyy-mm-dd

    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, department_id, departments:departments!employees_department_id_fkey(name)')
      .eq('company_id', user.companyId)
      .eq('status', 'active')

    if (empError) throw empError

    if (!date) {
      return successResponse({ employees: employees || [] })
    }

    const { data: records, error: recError } = await supabase
      .from('attendance_records')
      .select('employee_id, status')
      .eq('company_id', user.companyId)
      .eq('attendance_date', date)

    if (recError) throw recError

    return successResponse({ employees: employees || [], records: records || [], date })
  } catch (err: any) {
    console.error('Attendance GET error:', err)
    return errorResponse('Failed to load attendance', 400)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'hr', 'create')
    await requireModuleEnabled(request, user.companyId, 'hr')
    await requireFeatureEnabled(request, user.companyId, 'hr.attendance')
    const supabase = createRlsClient(request)

    const body = await request.json()
    const date = body?.date as string | undefined
    const records = (body?.records ?? []) as Array<{ employee_id: string; status: 'present' | 'absent' | 'leave' }>

    if (!date) return errorResponse('date is required', 400)
    if (!Array.isArray(records)) return errorResponse('records must be an array', 400)

    // upsert attendance per employee/day
    const payload = records.map((r) => ({
      company_id: user.companyId,
      employee_id: r.employee_id,
      attendance_date: date,
      status: r.status,
      created_by_user_id: user.id,
    }))

    const { error } = await supabase
      .from('attendance_records')
      .upsert(payload, { onConflict: 'company_id,employee_id,attendance_date' })

    if (error) throw error

    return successResponse({ date, count: payload.length }, 'Attendance recorded')
  } catch (err: any) {
    console.error('Attendance POST error:', err)
    return errorResponse('Failed to record attendance', 400)
  }
}
