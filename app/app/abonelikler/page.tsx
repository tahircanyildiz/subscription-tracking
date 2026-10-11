import { CreditCard, Plus, SearchX } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { CategoryIcon } from '@/components/app/category-icon'
import { MessageToast } from '@/components/app/message-toast'
import { SubscriptionFilters } from '@/components/app/subscription-filters'
import { StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { monthlyEquivalent } from '@/lib/cost'
import { diffDays, todayISO } from '@/lib/dates'
import { getCategories, getSubscriptions } from '@/lib/data'
import { formatDate, formatDueLabel, formatMoney } from '@/lib/format'
import { BILLING_CYCLE_LABELS } from '@/lib/schemas'

export const metadata: Metadata = { title: 'Abonelikler — Abonelik Dedektifi' }

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    kategori?: string
    durum?: string
    sirala?: string
    arsiv?: string
  }>
}) {
  const params = await searchParams
  const [subs, categories] = await Promise.all([
    getSubscriptions({
      q: params.q,
      categoryId: params.kategori,
      status: params.durum,
      sort: (['name', 'amount', 'next_payment_date', 'created_at'].includes(
        params.sirala ?? '',
      )
        ? params.sirala
        : 'next_payment_date') as 'name' | 'amount' | 'next_payment_date' | 'created_at',
      dir: params.sirala === 'amount' || params.sirala === 'created_at' ? 'desc' : 'asc',
      archived: params.arsiv === '1',
    }),
    getCategories(),
  ])
  const today = todayISO()
  const hasFilters = Boolean(params.q || params.kategori || params.durum)

  return (
    <div>
      <Suspense>
        <MessageToast />
      </Suspense>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.04em] text-[#102a43]">
            Abonelikler
          </h1>
          <p className="mt-1 text-[13px] text-[#718096]">
            {params.arsiv === '1'
              ? 'Arşivlenmiş abonelikleriniz.'
              : 'Tüm aboneliklerinizi görüntüleyin ve yönetin.'}
          </p>
        </div>
        <Link
          href="/app/abonelikler/yeni"
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0e7c66] px-4 text-[13px] font-semibold text-white shadow-[0_3px_8px_rgba(14,124,102,.2)] transition hover:bg-[#096b57]"
        >
          <Plus size={16} /> Abonelik Ekle
        </Link>
      </div>

      <div className="mt-6">
        <Suspense>
          <SubscriptionFilters categories={categories} />
        </Suspense>
      </div>

      <div className="mt-4">
        {subs.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="Sonuç bulunamadı"
              description="Arama veya filtre ölçütlerinize uyan abonelik yok. Filtreleri temizleyip tekrar deneyin."
              actionLabel="Filtreleri temizle"
              actionHref="/app/abonelikler"
            />
          ) : params.arsiv === '1' ? (
            <EmptyState
              icon={CreditCard}
              title="Arşiv boş"
              description="Henüz arşivlenmiş bir aboneliğiniz yok."
            />
          ) : (
            <EmptyState
              icon={CreditCard}
              title="Henüz abonelik yok"
              description="İlk aboneliğinizi ekleyin; ödeme tarihlerinizi ve harcamalarınızı sizin için takip edelim."
              actionLabel="İlk aboneliğini ekle"
              actionHref="/app/abonelikler/yeni"
            />
          )
        ) : (
          <Card>
            <ul className="divide-y divide-[#edf1f0]">
              {subs.map((sub) => {
                const due = diffDays(today, sub.next_payment_date)
                const counted = ['active', 'trial'].includes(sub.status) && !sub.archived_at
                return (
                  <li key={sub.id}>
                    <Link
                      href={`/app/abonelikler/${sub.id}`}
                      className="flex items-center gap-3.5 px-4 py-3.5 transition hover:bg-[#f8faf9] sm:px-5"
                    >
                      <CategoryIcon icon={sub.category?.icon} color={sub.category?.color} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[13px] font-semibold text-[#102a43]">
                            {sub.name}
                          </p>
                          <StatusBadge status={sub.status} />
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-[#94a3b8]">
                          {[
                            sub.category?.name ?? 'Kategorisiz',
                            BILLING_CYCLE_LABELS[sub.billing_cycle],
                            sub.provider,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-[11px] text-[#94a3b8]">Sonraki ödeme</p>
                        <p className="mt-0.5 text-[12px] font-medium text-[#4a5568]">
                          {counted ? (
                            <>
                              {formatDate(sub.next_payment_date)}
                              <span
                                className={`ml-1.5 ${due <= 3 ? 'text-[#d97706]' : 'text-[#94a3b8]'}`}
                              >
                                ({formatDueLabel(due)})
                              </span>
                            </>
                          ) : (
                            '—'
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-semibold text-[#102a43]">
                          {formatMoney(sub.amount, sub.currency)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#94a3b8]">
                          {sub.billing_cycle === 'monthly'
                            ? 'aylık'
                            : `≈ ${formatMoney(
                                monthlyEquivalent(
                                  sub.amount,
                                  sub.billing_cycle,
                                  sub.custom_interval_days,
                                ),
                                sub.currency,
                              )}/ay`}
                        </p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
      </div>
      {subs.length > 0 && (
        <p className="mt-3 text-right text-[11px] text-[#a0aec0]">
          {subs.length} abonelik görüntüleniyor
        </p>
      )}
    </div>
  )
}
