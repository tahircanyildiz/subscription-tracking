'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import type { ActionState } from '@/app/actions/auth'
import { priceChangePercent } from '@/lib/cost'
import { nextPaymentOnOrAfter, todayISO } from '@/lib/dates'
import { formatMoney, formatPercent } from '@/lib/format'
import { fieldErrors, priceChangeSchema, subscriptionSchema } from '@/lib/schemas'
import { createClient } from '@/lib/supabase/server'
import type { SubscriptionUpdate } from '@/lib/supabase/types'

const GENERIC_ERROR = 'İşlem başarısız oldu. Lütfen tekrar deneyin.'

function parseForm(formData: FormData) {
  return subscriptionSchema.safeParse({
    name: formData.get('name'),
    provider: formData.get('provider') ?? undefined,
    category_id: formData.get('category_id') || null,
    amount: formData.get('amount'),
    currency: formData.get('currency'),
    billing_cycle: formData.get('billing_cycle'),
    custom_interval_days: formData.get('custom_interval_days') || null,
    start_date: formData.get('start_date'),
    next_payment_date: formData.get('next_payment_date'),
    auto_renew: formData.get('auto_renew') === 'on',
    status: formData.get('status') ?? 'active',
    trial_end_date: formData.get('trial_end_date') || null,
    description: formData.get('description') ?? undefined,
    reminder_days: formData.getAll('reminder_days'),
  })
}

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

/** category_id kullanıcıya ait mi? (FK, RLS'i doğrulamaz — sunucuda kontrol edilir) */
async function validateCategoryOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categoryId: string | null | undefined,
): Promise<boolean> {
  if (!categoryId) return true
  const { data } = await supabase
    .from('categories')
    .select('id')
    .eq('id', categoryId)
    .maybeSingle()
  return Boolean(data)
}

export async function createSubscriptionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }

  const parsed = parseForm(formData)
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  if (!(await validateCategoryOwnership(supabase, parsed.data.category_id))) {
    return { fieldErrors: { category_id: 'Geçersiz kategori' } }
  }

  const { data: v } = { data: parsed.data }
  const { error } = await supabase.from('subscriptions').insert({
    user_id: user.id,
    name: v.name,
    provider: v.provider,
    category_id: v.category_id ?? null,
    amount: v.amount,
    currency: v.currency,
    billing_cycle: v.billing_cycle,
    custom_interval_days: v.billing_cycle === 'custom' ? v.custom_interval_days : null,
    start_date: v.start_date,
    next_payment_date: v.next_payment_date,
    auto_renew: v.auto_renew,
    status: v.status,
    trial_end_date: v.trial_end_date ?? null,
    description: v.description,
    reminder_days: v.reminder_days,
    cancelled_at: v.status === 'cancelled' ? new Date().toISOString() : null,
  })
  if (error) return { error: GENERIC_ERROR }

  revalidatePath('/app', 'layout')
  redirect('/app/abonelikler?mesaj=eklendi')
}

