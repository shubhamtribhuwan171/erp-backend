import { NextRequest } from 'next/server'
import { successResponse } from '@/lib/utils'

// POST /api/auth/logout
export async function POST() {
  // Client handles token removal
  return successResponse(null, 'Logged out')
}
