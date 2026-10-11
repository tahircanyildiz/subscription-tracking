import { describe, expect, it } from 'vitest'

import { reminderCandidates, rolloverAction, type ReminderSub } from '@/lib/reminders'

function sub(partial: Partial<ReminderSub>): ReminderSub {
  return {
    id: 'sub-1',
    user_id: 'user-1',
    name: 'Netflix',
    amount: 229.99,
    currency: 'TRY',
    billing_cycle: 'monthly',
    custom_interval_days: null,
    start_date: '2026-01-15',
    next_payment_date: '2026-10-15',
    auto_renew: true,
    status: 'active',
    trial_end_date: null,
    reminder_days: [7, 3, 1],
    archived_at: null,
    ...partial,
  }
}

describe('reminderCandidates', () => {
  it('7 gün kala payment_due üretir (dedupe anahtarıyla)', () => {
    const out = reminderCandidates(sub({}), '2026-10-08')
    expect(out).toHaveLength(1)
    expect(out[0].type).toBe('payment_due')
    expect(out[0].dedupe_key).toBe('sub:sub-1:payment_due:2026-10-15:7')
    expect(out[0].title).toContain('7 gün sonra')
  })
  it('ödeme gününde 0 hatırlatması seçiliyse üretir', () => {
    const out = reminderCandidates(sub({ reminder_days: [0] }), '2026-10-15')
    expect(out).toHaveLength(1)
    expect(out[0].title).toContain('bugün')
  })
  it('eşleşmeyen günlerde üretmez', () => {
    expect(reminderCandidates(sub({}), '2026-10-10')).toHaveLength(0) // 5 gün kala
  })
  it('iptal/duraklatılmış/arşivli için üretmez', () => {
    expect(reminderCandidates(sub({ status: 'cancelled' }), '2026-10-08')).toHaveLength(0)
    expect(reminderCandidates(sub({ status: 'paused' }), '2026-10-08')).toHaveLength(0)
    expect(
      reminderCandidates(sub({ archived_at: '2026-01-01T00:00:00Z' }), '2026-10-08'),
    ).toHaveLength(0)
  })
  it('deneme bitişi için trial_ending üretir', () => {
    const out = reminderCandidates(
      sub({ status: 'trial', trial_end_date: '2026-10-12', reminder_days: [] }),
      '2026-10-11',
    )
    expect(out).toHaveLength(1)
    expect(out[0].type).toBe('trial_ending')
    expect(out[0].dedupe_key).toBe('sub:sub-1:trial_ending:2026-10-12:1')
  })
  it('aynı gün hem ödeme hem deneme bildirimi üretebilir', () => {
    const out = reminderCandidates(
      sub({ status: 'trial', trial_end_date: '2026-10-16', next_payment_date: '2026-10-16' }),
      '2026-10-15',
    )
    expect(out.map((o) => o.type).sort()).toEqual(['payment_due', 'trial_ending'])
  })
})

describe('rolloverAction', () => {
  it('vadesi gelmemişse dokunmaz', () => {
    expect(rolloverAction(sub({}), '2026-10-10')).toEqual({ kind: 'none' })
    expect(rolloverAction(sub({}), '2026-10-15')).toEqual({ kind: 'none' }) // tam vade günü
  })
  it('vadesi geçen otomatik yenilenen abonelik bir sonraki vadeye taşınır', () => {
    const action = rolloverAction(sub({ next_payment_date: '2026-10-15' }), '2026-10-20')
    expect(action).toEqual({ kind: 'advance', next_payment_date: '2026-11-15' })
  })
  it('çıpa korunur: 31 Oca başlangıçlı abonelik Mart sonunda 31 Mar olur', () => {
    const action = rolloverAction(
      sub({ start_date: '2026-01-31', next_payment_date: '2026-02-28' }),
      '2026-03-05',
    )
    expect(action).toEqual({ kind: 'advance', next_payment_date: '2026-03-31' })
  })
  it('otomatik yenilenmeyen vadesi geçmiş abonelik sona erer', () => {
    expect(
      rolloverAction(sub({ auto_renew: false, next_payment_date: '2026-10-01' }), '2026-10-11'),
    ).toEqual({ kind: 'expire' })
  })
  it('iptal edilmiş aboneliğe dokunmaz', () => {
    expect(
      rolloverAction(sub({ status: 'cancelled', next_payment_date: '2026-10-01' }), '2026-10-11'),
    ).toEqual({ kind: 'none' })
  })
})
