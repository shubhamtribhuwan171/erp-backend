import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth-rbac'
import {successResponse, errorResponse} from '@/lib/utils'

// GET /api/auth/me - Get current user
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthUser(request)
    
    if (!user) {
      return errorResponse(error || 'Unauthorized', 401)
    }

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        isAdmin: user.isAdmin,
      }
    })
  } catch (err: any) {
    console.error('Get me error:', err)
    return errorResponse('Failed to get user info')
  }
}
