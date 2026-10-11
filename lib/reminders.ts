// Hatırlatma üretimi — saf ve test edilebilir çekirdek mantık.
// Cron endpoint'i bu fonksiyonların çıktısını veritabanına yazar.

import { diffDays, nextPaymentOnOrAfter } from '@/lib/dates'
import { formatDate, formatMoney } from '@/lib/format'
import type { NotificationType, Subscription } from '@/lib/supabase/types'

export type ReminderSub = Pick<
  Subscription,
  | 'id'
  | 'user_id'
  | 'name'
  | 'amount'
  | 'currency'
  | 'billing_cycle'
  | 'custom_interval_days'
  | 'start_date'
  | 'next_payment_date'
  | 'auto_renew'
  | 'status'
  | 'trial_end_date'
  | 'reminder_days'
  | 'archived_at'
>

export interface ReminderCandidate {
  user_id: string
  subscription_id: string
  type: NotificationType
  title: string
  body: string
  scheduled_for: string
  dedupe_key: string
}

const TRIAL_REMINDER_DAYS = [7, 3, 1, 0]

function dueLabel(days: number): string {
  if (days === 0) return 'bugün'
  if (days === 1) return 'yarın'
  return `${days} gün sonra`
}

/** Bugün üretilmesi gereken bildirim adayları (dedupe anahtarlı). */
export function reminderCandidates(sub: ReminderSub, today: string): ReminderCandidate[] {
  if (sub.archived_at) return []
  if (sub.status !== 'active' && sub.status !== 'trial') return []

  const out: ReminderCandidate[] = []
  const daysToPayment = diffDays(today, sub.next_payment_date)

  for (const r of sub.reminder_days) {
    if (daysToPayment === r) {
      out.push({
        user_id: sub.user_id,
        subscription_id: sub.id,
        type: 'payment_due',
        title:
          r === 0
            ? `${sub.name} ödemesi bugün`
            : `${sub.name} ödemesi ${dueLabel(r)}`,
        body: `${formatMoney(sub.amount, sub.currency)} tutarındaki ödeme ${formatDate(
          sub.next_payment_date,
        )} tarihinde alınacak.`,
        scheduled_for: sub.next_payment_date,
        dedupe_key: `sub:${sub.id}:payment_due:${sub.next_payment_date}:${r}`,
      })
    }
  }

  if (sub.trial_end_date) {
    const daysToTrialEnd = diffDays(today, sub.trial_end_date)
    if (TRIAL_REMINDER_DAYS.includes(daysToTrialEnd)) {
      out.push({
        user_id: sub.user_id,
        subscription_id: sub.id,
        type: 'trial_ending',
        title:
          daysToTrialEnd === 0
            ? `${sub.name} deneme süresi bugün bitiyor`
            : `${sub.name} deneme süresi ${dueLabel(daysToTrialEnd)} bitiyor`,
        body: `Deneme süresi ${formatDate(sub.trial_end_date)} tarihinde sona eriyor. Devam etmek istemiyorsanız iptal etmeyi unutmayın.`,
        scheduled_for: sub.trial_end_date,
        dedupe_key: `sub:${sub.id}:trial_ending:${sub.trial_end_date}:${daysToTrialEnd}`,
      })
    }
  }

  return out
}

export type RolloverAction =
  | { kind: 'advance'; next_payment_date: string }
  | { kind: 'expire' }
  | { kind: 'none' }

/**
 * Vadesi geçmiş abonelik için yapılacak işlem:
 * otomatik yenilenenler bir sonraki vadeye taşınır, yenilenmeyenler sona erer.
 */
export function rolloverAction(sub: ReminderSub, today: string): RolloverAction {
  if (sub.archived_at) return { kind: 'none' }
  if (sub.status !== 'active' && sub.status !== 'trial') return { kind: 'none' }
  if (diffDays(today, sub.next_payment_date) >= 0) return { kind: 'none' }

  if (!sub.auto_renew) return { kind: 'expire' }
  const next = nextPaymentOnOrAfter(
    sub.start_date,
    sub.billing_cycle,
    sub.custom_interval_days,
    today,
  )
  return { kind: 'advance', next_payment_date: next }
}