export async function updateSubscriptionAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!existing) return { error: 'Abonelik bulunamadı.' }

  const parsed = parseForm(formData)
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  if (!(await validateCategoryOwnership(supabase, parsed.data.category_id))) {
    return { fieldErrors: { category_id: 'Geçersiz kategori' } }
  }

  const v = parsed.data
  const priceChanged = v.amount !== existing.amount
  const priceNoteRaw = formData.get('price_note')

  const update: SubscriptionUpdate = {
    name: v.name,
    provider: v.provider,
    category_id: v.category_id ?? null,
    amount: v.amount,
    currency: v.currency,
    billing_cycle: v.billing_cycle,
    custom_interval_days: v.billing_cycle === 'custom' ? v.custom_interval_days : null,
    start_date: v.start_date,
    next_payment_date: v.next_payment_date,
    auto_renew: v.auto_renew,
    status: v.status,
    trial_end_date: v.trial_end_date ?? null,
    description: v.description,
    reminder_days: v.reminder_days,
  }
  if (v.status === 'cancelled' && existing.status !== 'cancelled') {
    update.cancelled_at = new Date().toISOString()
  }
  if (v.status !== 'cancelled') update.cancelled_at = null

  const { error } = await supabase.from('subscriptions').update(update).eq('id', id)
  if (error) return { error: GENERIC_ERROR }

  // Fiyat değiştiyse geçmişe kaydet + bildirim üret
  if (priceChanged) {
    const noteParsed = priceChangeSchema.safeParse({
      amount: v.amount,
      note: typeof priceNoteRaw === 'string' ? priceNoteRaw : undefined,
    })
    const note = noteParsed.success ? noteParsed.data.note : null
    await supabase.from('price_history').insert({
      subscription_id: id,
      user_id: user.id,
      old_amount: existing.amount,
      new_amount: v.amount,
      currency: v.currency,
      note,
    })
    const pct = priceChangePercent(existing.amount, v.amount)
    const direction = v.amount > existing.amount ? 'arttı' : 'düştü'
    await supabase.from('notifications').insert({
      user_id: user.id,
      subscription_id: id,
      type: 'price_change',
      title: `${v.name} fiyatı ${direction}`,
      body: `${formatMoney(existing.amount, v.currency)} → ${formatMoney(v.amount, v.currency)}${
        pct !== null ? ` (${formatPercent(pct)})` : ''
      }`,
    })
  }

  revalidatePath('/app', 'layout')
  redirect(`/app/abonelikler/${id}?mesaj=guncellendi`)
}

/** Durum/arşiv işlemleri — detay sayfasındaki hızlı aksiyonlar. */
export async function cancelSubscription(id: string): Promise<ActionState> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Oturum bulunamadı.' }
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      auto_renew: false,
    })
    .eq('id', id)
  if (error) return { error: GENERIC_ERROR }
  revalidatePath('/app', 'layout')
  return { success: 'Abonelik iptal edildi.' }
}

export async function pauseSubscription(id: string): Promise<ActionState> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Oturum bulunamadı.' }
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'paused' })
    .eq('id', id)
    .in('status', ['active', 'trial'])
  if (error) return { error: GENERIC_ERROR }
  revalidatePath('/app', 'layout')
  return { success: 'Abonelik duraklatıldı.' }
}

export async function resumeSubscription(id: string): Promise<ActionState> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Oturum bulunamadı.' }
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!sub) return { error: 'Abonelik bulunamadı.' }

  // Devam ettirirken sonraki ödemeyi bugünden ileriye taşı
  const next = nextPaymentOnOrAfter(
    sub.start_date,
    sub.billing_cycle,
    sub.custom_interval_days,
    todayISO(),
  )
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'active', next_payment_date: next, cancelled_at: null })
    .eq('id', id)
  if (error) return { error: GENERIC_ERROR }
  revalidatePath('/app', 'layout')
  return { success: 'Abonelik yeniden etkinleştirildi.' }
}

export async function archiveSubscription(id: string): Promise<ActionState> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Oturum bulunamadı.' }
  const { error } = await supabase
    .from('subscriptions')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: GENERIC_ERROR }
  revalidatePath('/app', 'layout')
  return { success: 'Abonelik arşivlendi.' }
}

export async function unarchiveSubscription(id: string): Promise<ActionState> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Oturum bulunamadı.' }
  const { error } = await supabase
    .from('subscriptions')
    .update({ archived_at: null })
    .eq('id', id)
  if (error) return { error: GENERIC_ERROR }
  revalidatePath('/app', 'layout')
  return { success: 'Abonelik arşivden çıkarıldı.' }
}

export async function deleteSubscription(id: string): Promise<ActionState> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Oturum bulunamadı.' }
  const { error } = await supabase.from('subscriptions').delete().eq('id', id)
  if (error) return { error: GENERIC_ERROR }
  revalidatePath('/app', 'layout')
  return { success: 'Abonelik silindi.' }
}
