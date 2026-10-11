import { describe, expect, it } from 'vitest'

import {
  categorySchema,
  fieldErrors,
  priceChangeSchema,
  signInSchema,
  signUpSchema,
  subscriptionSchema,
  updatePasswordSchema,
} from '@/lib/schemas'

const validSub = {
  name: 'Netflix',
  provider: 'Netflix Inc.',
  category_id: null,
  amount: '229.99',
  currency: 'TRY',
  billing_cycle: 'monthly',
  custom_interval_days: null,
  start_date: '2026-01-10',
  next_payment_date: '2026-11-10',
  auto_renew: true,
  status: 'active',
  trial_end_date: null,
  description: '',
  reminder_days: ['7', '3', '1'],
}

describe('subscriptionSchema', () => {
  it('geçerli formu kabul eder ve tipleri dönüştürür', () => {
    const result = subscriptionSchema.safeParse(validSub)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.amount).toBe(229.99)
      expect(result.data.reminder_days).toEqual([7, 3, 1])
      expect(result.data.description).toBeNull()
    }
  })
  it('boş ad reddedilir', () => {
    const r = subscriptionSchema.safeParse({ ...validSub, name: '  ' })
    expect(r.success).toBe(false)
    if (!r.success) expect(fieldErrors(r.error).name).toBeTruthy()
  })
  it('negatif tutar reddedilir', () => {
    const r = subscriptionSchema.safeParse({ ...validSub, amount: '-5' })
    expect(r.success).toBe(false)
  })
  it('sayı olmayan tutar reddedilir', () => {
    const r = subscriptionSchema.safeParse({ ...validSub, amount: 'abc' })
    expect(r.success).toBe(false)
  })
  it('custom döngüde gün sayısı zorunlu', () => {
    const r = subscriptionSchema.safeParse({
      ...validSub,
      billing_cycle: 'custom',
      custom_interval_days: null,
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(fieldErrors(r.error).custom_interval_days).toBeTruthy()
  })
  it('custom döngüde gün sayısıyla geçer', () => {
    const r = subscriptionSchema.safeParse({
      ...validSub,
      billing_cycle: 'custom',
      custom_interval_days: '45',
    })
    expect(r.success).toBe(true)
  })
  it('sonraki ödeme başlangıçtan önce olamaz', () => {
    const r = subscriptionSchema.safeParse({
      ...validSub,
      start_date: '2026-11-10',
      next_payment_date: '2026-01-10',
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(fieldErrors(r.error).next_payment_date).toBeTruthy()
  })
  it('geçersiz tarih reddedilir (30 Şubat)', () => {
    const r = subscriptionSchema.safeParse({ ...validSub, start_date: '2026-02-30' })
    expect(r.success).toBe(false)
  })
  it('deneme durumu bitiş tarihi ister', () => {
    const r = subscriptionSchema.safeParse({ ...validSub, status: 'trial' })
    expect(r.success).toBe(false)
    if (!r.success) expect(fieldErrors(r.error).trial_end_date).toBeTruthy()
  })
  it('geçersiz para birimi reddedilir', () => {
    const r = subscriptionSchema.safeParse({ ...validSub, currency: 'XXX' })
    expect(r.success).toBe(false)
  })
})

describe('priceChangeSchema', () => {
  it('tutarı yuvarlar ve notu temizler', () => {
    const r = priceChangeSchema.safeParse({ amount: '249.999', note: ' zam geldi ' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.amount).toBe(250)
      expect(r.data.note).toBe('zam geldi')
    }
  })
})

describe('categorySchema', () => {
  it('geçerli kategori', () => {
    expect(categorySchema.safeParse({ name: 'Eğitim', color: '#aabbcc' }).success).toBe(true)
  })
  it('geçersiz renk reddedilir', () => {
    expect(categorySchema.safeParse({ name: 'Eğitim', color: 'kırmızı' }).success).toBe(false)
  })
})

describe('auth şemaları', () => {
  it('signUp: kısa şifre reddedilir', () => {
    const r = signUpSchema.safeParse({ full_name: 'Ali Veli', email: 'a@b.co', password: '1234567' })
    expect(r.success).toBe(false)
  })
  it('signUp: e-posta küçük harfe çevrilir', () => {
    const r = signUpSchema.safeParse({ full_name: 'Ali Veli', email: 'ALI@Test.COM', password: 'parola123' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.email).toBe('ali@test.com')
  })
  it('signIn: geçersiz e-posta reddedilir', () => {
    expect(signInSchema.safeParse({ email: 'not-an-email', password: 'x' }).success).toBe(false)
  })
  it('updatePassword: eşleşmeyen şifreler reddedilir', () => {
    const r = updatePasswordSchema.safeParse({ password: 'parola123', password_confirm: 'parola124' })
    expect(r.success).toBe(false)
    if (!r.success) expect(fieldErrors(r.error).password_confirm).toBe('Şifreler eşleşmiyor')
  })
})
