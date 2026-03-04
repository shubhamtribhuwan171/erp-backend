import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { successResponse, errorResponse } from '@/lib/utils'

// GET /api/settings/company - Get company settings
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'settings', 'read')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', user.companyId)
      .single()

    if (error) throw error

    return successResponse(data)
  } catch (err: any) {
    console.error('Get company error:', err)
    if (err.message?.includes('Permission denied')) {
      return errorResponse(err.message, 403)
    }
    return errorResponse('Failed to get company')
  }
}

// PUT /api/settings/company - Update company settings
export async function PUT(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'settings', 'update')
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('companies')
      .update({
        name: body.name,
        legal_name: body.legal_name,
        gstin: body.gstin,
        base_currency_code: body.base_currency_code,
        timezone: body.timezone,
        settings: body.settings,
        // Experience / profile selection
        industry_type: body.industry_type,
        profile_version: body.profile_version,
        features: body.features,
      })
      .eq('id', user.companyId)
      .select()
      .single()

    if (error) throw error

    return successResponse(data, 'Company updated')
  } catch (err: any) {
    console.error('Update company error:', err)
    if (err.message?.includes('Permission denied')) {
      return errorResponse(err.message, 403)
    }
    return errorResponse('Failed to update company')
  }
}
