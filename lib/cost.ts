// Maliyet hesaplamaları — saf, bağımsız ve test edilebilir.

import { diffDays, firstOfMonth, lastOfMonth, monthKey, addMonthsClamped } from '@/lib/dates'
import type {
  BillingCycle,
  PriceHistory,
  Subscription,
  SubscriptionStatus,
} from '@/lib/supabase/types'

const AVG_DAYS_PER_YEAR = 365.2425

/** Bir döngü tutarının aylık eşdeğeri. */
export function monthlyEquivalent(
  amount: number,
  cycle: BillingCycle,
  customIntervalDays?: number | null,
): number {
  switch (cycle) {
    case 'weekly':
      return (amount * 52) / 12
    case 'monthly':
      return amount
    case 'quarterly':
      return amount / 3
    case 'semi_annual':
      return amount / 6
    case 'yearly':
      return amount / 12
    case 'custom': {
      if (!customIntervalDays || customIntervalDays <= 0) {
        throw new Error('Özel döngü için gün sayısı gerekli')
      }
      return (amount * AVG_DAYS_PER_YEAR) / customIntervalDays / 12
    }
  }
}

export function yearlyEquivalent(
  amount: number,
  cycle: BillingCycle,
  customIntervalDays?: number | null,
): number {
  return monthlyEquivalent(amount, cycle, customIntervalDays) * 12
}

/** Toplamlara dahil edilecek durumlar: aktif ve deneme. */
const COUNTED_STATUSES: readonly SubscriptionStatus[] = ['active', 'trial']

export type CostCountable = Pick<
  Subscription,
  'amount' | 'currency' | 'billing_cycle' | 'custom_interval_days' | 'status'
> & { archived_at?: string | null }

export function isCounted(sub: CostCountable): boolean {
  return COUNTED_STATUSES.includes(sub.status) && !sub.archived_at
}

export interface CurrencyTotals {
  currency: string
  monthly: number
  yearly: number
  count: number
}

/**
 * Para birimine göre ayrılmış toplamlar. Farklı para birimleri kur verisi
 * olmadan asla toplanmaz; her biri ayrı satır döner.
 */
export function totalsByCurrency(subs: CostCountable[]): CurrencyTotals[] {
  const map = new Map<string, CurrencyTotals>()
  for (const sub of subs) {
    if (!isCounted(sub)) continue
    const monthly = monthlyEquivalent(sub.amount, sub.billing_cycle, sub.custom_interval_days)
    const entry = map.get(sub.currency) ?? {
      currency: sub.currency,
      monthly: 0,
      yearly: 0,
      count: 0,
    }
    entry.monthly += monthly
    entry.yearly += monthly * 12
    entry.count += 1
    map.set(sub.currency, entry)
  }
  // En çok abonelik barındıran para birimi önce
  return [...map.values()].sort((a, b) => b.count - a.count)
}

/** Fiyat değişim yüzdesi; eski fiyat 0 ise yüzde tanımsızdır (null). */
export function priceChangePercent(oldAmount: number, newAmount: number): number | null {
  if (oldAmount === 0) return null
  return ((newAmount - oldAmount) / oldAmount) * 100
}

type HistoryEntry = Pick<PriceHistory, 'old_amount' | 'new_amount' | 'changed_at'>

/**
 * Verilen tarihte aboneliğin tutarı (fiyat geçmişine göre).
 * Geçmiş kaydı yoksa güncel tutar; ilk değişiklikten önceyse ilk kaydın
 * eski tutarı; aksi halde o tarihe kadarki son değişikliğin yeni tutarı.
 */
export function amountAt(
  currentAmount: number,
  history: HistoryEntry[],
  isoDateTime: string,
): number {
  if (history.length === 0) return currentAmount
  const sorted = [...history].sort((a, b) => a.changed_at.localeCompare(b.changed_at))
  if (isoDateTime < sorted[0].changed_at) return sorted[0].old_amount
  let amount = sorted[0].new_amount
  for (const h of sorted) {
    if (h.changed_at <= isoDateTime) amount = h.new_amount
    else break
  }
  return amount
}

export type HistorySub = Pick<
  Subscription,
  | 'id'
  | 'amount'
  | 'currency'
  | 'billing_cycle'
  | 'custom_interval_days'
  | 'status'
  | 'start_date'
  | 'cancelled_at'
  | 'archived_at'
> & { created_at?: string }

export interface MonthlySpendPoint {
  month: string // 'YYYY-MM'
  total: number
}

/**
 * Son `months` ay için tahmini aylık gider serisi (tek para birimi).
 * Bir abonelik, başlangıç ayından itibaren; iptal/sona erme durumunda
 * cancelled_at ayına kadar sayılır. Tutar, fiyat geçmişine göre o aydaki
 * geçerli fiyattır.
 */
export function monthlySpendHistory(
  subs: HistorySub[],
  historyBySub: Map<string, HistoryEntry[]>,
  currency: string,
  months: number,
  todayIso: string,
): MonthlySpendPoint[] {
  const points: MonthlySpendPoint[] = []
  for (let i = months - 1; i >= 0; i--) {
    const monthStartIso = addMonthsClamped(firstOfMonth(todayIso), -i)
    const key = monthKey(monthStartIso)
    const monthEnd = lastOfMonth(monthStartIso)
    let total = 0
    for (const sub of subs) {
      if (sub.currency !== currency) continue
      if (diffDays(sub.start_date, monthEnd) < 0) continue // henüz başlamamış
      const endIso =
        sub.status === 'cancelled' || sub.status === 'expired'
          ? (sub.cancelled_at ?? sub.archived_at)?.slice(0, 10)
          : null
      if (endIso && monthKey(endIso) < key) continue // bu aydan önce bitmiş
      const amount = amountAt(
        sub.amount,
        historyBySub.get(sub.id) ?? [],
        `${monthEnd}T23:59:59Z`,
      )
      total += monthlyEquivalent(amount, sub.billing_cycle, sub.custom_interval_days)
    }
    points.push({ month: key, total: Math.round(total * 100) / 100 })
  }
  return points
}
