import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {successResponse, errorResponse, handleApiError } from '@/lib/utils'
import { signAuthToken } from '@/lib/jwt'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, companyName, fullName } = await request.json()

    if (!email || !password || !companyName) {
      return errorResponse('Email, password, and company name required')
    }

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

    const passwordHash = await bcrypt.hash(password, 10)

    // Create user profile
    const { error: userError, data: userData } = await adminClient.from('users').insert({
      company_id: companyData.id,
      email: String(email).toLowerCase(),
      full_name: fullName || String(email).split('@')[0],
      password_hash: passwordHash,
      auth_provider: 'password',
      role: 'owner',
      is_admin: true,
      is_active: true,
      status: 'active',
    }).select('id, email, company_id, role, is_admin').single()

    if (userError || !userData) {
      console.error('User profile error:', userError)
      await adminClient.from('companies').delete().eq('id', companyData.id)
      return errorResponse('Failed to create user profile: ' + (userError?.message || 'Unknown error'))
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

    const accessToken = signAuthToken({
      sub: userData.id,
      email: userData.email,
      companyId: userData.company_id,
      role: userData.role,
      isAdmin: !!userData.is_admin,
    })
    return successResponse({
      company: {
        id: companyData.id,
        name: companyData.name,
      },
      user: {
        id: userData.id,
        email: userData.email,
      },
      session: {
        access_token: accessToken,
        token_type: 'bearer',
        expires_in: 60 * 60 * 24 * 7,
      },
    }, 'Company created successfully')
  } catch (error) {
    console.error('Register error:', error)
    return handleApiError(error, 'Registration failed')}
}
