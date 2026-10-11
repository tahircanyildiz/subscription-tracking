import { ArrowDownRight, ArrowLeft, ArrowUpRight, History } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { CategoryIcon } from '@/components/app/category-icon'
import { MessageToast } from '@/components/app/message-toast'
import { SubscriptionActions } from '@/components/app/subscription-actions'
import { StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { monthlyEquivalent, priceChangePercent, yearlyEquivalent } from '@/lib/cost'
import { diffDays, todayISO } from '@/lib/dates'
import { getPriceHistory, getSubscription } from '@/lib/data'
import {
  formatDate,
  formatDateTime,
  formatDueLabel,
  formatMoney,
  formatPercent,
} from '@/lib/format'
import { BILLING_CYCLE_LABELS } from '@/lib/schemas'

export const metadata: Metadata = { title: 'Abonelik Detayı — Abonelik Dedektifi' }

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-[12px] text-[#718096]">{label}</span>
      <span className="text-right text-[12px] font-medium text-[#102a43]">{value}</span>
    </div>
  )
}

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const sub = await getSubscription(id)
  if (!sub) notFound()
  const history = await getPriceHistory(id)

  const today = todayISO()
  const due = diffDays(today, sub.next_payment_date)
  const counted = ['active', 'trial'].includes(sub.status) && !sub.archived_at

  return (
    <div className="mx-auto max-w-3xl">
      <Suspense>
        <MessageToast />
      </Suspense>
      <Link
        href="/app/abonelikler"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#718096] hover:text-[#102a43]"
      >
        <ArrowLeft size={14} /> Aboneliklere dön
      </Link>

      <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-3.5">
          <CategoryIcon icon={sub.category?.icon} color={sub.category?.color} size={18} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-semibold tracking-[-0.04em] text-[#102a43]">
                {sub.name}
              </h1>
              <StatusBadge status={sub.status} />
              {sub.archived_at && (
                <span className="rounded-full bg-[#f1f5f9] px-2 py-1 text-[10px] font-medium text-[#64748b]">
                  Arşivde
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[13px] text-[#718096]">
              {[sub.provider, sub.category?.name ?? 'Kategorisiz'].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <SubscriptionActions subscription={sub} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[11px] font-medium text-[#718096]">
            {BILLING_CYCLE_LABELS[sub.billing_cycle]} tutar
          </p>
          <p className="mt-1.5 text-[20px] font-semibold tracking-[-0.03em] text-[#102a43]">
            {formatMoney(sub.amount, sub.currency)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium text-[#718096]">Aylık eşdeğer</p>
          <p className="mt-1.5 text-[20px] font-semibold tracking-[-0.03em] text-[#102a43]">
            {formatMoney(
              monthlyEquivalent(sub.amount, sub.billing_cycle, sub.custom_interval_days),
              sub.currency,
            )}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium text-[#718096]">Yıllık eşdeğer</p>
          <p className="mt-1.5 text-[20px] font-semibold tracking-[-0.03em] text-[#102a43]">
            {formatMoney(
              yearlyEquivalent(sub.amount, sub.billing_cycle, sub.custom_interval_days),
              sub.currency,
            )}
          </p>
        </Card>
      </div>

      <Card className="mt-4 px-5 py-2">
        <div className="divide-y divide-[#edf1f0]">
          <InfoRow label="Başlangıç tarihi" value={formatDate(sub.start_date)} />
          <InfoRow
            label="Sonraki ödeme"
            value={
              counted ? (
                <>
                  {formatDate(sub.next_payment_date)}{' '}
                  <span className={due <= 3 ? 'text-[#d97706]' : 'text-[#94a3b8]'}>
                    ({formatDueLabel(due)})
                  </span>
                </>
              ) : (
                '—'
              )
            }
          />
          <InfoRow
            label="Faturalandırma"
            value={
              sub.billing_cycle === 'custom'
                ? `Her ${sub.custom_interval_days} günde bir`
                : BILLING_CYCLE_LABELS[sub.billing_cycle]
            }
          />
          <InfoRow label="Otomatik yenileme" value={sub.auto_renew ? 'Açık' : 'Kapalı'} />
          {sub.trial_end_date && (
            <InfoRow label="Deneme süresi bitişi" value={formatDate(sub.trial_end_date)} />
          )}
          {sub.cancelled_at && (
            <InfoRow label="İptal tarihi" value={formatDateTime(sub.cancelled_at)} />
          )}
          <InfoRow
            label="Hatırlatmalar"
            value={
              sub.reminder_days.length
                ? [...sub.reminder_days]
                    .sort((a, b) => b - a)
                    .map((d) => (d === 0 ? 'Ödeme günü' : `${d} gün önce`))
                    .join(', ')
                : 'Kapalı'
            }
          />
          {sub.description && <InfoRow label="Açıklama" value={sub.description} />}
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <div className="flex items-center gap-2">
          <History size={15} className="text-[#718096]" />
          <h2 className="text-[14px] font-semibold text-[#102a43]">Fiyat geçmişi</h2>
        </div>
        {history.length === 0 ? (
          <p className="mt-3 text-[12px] text-[#94a3b8]">
            Henüz fiyat değişikliği kaydı yok. Tutarı güncellediğinizde eski fiyat burada
            görünür.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-[#edf1f0]">
            {history.map((h) => {
              const pct = priceChangePercent(h.old_amount, h.new_amount)
              const up = h.new_amount > h.old_amount
              return (
                <div key={h.id} className="flex items-center gap-3 py-3">
                  <div
                    className={`flex size-7 items-center justify-center rounded-lg ${
                      up ? 'bg-[#fff7e8] text-[#c27808]' : 'bg-[#eaf7f3] text-[#0e7c66]'
                    }`}
                  >
                    {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-[#102a43]">
                      <span className="text-[#94a3b8] line-through">
                        {formatMoney(h.old_amount, h.currency)}
                      </span>{' '}
                      → {formatMoney(h.new_amount, h.currency)}
                      {pct !== null && (
                        <span className={`ml-1.5 ${up ? 'text-[#c27808]' : 'text-[#0e7c66]'}`}>
                          {formatPercent(pct)}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#94a3b8]">
                      {formatDateTime(h.changed_at)}
                      {h.note ? ` · ${h.note}` : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
