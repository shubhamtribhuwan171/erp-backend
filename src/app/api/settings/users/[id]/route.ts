import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { successResponse, errorResponse } from '@/lib/utils'

// GET /api/settings/users/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'users', 'read')
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, role, is_admin, is_active, created_at')
      .eq('id', id)
      .eq('company_id', user.companyId)
      .single()

    if (error || !data) {
      return errorResponse('User not found', 404)
    }

    return successResponse(data)
  } catch (err: any) {
    console.error('Get user error:', err)
    if (err.message?.includes('Permission denied')) {
      return errorResponse(err.message, 403)
    }
    return errorResponse('Failed to get user')
  }
}

// PUT /api/settings/users/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'users', 'update')
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Can't edit yourself or owner
    if (id === user.id) {
      return errorResponse('Cannot edit your own profile this way')
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        full_name: body.full_name,
        phone: body.phone,
        role: body.role,
        is_admin: body.role === 'owner' || body.role === 'admin',
        is_active: body.is_active,
      })
      .eq('id', id)
      .eq('company_id', user.companyId)
      .select()
      .single()

    if (error) throw error

    return successResponse(data, 'User updated')
  } catch (err: any) {
    console.error('Update user error:', err)
    if (err.message?.includes('Permission denied')) {
      return errorResponse(err.message, 403)
    }
    return errorResponse('Failed to update user')
  }
}

// DELETE /api/settings/users/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(request, 'users', 'delete')
    const { id } = await params

    if (id === user.id) {
      return errorResponse('Cannot delete your own account')
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .eq('company_id', user.companyId)

    if (error) throw error

    return successResponse(null, 'User deleted')
  } catch (err: any) {
    console.error('Delete user error:', err)
    if (err.message?.includes('Permission denied')) {
      return errorResponse(err.message, 403)
    }
    return errorResponse('Failed to delete user')
  }
}
