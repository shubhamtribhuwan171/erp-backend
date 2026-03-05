import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireFeatureEnabled } from '@/lib/features'
import {successResponse, errorResponse} from '@/lib/utils'

// GET /api/settings/industry-profiles - List available industry profiles
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'settings', 'read')
    await requireFeatureEnabled(request, user.companyId, 'settings.industryProfiles')
    const supabase = createRlsClient(request)

    const { data, error } = await supabase
      .from('industry_profiles')
      .select('code,name,default_features,default_settings,updated_at')
      .order('code', { ascending: true })

    if (error) throw error

    return successResponse({ profiles: data || [] })
  } catch (err: any) {
    console.error('List industry profiles error:', err)
    if (err.message?.includes('Permission denied')) {
      return errorResponse(err.message, 403)
    }
    return errorResponse('Failed to list industry profiles')
  }
}
