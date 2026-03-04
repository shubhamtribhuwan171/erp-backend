// ============================================
// DATABASE SERVICE LAYER
// ============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { UUID } from '../types'

// Initialize client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)

// Admin client (bypasses RLS)
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, adminKey)

// ============================================
// BASE CRUD OPERATIONS
// ============================================

export class BaseService<T extends { id: UUID }> {
  constructor(
    protected table: string,
    protected supabaseClient: SupabaseClient = supabase
  ) {}

  async findById(id: UUID): Promise<T | null> {
    const { data, error } = await this.supabaseClient
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  async findMany(options?: {
    where?: Record<string, any>
    orderBy?: string
    ascending?: boolean
    limit?: number
    offset?: number
  }): Promise<T[]> {
    let query = this.supabaseClient.from(this.table).select('*')
    
    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }
    
    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? true })
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  }

  async create(data: Partial<T>): Promise<T> {
    const { data: result, error } = await this.supabaseClient
      .from(this.table)
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return result
  }

  async update(id: UUID, data: Partial<T>): Promise<T> {
    const { data: result, error } = await this.supabaseClient
      .from(this.table)
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return result
  }

  async delete(id: UUID): Promise<void> {
    const { error } = await this.supabaseClient
      .from(this.table)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  async count(where?: Record<string, any>): Promise<number> {
    let query = this.supabaseClient.from(this.table).select('*', { count: 'exact', head: true })
    
    if (where) {
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }
    
    const { count, error } = await query
    
    if (error) throw error
    return count || 0
  }
}

// ============================================
// COMPANY-SPECIFIC OPERATIONS
// ============================================

export class CompanyService<T extends { company_id: UUID }> extends BaseService<T> {
  constructor(table: string, protected companyId: UUID) {
    super(table)
  }

  async findAllForCompany(options?: {
    where?: Record<string, any>
    orderBy?: string
    limit?: number
    offset?: number
  }): Promise<T[]> {
    return this.findMany({
      where: { ...options?.where, company_id: this.companyId },
      orderBy: options?.orderBy,
      limit: options?.limit,
      offset: options?.offset,
    })
  }

  async countForCompany(where?: Record<string, any>): Promise<number> {
    return this.count({ ...where, company_id: this.companyId })
  }
}

// ============================================
// EXAMPLE: Customer Service
// ============================================

import { Customer } from '../types'

export class CustomerService extends CompanyService<Customer> {
  constructor(companyId: UUID) {
    super('customers', companyId)
  }

  async findByCode(code: string): Promise<Customer | null> {
    const { data, error } = await this.supabaseClient
      .from(this.table)
      .select('*')
      .eq('company_id', this.companyId)
      .eq('code', code)
      .single()
    
    if (error) return null
    return data
  }

  async search(searchTerm: string): Promise<Customer[]> {
    const { data, error } = await this.supabaseClient
      .from(this.table)
      .select('*')
      .eq('company_id', this.companyId)
      .or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
      .limit(20)
    
    if (error) throw error
    return data || []
  }
}
