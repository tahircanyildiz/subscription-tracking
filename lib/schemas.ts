// Form doğrulama şemaları (sunucu tarafında da kullanılır).

import { z } from 'zod'

import { isISODate } from '@/lib/dates'

export const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP'] as const
export const BILLING_CYCLES = [
  'weekly',
  'monthly',
  'quarterly',
  'semi_annual',
  'yearly',
  'custom',
] as const
export const STATUSES = ['active', 'trial', 'paused', 'cancelled', 'expired'] as const
export const REMINDER_DAY_OPTIONS = [7, 3, 1, 0] as const

export const BILLING_CYCLE_LABELS: Record<(typeof BILLING_CYCLES)[number], string> = {
  weekly: 'Haftalık',
  monthly: 'Aylık',
  quarterly: 'Üç aylık',
  semi_annual: 'Altı aylık',
  yearly: 'Yıllık',
  custom: 'Özel aralık',
}

export const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  active: 'Aktif',
  trial: 'Deneme',
  paused: 'Duraklatıldı',
  cancelled: 'İptal edildi',
  expired: 'Süresi doldu',
}

const isoDate = z
  .string({ error: 'Tarih gerekli' })
  .refine(isISODate, 'Geçerli bir tarih girin (YYYY-AA-GG)')

const amountField = z.coerce
  .number({ error: 'Geçerli bir tutar girin' })
  .min(0, 'Tutar negatif olamaz')
  .max(9_999_999_999, 'Tutar çok büyük')
  .refine((v) => Number.isFinite(v), 'Geçerli bir tutar girin')
  .transform((v) => Math.round(v * 100) / 100)

export const subscriptionSchema = z
  .object({
    name: z
      .string({ error: 'Abonelik adı gerekli' })
      .trim()
      .min(1, 'Abonelik adı gerekli')
      .max(120, 'Ad en fazla 120 karakter olabilir'),
    provider: z.string().trim().max(120, 'Sağlayıcı en fazla 120 karakter').optional()
      .transform((v) => (v ? v : null)),
    category_id: z.string().uuid('Geçersiz kategori').nullable().optional()
      .or(z.literal('').transform(() => null)),
    amount: amountField,
    currency: z.enum(CURRENCIES, { error: 'Para birimi seçin' }),
    billing_cycle: z.enum(BILLING_CYCLES, { error: 'Faturalandırma sıklığı seçin' }),
    custom_interval_days: z.coerce
      .number()
      .int('Gün sayısı tam sayı olmalı')
      .min(1, 'Gün sayısı en az 1 olmalı')
      .max(3650, 'Gün sayısı en fazla 3650 olabilir')
      .nullable()
      .optional(),
    start_date: isoDate,
    next_payment_date: isoDate,
    auto_renew: z.boolean().default(true),
    status: z.enum(STATUSES).default('active'),
    trial_end_date: isoDate.nullable().optional(),
    description: z.string().trim().max(2000, 'Açıklama en fazla 2000 karakter').optional()
      .transform((v) => (v ? v : null)),
    reminder_days: z
      .array(z.coerce.number().int().min(0).max(30))
      .max(5, 'En fazla 5 hatırlatma seçilebilir')
      .default([7, 3, 1]),
  })
  .superRefine((data, ctx) => {
    if (data.billing_cycle === 'custom' && !data.custom_interval_days) {
      ctx.addIssue({
        code: 'custom',
        path: ['custom_interval_days'],
        message: 'Özel aralık için gün sayısı girin',
      })
    }
    if (data.next_payment_date < data.start_date) {
      ctx.addIssue({
        code: 'custom',
        path: ['next_payment_date'],
        message: 'Sonraki ödeme tarihi başlangıçtan önce olamaz',
      })
    }
    if (data.status === 'trial' && !data.trial_end_date) {
      ctx.addIssue({
        code: 'custom',
        path: ['trial_end_date'],
        message: 'Deneme aboneliği için bitiş tarihi girin',
      })
    }
  })

export type SubscriptionFormValues = z.infer<typeof subscriptionSchema>

export const priceChangeSchema = z.object({
  amount: amountField,
  note: z.string().trim().max(500, 'Not en fazla 500 karakter').optional()
    .transform((v) => (v ? v : null)),
})

export const categorySchema = z.object({
  name: z
    .string({ error: 'Kategori adı gerekli' })
    .trim()
    .min(1, 'Kategori adı gerekli')
    .max(60, 'Ad en fazla 60 karakter olabilir'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Geçerli bir renk seçin')
    .optional()
    .transform((v) => v ?? null),
})

export const emailSchema = z
  .string({ error: 'E-posta gerekli' })
  .trim()
  .toLowerCase()
  .email('Geçerli bir e-posta adresi girin')

const passwordSchema = z
  .string({ error: 'Şifre gerekli' })
  .min(8, 'Şifre en az 8 karakter olmalı')
  .max(72, 'Şifre en fazla 72 karakter olabilir')

export const signUpSchema = z.object({
  full_name: z
    .string({ error: 'Ad soyad gerekli' })
    .trim()
    .min(2, 'Ad soyad en az 2 karakter olmalı')
    .max(120, 'Ad soyad en fazla 120 karakter'),
  email: emailSchema,
  password: passwordSchema,
})

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string({ error: 'Şifre gerekli' }).min(1, 'Şifre gerekli'),
})

export const resetRequestSchema = z.object({ email: emailSchema })

export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    password_confirm: z.string({ error: 'Şifre tekrarı gerekli' }),
  })
  .refine((d) => d.password === d.password_confirm, {
    path: ['password_confirm'],
    message: 'Şifreler eşleşmiyor',
  })

export const profileSchema = z.object({
  full_name: z
    .string({ error: 'Ad soyad gerekli' })
    .trim()
    .min(2, 'Ad soyad en az 2 karakter olmalı')
    .max(120, 'Ad soyad en fazla 120 karakter'),
  default_currency: z.enum(CURRENCIES, { error: 'Para birimi seçin' }),
  email_notifications: z.boolean().default(true),
})

/** Zod hatalarını alan → mesaj sözlüğüne çevirir. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form'
    if (!out[key]) out[key] = issue.message
  }
  return out
}
