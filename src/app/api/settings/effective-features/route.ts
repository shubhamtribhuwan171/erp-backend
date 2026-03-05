import { NextRequest } from 'next/server'
import { requirePermission } from '@/lib/auth-rbac'
import { getEffectiveCompanyFeatures } from '@/lib/features'
import { successResponse, errorResponse } from '@/lib/utils'

// GET /api/settings/effective-features
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'settings', 'read')
    // settings isn't part of FeatureModule. Always allow for authenticated users.
    const features = await getEffectiveCompanyFeatures(request, user.companyId)
    return successResponse({ features })
  } catch (err: any) {
    console.error('Get effective features error:', err)
    return errorResponse('Failed to load effective features', 400)
  }
}
