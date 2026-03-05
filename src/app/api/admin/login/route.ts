// ============================================
// ADMIN LOGIN
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { signAdminToken } from '@/lib/admin-jwt'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password required' },
        { status: 400 }
      )
    }
    
    // Find admin by email
    const { data: admin, error } = await supabaseAdmin
      .from('platform_admins')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()
    
    if (error || !admin) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, admin.password_hash)
    if (!validPassword) {
      // Log failed attempt
      await supabaseAdmin.from('user_login_history').insert({
        user_id: admin.id,
        user_type: 'platform_admin',
        success: false,
        failure_reason: 'Invalid password',
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      })
      
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    if (!admin.is_active) {
      return NextResponse.json(
        { success: false, message: 'Account disabled' },
        { status: 403 }
      )
    }
    
    // Update last login
    await supabaseAdmin
      .from('platform_admins')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', admin.id)
    
    // Log successful login
    await supabaseAdmin.from('user_login_history').insert({
      user_id: admin.id,
      user_type: 'platform_admin',
      success: true,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    })
    
    // Return admin info (not password hash)
    const { password_hash, ...adminWithoutPassword } = admin
    
    const token = signAdminToken({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      isSuperAdmin: Boolean(admin.is_super_admin),
    })

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        ...adminWithoutPassword,
        token,
      },
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}
