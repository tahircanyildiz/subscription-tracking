import { timingSafeEqual } from 'node:crypto'

import { NextResponse, type NextRequest } from 'next/server'

import { todayISO } from '@/lib/dates'
import { emailEnabled, sendEmail } from '@/lib/email'
import { reminderCandidates, rolloverAction, type ReminderCandidate } from '@/lib/reminders'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`
  const a = Buffer.from(header)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Zamanlanmış hatırlatma işi (günde bir çağrılır, idempotent):
 * 1. Vadesi geçen abonelikleri ilerletir veya sona erdirir.
 * 2. Hatırlatma bildirimlerini üretir (dedupe anahtarıyla tekrarsız).
 * 3. İsteğe bağlı: Resend ile e-posta gönderir.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY yapılandırılmamış' },
      { status: 500 },
    )
  }

  const today = todayISO()
  const summary = { advanced: 0, expired: 0, created: 0, emailed: 0, errors: [] as string[] }

  const { data: subs, error: subsError } = await admin
    .from('subscriptions')
    .select(
      'id, user_id, name, amount, currency, billing_cycle, custom_interval_days, start_date, next_payment_date, auto_renew, status, trial_end_date, reminder_days, archived_at',
    )
    .is('archived_at', null)
    .in('status', ['active', 'trial'])

  if (subsError) {
    return NextResponse.json({ error: 'abonelikler okunamadı' }, { status: 500 })
  }

  // 1) Vadesi geçenleri ilerlet / sona erdir
  for (const sub of subs ?? []) {
    const action = rolloverAction(sub, today)
    if (action.kind === 'advance') {
      const { error } = await admin
        .from('subscriptions')
        .update({ next_payment_date: action.next_payment_date })
        .eq('id', sub.id)
      if (error) summary.errors.push(`advance:${sub.id}`)
      else {
        sub.next_payment_date = action.next_payment_date
        summary.advanced++
      }
    } else if (action.kind === 'expire') {
      const { error } = await admin
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('id', sub.id)
      if (error) summary.errors.push(`expire:${sub.id}`)
      else {
        sub.status = 'expired'
        summary.expired++
      }
    }
  }

  // 2) Bildirim adayları
  const candidates: ReminderCandidate[] = []
  for (const sub of subs ?? []) candidates.push(...reminderCandidates(sub, today))

  let created: ReminderCandidate[] = []
  if (candidates.length > 0) {
    const keys = candidates.map((c) => c.dedupe_key)
    const { data: existing } = await admin
      .from('notifications')
      .select('dedupe_key')
      .in('dedupe_key', keys)
    const existingKeys = new Set((existing ?? []).map((e) => e.dedupe_key))
    created = candidates.filter((c) => !existingKeys.has(c.dedupe_key))

    if (created.length > 0) {
      const { error } = await admin.from('notifications').insert(created)
      if (error) {
        // Yarış durumunda unique index devreye girer; tek tek deneyip 23505'i yok say
        created = []
        for (const c of candidates) {
          const { error: singleError } = await admin.from('notifications').insert(c)
          if (!singleError) created.push(c)
          else if (singleError.code !== '23505') summary.errors.push(`insert:${c.dedupe_key}`)
        }
      }
      summary.created = created.length
    }
  }

  // 3) E-posta (opsiyonel)
  if (emailEnabled() && created.length > 0) {
    const userIds = [...new Set(created.map((c) => c.user_id))]
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, email_notifications')
      .in('id', userIds)
    const wantsEmail = new Set(
      (profiles ?? []).filter((p) => p.email_notifications).map((p) => p.id),
    )
    const emails = new Map<string, string>()
    for (const uid of userIds) {
      if (!wantsEmail.has(uid)) continue
      const { data } = await admin.auth.admin.getUserById(uid)
      if (data.user?.email) emails.set(uid, data.user.email)
    }
    for (const c of created) {
      const to = emails.get(c.user_id)
      if (!to) continue
      const ok = await sendEmail({
        to,
        subject: `Abonelik Dedektifi — ${c.title}`,
        text: `${c.title}\n\n${c.body}\n\nAboneliklerinizi görüntülemek için: ${
          process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
        }/app/bildirimler`,
      })
      if (ok) {
        summary.emailed++
        await admin
          .from('notifications')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('dedupe_key', c.dedupe_key)
          .eq('user_id', c.user_id)
      }
    }
  }

  return NextResponse.json({ ok: true, today, ...summary })
}
