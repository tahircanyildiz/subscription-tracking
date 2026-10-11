import { describe, expect, it } from 'vitest'

import {
  addDays,
  addMonthsClamped,
  diffDays,
  isISODate,
  lastOfMonth,
  nextPaymentOnOrAfter,
  nthOccurrence,
  occurrencesInRange,
  todayISO,
} from '@/lib/dates'

describe('isISODate', () => {
  it('geçerli tarihleri kabul eder', () => {
    expect(isISODate('2026-10-11')).toBe(true)
    expect(isISODate('2024-02-29')).toBe(true) // artık yıl
  })
  it('geçersiz tarihleri reddeder', () => {
    expect(isISODate('2026-13-01')).toBe(false)
    expect(isISODate('2026-02-30')).toBe(false)
    expect(isISODate('2025-02-29')).toBe(false) // artık yıl değil
    expect(isISODate('11.10.2026')).toBe(false)
    expect(isISODate('')).toBe(false)
  })
})

describe('addMonthsClamped — ay sonu davranışı', () => {
  it('31 Oca + 1 ay = 28 Şub (normal yıl)', () => {
    expect(addMonthsClamped('2026-01-31', 1)).toBe('2026-02-28')
  })
  it('31 Oca + 1 ay = 29 Şub (artık yıl)', () => {
    expect(addMonthsClamped('2024-01-31', 1)).toBe('2024-02-29')
  })
  it('30 Kas + 1 ay = 30 Ara', () => {
    expect(addMonthsClamped('2026-11-30', 1)).toBe('2026-12-30')
  })
  it('yıl taşması', () => {
    expect(addMonthsClamped('2026-12-15', 1)).toBe('2027-01-15')
    expect(addMonthsClamped('2026-01-15', -1)).toBe('2025-12-15')
  })
})

describe('nthOccurrence — çıpa tabanlı vade (kayma yok)', () => {
  it('31 Oca aylık: Şub 28, Mar 31 (28 değil!)', () => {
    expect(nthOccurrence('2026-01-31', 'monthly', null, 1)).toBe('2026-02-28')
    expect(nthOccurrence('2026-01-31', 'monthly', null, 2)).toBe('2026-03-31')
  })
  it('haftalık', () => {
    expect(nthOccurrence('2026-10-01', 'weekly', null, 3)).toBe('2026-10-22')
  })
  it('üç aylık ve yıllık', () => {
    expect(nthOccurrence('2026-01-10', 'quarterly', null, 2)).toBe('2026-07-10')
    expect(nthOccurrence('2024-02-29', 'yearly', null, 1)).toBe('2025-02-28')
  })
  it('özel aralık', () => {
    expect(nthOccurrence('2026-10-01', 'custom', 45, 2)).toBe('2026-12-30')
    expect(() => nthOccurrence('2026-10-01', 'custom', null, 1)).toThrow()
  })
})

describe('nextPaymentOnOrAfter', () => {
  it('başlangıç gelecekteyse başlangıcı döner', () => {
    expect(nextPaymentOnOrAfter('2026-12-01', 'monthly', null, '2026-10-11')).toBe('2026-12-01')
  })
  it('geçmiş başlangıçtan ileri sarar', () => {
    expect(nextPaymentOnOrAfter('2025-01-15', 'monthly', null, '2026-10-11')).toBe('2026-10-15')
  })
  it('tam vade gününde o günü döner', () => {
    expect(nextPaymentOnOrAfter('2025-01-15', 'monthly', null, '2026-10-15')).toBe('2026-10-15')
  })
  it('ay sonu çıpası uzun vadede korunur', () => {
    expect(nextPaymentOnOrAfter('2024-01-31', 'monthly', null, '2026-03-01')).toBe('2026-03-31')
  })
  it('yıllık, artık yıl başlangıçlı', () => {
    expect(nextPaymentOnOrAfter('2024-02-29', 'yearly', null, '2026-01-01')).toBe('2026-02-28')
    expect(nextPaymentOnOrAfter('2024-02-29', 'yearly', null, '2028-01-01')).toBe('2028-02-29')
  })
})

describe('occurrencesInRange', () => {
  it('ay içindeki haftalık vadeleri bulur', () => {
    expect(
      occurrencesInRange('2026-09-07', 'weekly', null, '2026-10-01', '2026-10-31'),
    ).toEqual(['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26'])
  })
  it('aralık dışındaysa boş döner', () => {
    expect(
      occurrencesInRange('2026-11-15', 'monthly', null, '2026-10-01', '2026-10-31'),
    ).toEqual([])
  })
})

describe('diffDays / addDays', () => {
  it('gün farkı', () => {
    expect(diffDays('2026-10-11', '2026-10-18')).toBe(7)
    expect(diffDays('2026-10-18', '2026-10-11')).toBe(-7)
  })
  it('yaz saati sınırlarında kaymaz (UTC hesap)', () => {
    expect(diffDays('2026-03-28', '2026-03-30')).toBe(2)
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26')
  })
})

describe('todayISO — saat dilimi', () => {
  it('UTC gece yarısı civarında İstanbul bir gün ileridedir', () => {
    const utcLateNight = new Date('2026-10-11T22:30:00Z') // İstanbul: 12 Eki 01:30
    expect(todayISO(utcLateNight, 'Europe/Istanbul')).toBe('2026-10-12')
    expect(todayISO(utcLateNight, 'UTC')).toBe('2026-10-11')
  })
})

describe('lastOfMonth', () => {
  it('şubat ve artık yıl', () => {
    expect(lastOfMonth('2026-02-10')).toBe('2026-02-28')
    expect(lastOfMonth('2024-02-10')).toBe('2024-02-29')
    expect(lastOfMonth('2026-12-01')).toBe('2026-12-31')
  })
})
