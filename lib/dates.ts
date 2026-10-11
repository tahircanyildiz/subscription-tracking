// Tarih yardımcıları — tüm tarihler 'YYYY-MM-DD' ISO string olarak,
// saat dilimi kaymalarını önlemek için UTC üzerinden hesaplanır.

import type { BillingCycle } from '@/lib/supabase/types'

export type ISODate = string

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

export function isISODate(value: string): boolean {
  if (!ISO_RE.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && toISO(d) === value
}

function toISO(d: Date): ISODate {
  return d.toISOString().slice(0, 10)
}

function parts(iso: ISODate): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d }
}

export function daysInMonth(year: number, month: number): number {
  // month: 1-12; gün 0 = önceki ayın son günü
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** Ay ekler; gün ay sonunu aşarsa ayın son gününe sabitlenir (31 Oca + 1 ay = 28/29 Şub). */
export function addMonthsClamped(iso: ISODate, months: number): ISODate {
  const { y, m, d } = parts(iso)
  const totalMonths = y * 12 + (m - 1) + months
  const ny = Math.floor(totalMonths / 12)
  const nm = (totalMonths % 12) + 1
  const nd = Math.min(d, daysInMonth(ny, nm))
  return toISO(new Date(Date.UTC(ny, nm - 1, nd)))
}

export function addDays(iso: ISODate, days: number): ISODate {
  const { y, m, d } = parts(iso)
  return toISO(new Date(Date.UTC(y, m - 1, d + days)))
}

/** b - a, gün cinsinden (b ileri tarihse pozitif). */
export function diffDays(a: ISODate, b: ISODate): number {
  const pa = parts(a)
  const pb = parts(b)
  const ta = Date.UTC(pa.y, pa.m - 1, pa.d)
  const tb = Date.UTC(pb.y, pb.m - 1, pb.d)
  return Math.round((tb - ta) / 86_400_000)
}

/** Verilen saat diliminde bugünün tarihi ('en-CA' locale'i YYYY-MM-DD üretir). */
export function todayISO(now: Date = new Date(), timeZone = 'Europe/Istanbul'): ISODate {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/**
 * Başlangıç tarihine çıpalanmış n'inci ödeme tarihi (n=0 → başlangıç).
 * Aylık döngülerde her vade başlangıç gününe göre hesaplanır, böylece
 * 31 Oca → 28 Şub → 31 Mar kayması yaşanmaz.
 */
export function nthOccurrence(
  start: ISODate,
  cycle: BillingCycle,
  customIntervalDays: number | null,
  n: number,
): ISODate {
  switch (cycle) {
    case 'weekly':
      return addDays(start, n * 7)
    case 'monthly':
      return addMonthsClamped(start, n)
    case 'quarterly':
      return addMonthsClamped(start, n * 3)
    case 'semi_annual':
      return addMonthsClamped(start, n * 6)
    case 'yearly':
      return addMonthsClamped(start, n * 12)
    case 'custom': {
      if (!customIntervalDays || customIntervalDays <= 0) {
        throw new Error('Özel döngü için customIntervalDays gerekli')
      }
      return addDays(start, n * customIntervalDays)
    }
  }
}

/** from tarihinde veya sonrasındaki ilk ödeme tarihi (başlangıca çıpalı). */
export function nextPaymentOnOrAfter(
  start: ISODate,
  cycle: BillingCycle,
  customIntervalDays: number | null,
  from: ISODate,
): ISODate {
  if (diffDays(from, start) >= 0) return start
  // Kaba tahminle başla, sonra doğrusal düzelt
  const gap = diffDays(start, from)
  const approxDays =
    cycle === 'weekly' ? 7
    : cycle === 'monthly' ? 30
    : cycle === 'quarterly' ? 91
    : cycle === 'semi_annual' ? 182
    : cycle === 'yearly' ? 365
    : (customIntervalDays ?? 30)
  let n = Math.max(0, Math.floor(gap / approxDays) - 2)
  for (let i = 0; i < 10_000; i++, n++) {
    const occ = nthOccurrence(start, cycle, customIntervalDays, n)
    if (diffDays(from, occ) >= 0) return occ
  }
  throw new Error('nextPaymentOnOrAfter: iterasyon sınırı aşıldı')
}

/** [from, to] aralığındaki tüm ödeme tarihleri (takvim görünümü için). */
export function occurrencesInRange(
  start: ISODate,
  cycle: BillingCycle,
  customIntervalDays: number | null,
  from: ISODate,
  to: ISODate,
  limit = 400,
): ISODate[] {
  const result: ISODate[] = []
  const first = nextPaymentOnOrAfter(start, cycle, customIntervalDays, from)
  if (diffDays(first, to) < 0) return result
  // first'in kaçıncı vade olduğunu bul
  let n = 0
  for (let i = 0; i < 10_000; i++) {
    const occ = nthOccurrence(start, cycle, customIntervalDays, i)
    if (occ === first) {
      n = i
      break
    }
    if (diffDays(occ, to) < 0) return result
  }
  for (let i = 0; i < limit; i++) {
    const occ = nthOccurrence(start, cycle, customIntervalDays, n + i)
    if (diffDays(occ, to) < 0) break
    result.push(occ)
  }
  return result
}

/** 'YYYY-MM' ay anahtarı. */
export function monthKey(iso: ISODate): string {
  return iso.slice(0, 7)
}

export function firstOfMonth(iso: ISODate): ISODate {
  return `${iso.slice(0, 7)}-01`
}

export function lastOfMonth(iso: ISODate): ISODate {
  const { y, m } = parts(iso)
  return toISO(new Date(Date.UTC(y, m - 1, daysInMonth(y, m))))
}
