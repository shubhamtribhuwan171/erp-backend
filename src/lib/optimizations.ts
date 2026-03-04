// Optimized API helpers

// Default pagination
export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 100

export type Pagination = { page: number; limit: number; offset: number }

// Parse pagination params safely
export function getPagination(searchParams: URLSearchParams): Pagination {
  const pageRaw = parseInt(searchParams.get('page') || String(DEFAULT_PAGE))
  const limitRaw = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT))

  const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : DEFAULT_PAGE)
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : DEFAULT_LIMIT))

  return { page, limit, offset: (page - 1) * limit }
}

// Build range for Supabase
export function getRange(pagination: { page: number; limit: number }): [number, number] {
  const start = (pagination.page - 1) * pagination.limit
  const end = start + pagination.limit - 1
  return [start, end]
}

// Cache key helper
export function cacheKey(...parts: string[]) {
  return parts.join(':')
}

// Cache duration (in ms)
export const CACHE_DURATIONS = {
  SHORT: 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
}

// Simple in-memory cache (for server-side)
const cache = new Map<string, { data: unknown; expires: number }>()

export function getCached<T = unknown>(key: string): T | null {
  const entry = cache.get(key)
  if (entry && entry.expires > Date.now()) {
    return entry.data as T
  }
  cache.delete(key)
  return null
}

export function setCache(key: string, data: unknown, duration: number = CACHE_DURATIONS.MEDIUM) {
  cache.set(key, { data, expires: Date.now() + duration })
}

export function invalidateCache(pattern?: string) {
  if (!pattern) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}
