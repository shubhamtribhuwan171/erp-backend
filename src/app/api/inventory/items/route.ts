import { NextRequest } from 'next/server'
import { createRlsClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-rbac'
import { requireModuleEnabled } from '@/lib/features'
import { successResponse, handleApiError, generateNextCode } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'inventory', 'read')
    await requireModuleEnabled(request, user.companyId, 'inventory')

    const supabase = createRlsClient(request)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    let query = supabase
      .from('inventory_items')
      .select('*', { count: 'exact' })
      .eq('company_id', user.companyId)
      .order('name')

    if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1)
    if (error) throw error
    return successResponse({ items: data || [], page, limit, total: count || 0 })
  } catch (error) {
    console.error('Failed to fetch items:', error)
    return handleApiError(error, 'Failed to fetch items')
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'inventory', 'create')
    await requireModuleEnabled(request, user.companyId, 'inventory')

    const supabase = createRlsClient(request)
    const body: any = await request.json()

    const { data: lastItem } = await supabase
      .from('inventory_items')
      .select('sku')
      .eq('company_id', user.companyId)
      .order('sku', { ascending: false })
      .limit(1)
      .single()

    const sku = generateNextCode('SKU', lastItem?.sku || null)

    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        company_id: user.companyId,
        sku,
        name: body.name,
        description: body.description,
        category_id: body.category_id,
        unit_id: body.unit_id,
        track_inventory: body.track_inventory ?? true,
        is_serialized: body.is_serialized ?? false,
        is_batch_tracked: body.is_batch_tracked ?? false,
        reorder_level: body.reorder_level,
        reorder_qty: body.reorder_qty,
        standard_cost_minor: body.standard_cost_minor,
        sale_price_minor: body.sale_price_minor,
        created_by_user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return successResponse(data, 'Item created')
  } catch (err) {
    console.error('Failed to create item:', err)
    return handleApiError(err, 'Failed to create item')
  }
}
