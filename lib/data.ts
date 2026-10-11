import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type {
  Category,
  PriceHistory,
  Subscription,
  SubscriptionStatus,
} from '@/lib/supabase/types'

export type SubscriptionWithCategory = Subscription & {
  category: Pick<Category, 'id' | 'name' | 'color' | 'icon'> | null
}

export interface SubscriptionFilters {
  q?: string
  status?: string
  categoryId?: string
  sort?: 'name' | 'amount' | 'next_payment_date' | 'created_at'
  dir?: 'asc' | 'desc'
  archived?: boolean
}

const SELECT_WITH_CATEGORY = '*, category:categories(id, name, color, icon)'

export async function getSubscriptions(
  filters: SubscriptionFilters = {},
): Promise<SubscriptionWithCategory[]> {
  const supabase = await createClient()
  let query = supabase.from('subscriptions').select(SELECT_WITH_CATEGORY)

  if (filters.archived) query = query.not('archived_at', 'is', null)
  else query = query.is('archived_at', null)

  if (filters.q) {
    // PostgREST or() sözdizimini bozabilecek karakterleri temizle
    const q = filters.q.replace(/[,()%\\]/g, ' ').trim()
    if (q) query = query.or(`name.ilike.%${q}%,provider.ilike.%${q}%`)
  }
  const validStatuses: SubscriptionStatus[] = ['active', 'trial', 'paused', 'cancelled', 'expired']
  if (filters.status && validStatuses.includes(filters.status as SubscriptionStatus)) {
    query = query.eq('status', filters.status as SubscriptionStatus)
  }
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId)

  const sort = filters.sort ?? 'next_payment_date'
  const ascending = (filters.dir ?? (sort === 'name' ? 'asc' : 'asc')) === 'asc'
  query = query.order(sort, { ascending }).order('name', { ascending: true })

  const { data, error } = await query
  if (error) throw new Error(`Abonelikler yüklenemedi: ${error.message}`)
  return (data ?? []) as unknown as SubscriptionWithCategory[]
}

export async function getSubscription(
  id: string,
): Promise<SubscriptionWithCategory | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('subscriptions')
    .select(SELECT_WITH_CATEGORY)
    .eq('id', id)
    .maybeSingle()
  return (data as unknown as SubscriptionWithCategory) ?? null
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw new Error(`Kategoriler yüklenemedi: ${error.message}`)
  return data ?? []
}

export type CategoryWithCount = Category & { subscription_count: number }

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const supabase = await createClient()
  const [{ data: categories, error }, { data: subs }] = await Promise.all([
    supabase.from('categories').select('*').order('name', { ascending: true }),
    supabase.from('subscriptions').select('category_id').is('archived_at', null),
  ])
  if (error) throw new Error(`Kategoriler yüklenemedi: ${error.message}`)
  const counts = new Map<string, number>()
  for (const s of subs ?? []) {
    if (s.category_id) counts.set(s.category_id, (counts.get(s.category_id) ?? 0) + 1)
  }
  return (categories ?? []).map((c) => ({
    ...c,
    subscription_count: counts.get(c.id) ?? 0,
  }))
}

export async function getPriceHistory(subscriptionId: string): Promise<PriceHistory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .order('changed_at', { ascending: false })
  if (error) throw new Error(`Fiyat geçmişi yüklenemedi: ${error.message}`)
  return data ?? []
}

export async function getAllPriceHistory(limit = 50): Promise<
  (PriceHistory & { subscription: Pick<Subscription, 'id' | 'name'> | null })[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('price_history')
    .select('*, subscription:subscriptions(id, name)')
    .order('changed_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`Fiyat geçmişi yüklenemedi: ${error.message}`)
  return (data ?? []) as unknown as (PriceHistory & {
    subscription: Pick<Subscription, 'id' | 'name'> | null
  })[]
}

export async function getNotifications() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(`Bildirimler yüklenemedi: ${error.message}`)
  return data ?? []
}
