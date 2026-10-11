'use client'

import Link from 'next/link'
import { useActionState, useMemo, useState } from 'react'

import type { ActionState } from '@/app/actions/auth'
import { SubmitButton } from '@/components/auth/submit-button'
import {
  Checkbox,
  FieldError,
  FormMessage,
  Input,
  Label,
  Select,
  Textarea,
} from '@/components/ui/field'
import { nextPaymentOnOrAfter, todayISO } from '@/lib/dates'
import {
  BILLING_CYCLES,
  BILLING_CYCLE_LABELS,
  CURRENCIES,
  REMINDER_DAY_OPTIONS,
  STATUSES,
  STATUS_LABELS,
} from '@/lib/schemas'
import type { BillingCycle, Category, Subscription, SubscriptionStatus } from '@/lib/supabase/types'

const REMINDER_LABELS: Record<number, string> = {
  7: '7 gün önce',
  3: '3 gün önce',
  1: '1 gün önce',
  0: 'Ödeme günü',
}

export function SubscriptionForm({
  categories,
  subscription,
  action,
  cancelHref,
}: {
  categories: Category[]
  subscription?: Subscription
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  cancelHref: string
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {})
  const isEdit = Boolean(subscription)

  const [cycle, setCycle] = useState<BillingCycle>(subscription?.billing_cycle ?? 'monthly')
  const [status, setStatus] = useState<SubscriptionStatus>(subscription?.status ?? 'active')
  const [startDate, setStartDate] = useState(subscription?.start_date ?? todayISO())
  const [nextDate, setNextDate] = useState(subscription?.next_payment_date ?? '')
  const [nextTouched, setNextTouched] = useState(isEdit)
  const [customDays, setCustomDays] = useState(
    subscription?.custom_interval_days?.toString() ?? '',
  )
  const [amount, setAmount] = useState(subscription?.amount?.toString() ?? '')

  const amountChanged = isEdit && amount !== '' && Number(amount) !== subscription!.amount

  // Kullanıcı elle değiştirmediyse sonraki ödeme tarihini öner
  const suggestedNext = useMemo(() => {
    try {
      if (!startDate) return ''
      const days = cycle === 'custom' ? Number(customDays) || null : null
      if (cycle === 'custom' && !days) return ''
      return nextPaymentOnOrAfter(startDate, cycle, days, todayISO())
    } catch {
      return ''
    }
  }, [startDate, cycle, customDays])

  const nextValue = nextTouched ? nextDate : suggestedNext

  const defaultReminders = subscription?.reminder_days ?? [7, 3, 1]

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormMessage error={state.error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Abonelik adı *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={subscription?.name}
            placeholder="Netflix, Spotify…"
            className="mt-1.5"
            required
          />
          <FieldError message={state.fieldErrors?.name} />
        </div>
        <div>
          <Label htmlFor="provider">Sağlayıcı</Label>
          <Input
            id="provider"
            name="provider"
            defaultValue={subscription?.provider ?? ''}
            placeholder="Netflix Inc."
            className="mt-1.5"
          />
          <FieldError message={state.fieldErrors?.provider} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="category_id">Kategori</Label>
          <Select
            id="category_id"
            name="category_id"
            defaultValue={subscription?.category_id ?? ''}
            className="mt-1.5"
          >
            <option value="">Kategorisiz</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <FieldError message={state.fieldErrors?.category_id} />
        </div>
        <div>
          <Label htmlFor="status">Durum</Label>
          <Select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
            className="mt-1.5"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
          <FieldError message={state.fieldErrors?.status} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="amount">Tutar *</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="229.99"
            className="mt-1.5"
            required
          />
          <FieldError message={state.fieldErrors?.amount} />
        </div>
        <div>
          <Label htmlFor="currency">Para birimi *</Label>
          <Select
            id="currency"
            name="currency"
            defaultValue={subscription?.currency ?? 'TRY'}
            className="mt-1.5"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <FieldError message={state.fieldErrors?.currency} />
        </div>
      </div>

      {amountChanged && (
        <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-3.5">
          <p className="text-[12px] font-medium text-[#92400e]">
            Tutar değişikliği fiyat geçmişine kaydedilecek.
          </p>
          <Label htmlFor="price_note" className="mt-2.5">
            Değişiklik notu (isteğe bağlı)
          </Label>
          <Input
            id="price_note"
            name="price_note"
            placeholder="Örn. yıllık zam"
            className="mt-1.5 bg-white"
            maxLength={500}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="billing_cycle">Faturalandırma sıklığı *</Label>
          <Select
            id="billing_cycle"
            name="billing_cycle"
            value={cycle}
            onChange={(e) => setCycle(e.target.value as BillingCycle)}
            className="mt-1.5"
          >
            {BILLING_CYCLES.map((c) => (
              <option key={c} value={c}>
                {BILLING_CYCLE_LABELS[c]}
              </option>
            ))}
          </Select>
          <FieldError message={state.fieldErrors?.billing_cycle} />
        </div>
        {cycle === 'custom' && (
          <div>
            <Label htmlFor="custom_interval_days">Kaç günde bir? *</Label>
            <Input
              id="custom_interval_days"
              name="custom_interval_days"
              type="number"
              min="1"
              max="3650"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              placeholder="45"
              className="mt-1.5"
            />
            <FieldError message={state.fieldErrors?.custom_interval_days} />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="start_date">Başlangıç tarihi *</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1.5"
            required
          />
          <FieldError message={state.fieldErrors?.start_date} />
        </div>
        <div>
          <Label htmlFor="next_payment_date">Sonraki ödeme tarihi *</Label>
          <Input
            id="next_payment_date"
            name="next_payment_date"
            type="date"
            value={nextValue}
            onChange={(e) => {
              setNextTouched(true)
              setNextDate(e.target.value)
            }}
            className="mt-1.5"
            required
          />
          <FieldError message={state.fieldErrors?.next_payment_date} />
        </div>
      </div>

      {status === 'trial' && (
        <div className="sm:max-w-[calc(50%-0.5rem)]">
          <Label htmlFor="trial_end_date">Deneme süresi bitişi *</Label>
          <Input
            id="trial_end_date"
            name="trial_end_date"
            type="date"
            defaultValue={subscription?.trial_end_date ?? ''}
            className="mt-1.5"
          />
          <FieldError message={state.fieldErrors?.trial_end_date} />
        </div>
      )}

      <div>
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={subscription?.description ?? ''}
          placeholder="Not eklemek isterseniz…"
          className="mt-1.5"
        />
        <FieldError message={state.fieldErrors?.description} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="text-[12px] font-medium text-[#4a5568]">
            Hatırlatma tercihleri
          </legend>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
            {REMINDER_DAY_OPTIONS.map((d) => (
              <label key={d} className="flex items-center gap-2 text-[12px] text-[#4a5568]">
                <Checkbox
                  name="reminder_days"
                  value={d}
                  defaultChecked={defaultReminders.includes(d)}
                />
                {REMINDER_LABELS[d]}
              </label>
            ))}
          </div>
          <FieldError message={state.fieldErrors?.reminder_days} />
        </fieldset>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-[12px] font-medium text-[#4a5568]">
            <Checkbox name="auto_renew" defaultChecked={subscription?.auto_renew ?? true} />
            Otomatik yenilenir
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-[#edf1f0] pt-5">
        <SubmitButton className="w-auto px-5">
          {isEdit ? 'Değişiklikleri Kaydet' : 'Abonelik Ekle'}
        </SubmitButton>
        <Link
          href={cancelHref}
          className="flex h-10 items-center rounded-lg border border-[#e6ecea] px-4 text-[13px] font-semibold text-[#4a5568] transition hover:bg-[#f5f8f7]"
        >
          Vazgeç
        </Link>
      </div>
    </form>
  )
}
