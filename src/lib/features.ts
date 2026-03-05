import { createRlsClient } from '@/lib/supabase/server'
import { httpErrors } from '@/lib/http-error'

export type FeatureModule =
  | 'inventory'
  | 'sales'
  | 'purchases'
  | 'accounting'
  | 'crm'
  | 'hr'
  | 'manufacturing'
  | 'logistics'

export type EffectiveFeatures = {
  modules?: Record<string, boolean>
  [k: string]: any
}

function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function deepMerge(base: any, override: any): any {
  if (!isObject(base) || !isObject(override)) return override ?? base
  const out: Record<string, any> = { ...base }
  for (const [k, v] of Object.entries(override)) {
    if (isObject(v) && isObject(out[k])) out[k] = deepMerge(out[k], v)
    else out[k] = v
  }
  return out
}

/**
 * Compute effective features for a company.
 *
 * precedence: industry_profiles.default_features < companies.features (override)
 */
export async function getEffectiveCompanyFeatures(request: Request, companyId: string): Promise<EffectiveFeatures> {
  const supabase = createRlsClient(request)

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, industry_type, features')
    .eq('id', companyId)
    .single()

  if (companyError) throw companyError

  const { data: profile } = await supabase
    .from('industry_profiles')
    .select('code, default_features')
    .eq('code', company.industry_type)
    .single()

  const base = (profile?.default_features ?? {}) as EffectiveFeatures
  const override = (company.features ?? {}) as EffectiveFeatures

  return deepMerge(base, override)
}

export async function isModuleEnabled(request: Request, companyId: string, module: FeatureModule): Promise<boolean> {
  const features = await getEffectiveCompanyFeatures(request, companyId)
  const enabled = (features?.modules as any)?.[module]
  // Default allow if not declared.
  return enabled === undefined ? true : Boolean(enabled)
}

function getByPath(obj: any, path: string): any {
  if (!obj) return undefined
  const parts = path.split('.').filter(Boolean)
  let cur = obj
  for (const p of parts) {
    cur = cur?.[p]
    if (cur === undefined) return undefined
  }
  return cur
}

// Feature flag check. Default allow if not declared (keeps older profiles working).
export async function isFeatureEnabled(request: Request, companyId: string, path: string): Promise<boolean> {
  const features = await getEffectiveCompanyFeatures(request, companyId)
  const v = getByPath(features, path)
  return v === undefined ? true : Boolean(v)
}

export async function requireFeatureEnabled(request: Request, companyId: string, path: string): Promise<void> {
  const ok = await isFeatureEnabled(request, companyId, path)
  if (!ok) {
    throw httpErrors.forbidden(`Feature disabled: ${path}`)
  }
}

export async function requireModuleEnabled(request: Request, companyId: string, module: FeatureModule): Promise<void> {
  const ok = await isModuleEnabled(request, companyId, module)
  if (!ok) {
    // 403 so the frontend can present a proper "module disabled" state.
    throw httpErrors.forbidden(`Module disabled: ${module}`)
  }
}
