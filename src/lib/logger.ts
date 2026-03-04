// Error logging utility
import { createClient } from '@supabase/supabase-js'

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Simple console logging with colors
const LOG_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '\x1b[36m',   // Cyan
  [LogLevel.INFO]: '\x1b[32m',    // Green
  [LogLevel.WARN]: '\x1b[33m',    // Yellow
  [LogLevel.ERROR]: '\x1b[31m',   // Red
}

const RESET = '\x1b[0m'

export function log(
  level: LogLevel,
  message: string,
  context?: Record<string, any>
) {
  const timestamp = new Date().toISOString()
  const color = LOG_COLORS[level] || ''
  
  const logMessage = context 
    ? `${message} ${JSON.stringify(context)}`
    : message
  
  // Console output with color
  console.log(
    `${color}[${timestamp}] [${level.toUpperCase()}]${RESET} ${logMessage}`
  )
  
  // In production, you would send to a logging service
  // For now, we'll store in database if available
  if (process.env.NODE_ENV === 'production') {
    // Could integrate with Sentry, Datadog, etc.
    storeLog(level, message, context).catch(() => {})
  }
}

async function storeLog(
  level: LogLevel,
  message: string,
  context?: Record<string, any>
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    await supabase.from('audit_logs').insert({
      entity_type: 'system_log',
      entity_id: crypto.randomUUID(),
      action: level,
      before: { message, context },
    })
  } catch {
    // Silent fail - don't crash app on logging error
  }
}

// Convenience methods
export const logger = {
  debug: (msg: string, ctx?: Record<string, any>) => log(LogLevel.DEBUG, msg, ctx),
  info: (msg: string, ctx?: Record<string, any>) => log(LogLevel.INFO, msg, ctx),
  warn: (msg: string, ctx?: Record<string, any>) => log(LogLevel.WARN, msg, ctx),
  error: (msg: string, ctx?: Record<string, any>) => log(LogLevel.ERROR, msg, ctx),
}

// API error handler
export function handleAPIError(error: any, endpoint: string): { message: string; code?: string } {
  logger.error(`API Error in ${endpoint}`, { 
    message: error.message, 
    code: error.code 
  })
  
  return {
    message: error.message || 'An unexpected error occurred',
    code: error.code,
  }
}

// Format error for response
export function formatError(error: any): { success: false; message: string } {
  const message = error?.message || 'An error occurred'
  logger.error('Request error', { message })
  
  return {
    success: false,
    message,
  }
}
