import { createClient } from '@/lib/supabase/server'

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
export async function getEffectiveCompanyFeatures(companyId: string): Promise<EffectiveFeatures> {
  const supabase = await createClient()

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

export async function isModuleEnabled(companyId: string, module: FeatureModule): Promise<boolean> {
  const features = await getEffectiveCompanyFeatures(companyId)
  const enabled = (features?.modules as any)?.[module]
  // Default allow if not declared.
  return enabled === undefined ? true : Boolean(enabled)
}

export async function requireModuleEnabled(companyId: string, module: FeatureModule): Promise<void> {
  const ok = await isModuleEnabled(companyId, module)
  if (!ok) {
    throw new Error(`Module disabled: ${module}`)
  }
}
