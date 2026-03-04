// ============================================
// API RESPONSE TYPES & HELPERS
// ============================================

import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT, MESSAGES } from './constants'

// Standard API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
  meta?: PaginationMeta
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function successResponse<T>(data?: T, message?: string): ApiResponse<T> {
  return { success: true, message, data }
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
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

export function errorResponse(
  message: string,
  status: number = 400,
  errors?: Record<string, string[]>,
): Response {
  return Response.json(
    {
      success: false,
      message,
      errors,
    } as ApiResponse,
    { status },
  )
}

export function notFoundResponse(entity: string = 'Record'): Response {
  return errorResponse(`${entity} not found`, 404)
}

export function unauthorizedResponse(message?: string): Response {
  return errorResponse(message || MESSAGES.UNAUTHORIZED, 401)
}

export function forbiddenResponse(message?: string): Response {
  return errorResponse(message || MESSAGES.FORBIDDEN, 403)
}

export function validationResponse(errors: Record<string, string[]>): Response {
  return errorResponse(MESSAGES.VALIDATION_FAILED, 400, errors)
}

export function serverErrorResponse(error?: unknown): Response {
  console.error('Server error:', error)
  return errorResponse(MESSAGES.SERVER_ERROR, 500)
}

// ============================================
// REQUEST PARSING HELPERS
// ============================================

export interface ParsedPagination {
  page: number
  limit: number
  offset: number
}

export function parsePagination(searchParams: URLSearchParams): ParsedPagination {
  const pageRaw = parseInt(searchParams.get('page') || String(DEFAULT_PAGE))
  const limitRaw = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT))

  const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : DEFAULT_PAGE)
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : DEFAULT_LIMIT))

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
  allowedValues: readonly T[],
): T | undefined {
  const value = searchParams.get(key)
  if (value && allowedValues.includes(value as T)) return value as T
  return undefined
}

export function parseDateRange(searchParams: URLSearchParams): { from?: string; to?: string } {
  return {
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
  }
}
