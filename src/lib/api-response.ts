// ============================================
// API RESPONSE TYPES & HELPERS
// ============================================

import { MESSAGES } from '../constants'

// Standard API response wrapper
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
  meta?: PaginationMeta
}

// Pagination metadata
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Success response factory
export function successResponse<T>(
  data?: T,
  message?: string
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  }
}

// Paginated success response
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// Error response factory
export function errorResponse(
  message: string,
  status: number = 400,
  errors?: Record<string, string[]>
): Response {
  return Response.json(
    {
      success: false,
      message,
      errors,
    } as ApiResponse,
    { status }
  )
}

// Not found response
export function notFoundResponse(entity: string = 'Record'): Response {
  return errorResponse(`${entity} not found`, 404)
}

// Unauthorized response
export function unauthorizedResponse(message?: string): Response {
  return errorResponse(message || MESSAGES.UNAUTHORIZED, 401)
}

// Forbidden response
export function forbiddenResponse(message?: string): Response {
  return errorResponse(message || MESSAGES.FORBIDDEN, 403)
}

// Validation error response
export function validationResponse(errors: Record<string, string[]>): Response {
  return errorResponse(MESSAGES.VALIDATION_FAILED, 400, errors)
}

// Server error response
export function serverErrorResponse(error?: string): Response {
  console.error('Server error:', error)
  return errorResponse(MESSAGES.SERVER_ERROR, 500)
}

// ============================================
// REQUEST PARSING HELPERS
// ============================================

import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '../constants'

export interface ParsedPagination {
  page: number
  limit: number
  offset: number
}

export function parsePagination(searchParams: URLSearchParams): ParsedPagination {
  const page = Math.max(1, parseInt(searchParams.get('page') || String(DEFAULT_PAGE)) || DEFAULT_PAGE
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT)) || DEFAULT_LIMIT
  )
  
  return {
    page,
    limit,
    offset: (page - 1) * limit,
  }
}

export function parseSearch(searchParams: URLSearchParams): string | undefined {
  return searchParams.get('search') || undefined
}

export function parseFilter<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  allowedValues: readonly T[]
): T | undefined {
  const value = searchParams.get(key)
  if (value && allowedValues.includes(value as T)) {
    return value as T
  }
  return undefined
}

export function parseDateRange(searchParams: URLSearchParams): { from?: string; to?: string } {
  return {
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
  }
}
