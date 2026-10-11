import { describe, expect, it } from 'vitest'

import {
  amountAt,
  isCounted,
  monthlyEquivalent,
  monthlySpendHistory,
  priceChangePercent,
  totalsByCurrency,
  yearlyEquivalent,
  type CostCountable,
  type HistorySub,
} from '@/lib/cost'

describe('monthlyEquivalent — spesifikasyondaki formüller', () => {
  it('haftalık: tutar × 52 / 12', () => {
    expect(monthlyEquivalent(12, 'weekly')).toBeCloseTo((12 * 52) / 12, 10)
  })
  it('aylık: tutar', () => {
    expect(monthlyEquivalent(229.99, 'monthly')).toBe(229.99)
  })
  it('üç aylık: tutar / 3', () => {
    expect(monthlyEquivalent(300, 'quarterly')).toBeCloseTo(100, 10)
  })
  it('altı aylık: tutar / 6', () => {
    expect(monthlyEquivalent(600, 'semi_annual')).toBeCloseTo(100, 10)
  })
  it('yıllık: tutar / 12', () => {
    expect(monthlyEquivalent(1200, 'yearly')).toBeCloseTo(100, 10)
  })
  it('özel: tutar × 365.2425 / gün / 12', () => {
    expect(monthlyEquivalent(100, 'custom', 30)).toBeCloseTo((100 * 365.2425) / 30 / 12, 10)
  })
  it('özel aralık gün sayısı yoksa hata fırlatır', () => {
    expect(() => monthlyEquivalent(100, 'custom')).toThrow()
    expect(() => monthlyEquivalent(100, 'custom', 0)).toThrow()
  })
  it('yıllık eşdeğer = aylık × 12', () => {
    expect(yearlyEquivalent(229.99, 'monthly')).toBeCloseTo(229.99 * 12, 10)
  })
})

function sub(partial: Partial<CostCountable>): CostCountable {
  return {
    amount: 100,
    currency: 'TRY',
    billing_cycle: 'monthly',
    custom_interval_days: null,
    status: 'active',
    archived_at: null,
    ...partial,
  }
}

describe('durum ele alma', () => {
  it('aktif ve deneme sayılır; iptal/duraklatılmış/süresi dolmuş sayılmaz', () => {
    expect(isCounted(sub({ status: 'active' }))).toBe(true)
    expect(isCounted(sub({ status: 'trial' }))).toBe(true)
    expect(isCounted(sub({ status: 'cancelled' }))).toBe(false)
    expect(isCounted(sub({ status: 'paused' }))).toBe(false)
    expect(isCounted(sub({ status: 'expired' }))).toBe(false)
  })
  it('arşivlenmiş abonelik sayılmaz', () => {
    expect(isCounted(sub({ archived_at: '2026-01-01T00:00:00Z' }))).toBe(false)
  })
})

describe('totalsByCurrency — para birimi ayrımı', () => {
  it('farklı para birimlerini asla toplamaz', () => {
    const totals = totalsByCurrency([
      sub({ amount: 100, currency: 'TRY' }),
      sub({ amount: 50, currency: 'TRY', billing_cycle: 'yearly' }),
      sub({ amount: 10, currency: 'USD' }),
      sub({ amount: 240, currency: 'USD', status: 'cancelled' }), // hariç
    ])
    expect(totals).toHaveLength(2)
    const tryTotal = totals.find((t) => t.currency === 'TRY')!
    const usdTotal = totals.find((t) => t.currency === 'USD')!
    expect(tryTotal.monthly).toBeCloseTo(100 + 50 / 12, 10)
    expect(tryTotal.yearly).toBeCloseTo((100 + 50 / 12) * 12, 10)
    expect(tryTotal.count).toBe(2)
    expect(usdTotal.monthly).toBeCloseTo(10, 10)
    expect(usdTotal.count).toBe(1)
  })
  it('boş listede boş döner', () => {
    expect(totalsByCurrency([])).toEqual([])
  })
})

describe('priceChangePercent', () => {
  it('artış: 199.99 → 249.99 = +%25', () => {
    expect(priceChangePercent(199.99, 249.99)).toBeCloseTo(25.0, 1)
  })
  it('azalış negatif döner', () => {
    expect(priceChangePercent(200, 150)).toBeCloseTo(-25, 10)
  })
  it('eski fiyat 0 ise null (tanımsız)', () => {
    expect(priceChangePercent(0, 100)).toBeNull()
  })
  it('değişiklik yoksa 0', () => {
    expect(priceChangePercent(100, 100)).toBe(0)
  })
})

describe('amountAt — fiyat geçmişi', () => {
  const history = [
    { old_amount: 100, new_amount: 120, changed_at: '2026-03-01T10:00:00Z' },
    { old_amount: 120, new_amount: 150, changed_at: '2026-06-01T10:00:00Z' },
  ]
  it('ilk değişiklikten önce eski fiyat', () => {
    expect(amountAt(150, history, '2026-01-15T00:00:00Z')).toBe(100)
  })
  it('değişiklikler arasında ara fiyat', () => {
    expect(amountAt(150, history, '2026-04-15T00:00:00Z')).toBe(120)
  })
  it('son değişiklikten sonra güncel fiyat', () => {
    expect(amountAt(150, history, '2026-07-15T00:00:00Z')).toBe(150)
  })
  it('geçmiş yoksa güncel fiyat', () => {
    expect(amountAt(99, [], '2026-01-01T00:00:00Z')).toBe(99)
  })
})

describe('monthlySpendHistory', () => {
  const subs: HistorySub[] = [
    {
      id: 's1',
      amount: 150,
      currency: 'TRY',
      billing_cycle: 'monthly',
      custom_interval_days: null,
      status: 'active',
      start_date: '2026-02-10',
      cancelled_at: null,
      archived_at: null,
    },
    {
      id: 's2',
      amount: 60,
      currency: 'TRY',
      billing_cycle: 'monthly',
      custom_interval_days: null,
      status: 'cancelled',
      start_date: '2026-01-01',
      cancelled_at: '2026-04-20T00:00:00Z',
      archived_at: null,
    },
    {
      id: 's3',
      amount: 10,
      currency: 'USD',
      billing_cycle: 'monthly',
      custom_interval_days: null,
      status: 'active',
      start_date: '2026-01-01',
      cancelled_at: null,
      archived_at: null,
    },
  ]
  const historyBySub = new Map([
    ['s1', [{ old_amount: 120, new_amount: 150, changed_at: '2026-05-01T00:00:00Z' }]],
  ])

  it('başlangıç, iptal, fiyat geçmişi ve para birimi filtresini uygular', () => {
    const points = monthlySpendHistory(subs, historyBySub, 'TRY', 6, '2026-06-15')
    expect(points.map((p) => p.month)).toEqual([
      '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
    ])
    // Oca: yalnız s2 (60); s1 başlamadı, s3 USD
    expect(points[0].total).toBe(60)
    // Şub-Nis: s1 eski fiyat 120 + s2 60
    expect(points[1].total).toBe(180)
    expect(points[3].total).toBe(180) // Nis: s2 iptal ayı dahil
    // May: s1 yeni fiyat 150, s2 bitti
    expect(points[4].total).toBe(150)
    expect(points[5].total).toBe(150)
  })
})
