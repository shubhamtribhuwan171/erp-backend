import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils'
import { generateNextCode } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { email, password, companyName, fullName } = await request.json()

    if (!email || !password || !companyName) {
      return errorResponse('Email, password, and company name required')
    }

    const supabase = await createClient()
    const adminClient = createAdminClient()

    // First create the company (we need its ID for the user)
    const { data: companyData, error: companyError } = await adminClient
      .from('companies')
      .insert({
        name: companyName,
        base_currency_code: 'INR',
        timezone: 'Asia/Kolkata',
      })
      .select()
      .single()

    if (companyError || !companyData) {
      return errorResponse('Failed to create company: ' + companyError?.message)
    }

    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      // Cleanup company on failure
      await adminClient.from('companies').delete().eq('id', companyData.id)
      return errorResponse('Failed to create user: ' + authError?.message)
    }

    // Create user profile
    const { error: userError, data: userData } = await adminClient.from('users').insert({
      id: authData.user.id,
      company_id: companyData.id,
      email,
      full_name: fullName || email.split('@')[0],
      role: 'owner',
      is_admin: true,
    })

    if (userError) {
      console.error('User profile error:', userError)
      await adminClient.auth.admin.deleteUser(authData.user.id)
      await adminClient.from('companies').delete().eq('id', companyData.id)
      return errorResponse('Failed to create user profile: ' + userError.message)
    }

    // Enable core modules for the company
    const { data: modules } = await adminClient.from('modules').select('id').eq('is_core', true)
    
    if (modules?.length) {
      await adminClient.from('company_modules').insert(
        modules.map(m => ({
          company_id: companyData.id,
          module_id: m.id,
          enabled: true,
          enabled_at: new Date().toISOString(),
        }))
      )
    }

    // Generate session
    const { data: sessionData } = await adminClient.auth.admin.generateLink({
      type: 'sign_in',
      email,
    })

    return successResponse({
      company: {
        id: companyData.id,
        name: companyData.name,
      },
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    }, 'Company created successfully')
  } catch (error) {
    console.error('Register error:', error)
    return errorResponse('Registration failed')
  }
}
