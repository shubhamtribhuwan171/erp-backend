// ============================================
// UTILITY FUNCTIONS
// ============================================

import crypto from 'crypto'

// Generate UUID
export function generateId(): string {
  return crypto.randomUUID()
}

// Validate UUID format
export function isValidUUID(uuid: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return regex.test(uuid)
}

// Format money from minor units (paise) to display
export function minorToDisplay(minor: number | null | undefined, currency = 'INR'): string {
  if (minor === null || minor === undefined) return '-'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(minor / 100)
}

// Format display to minor units (paise)
export function displayToMinor(display: string | number): number {
  const num = typeof display === 'string' ? parseFloat(display) : display
  if (isNaN(num)) return 0
  return Math.round(num * 100)
}

// Format date for display
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

// Generate next code (e.g., "CUST-001" -> "CUST-002")
export function generateNextCode(prefix: string, lastCode: string | null): string {
  if (!lastCode) return `${prefix}-0001`
  
  const lastNum = parseInt(lastCode.replace(prefix, '').replace('-', ''))
  if (isNaN(lastNum)) return `${prefix}-0001`
  
  const nextNum = lastNum + 1
  return `${prefix}-${nextNum.toString().padStart(4, '0')}`
}

// Parse comma-separated IDs to array
export function parseIds(ids: string | string[] | undefined): string[] {
  if (!ids) return []
  if (Array.isArray(ids)) return ids
  return ids.split(',').map(id => id.trim()).filter(Boolean)
}

// Slugify string for URLs
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// Group array by key
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key])
    return {
      ...groups,
      [groupKey]: [...(groups[groupKey] || []), item],
    }
  }, {} as Record<string, T[]>)
}

// Sort array by key
export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

// Calculate percentage
export function percentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100 * 100) / 100
}

// Clamp number between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// ============================================
// API RESPONSE HELPERS
// ============================================

import { NextResponse } from 'next/server'

export function successResponse(data?: any, message?: string) {
  return NextResponse.json({
    success: true,
    message,
    data,
  })
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ success: false, message }, { status })
}

export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json({ success: false, message }, { status: 401 })
}

export function forbiddenResponse(message: string = 'Forbidden') {
  return NextResponse.json({ success: false, message }, { status: 403 })
}

export function notFoundResponse(message: string = 'Not found') {
  return NextResponse.json({ success: false, message }, { status: 404 })
}
