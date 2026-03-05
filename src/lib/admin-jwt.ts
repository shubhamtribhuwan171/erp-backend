import crypto from 'crypto'

export interface AdminTokenPayload {
  sub: string
  email: string
  role: string
  isSuperAdmin: boolean
  iat: number
  exp: number
  type: 'platform_admin'
}

const DEFAULT_EXPIRY_SECONDS = 60 * 60 * 24 * 7 // 7 days
const JWT_SECRET = process.env.JWT_SECRET || 'dev-local-jwt-secret-change-me'

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(input: string): string {
  const padded = input
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(input.length / 4) * 4, '=')
  return Buffer.from(padded, 'base64').toString('utf8')
}

function signSegment(headerB64: string, payloadB64: string): string {
  const data = `${headerB64}.${payloadB64}`
  return crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

export function signAdminToken(
  admin: Omit<AdminTokenPayload, 'iat' | 'exp' | 'type'>,
  expiresInSeconds = DEFAULT_EXPIRY_SECONDS,
): string {
  const now = Math.floor(Date.now() / 1000)
  const payload: AdminTokenPayload = {
    ...admin,
    type: 'platform_admin',
    iat: now,
    exp: now + expiresInSeconds,
  }

  const headerB64 = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payloadB64 = base64UrlEncode(JSON.stringify(payload))
  const signature = signSegment(headerB64, payloadB64)

  return `${headerB64}.${payloadB64}.${signature}`
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    const [headerB64, payloadB64, signature] = token.split('.')
    if (!headerB64 || !payloadB64 || !signature) return null

    const expectedSignature = signSegment(headerB64, payloadB64)
    if (signature !== expectedSignature) return null

    const payload = JSON.parse(base64UrlDecode(payloadB64)) as AdminTokenPayload
    const now = Math.floor(Date.now() / 1000)
    if (!payload.exp || payload.exp < now) return null
    if (payload.type !== 'platform_admin') return null

    return payload
  } catch {
    return null
  }
}
