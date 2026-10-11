import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { CategoryDot } from '@/components/app/category-icon'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { isCounted } from '@/lib/cost'
import {
  addMonthsClamped,
  diffDays,
  firstOfMonth,
  lastOfMonth,
  occurrencesInRange,
  todayISO,
} from '@/lib/dates'
import { getSubscriptions, type SubscriptionWithCategory } from '@/lib/data'
import { formatDate, formatMoney } from '@/lib/format'

export const metadata: Metadata = { title: 'Ödeme Takvimi — Abonelik Dedektifi' }

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

interface DayPayment {
  sub: SubscriptionWithCategory
  date: string
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ ay?: string }>
}) {
  const params = await searchParams
  const today = todayISO()
  const monthAnchor =
    params.ay && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.ay) ? `${params.ay}-01` : firstOfMonth(today)
  const monthStart = firstOfMonth(monthAnchor)
  const monthEnd = lastOfMonth(monthAnchor)

  const subs = (await getSubscriptions({})).filter(isCounted)

  // Ay içindeki tüm ödeme günleri (başlangıca çıpalı seriden)
  const byDay = new Map<string, DayPayment[]>()
  const monthPayments: DayPayment[] = []
  for (const sub of subs) {
    const dates = occurrencesInRange(
      sub.start_date,
      sub.billing_cycle,
      sub.custom_interval_days,
      monthStart,
      monthEnd,
    )
    for (const date of dates) {
      const entry = { sub, date }
      monthPayments.push(entry)
      const list = byDay.get(date) ?? []
      list.push(entry)
      byDay.set(date, list)
    }
  }
  monthPayments.sort((a, b) => a.date.localeCompare(b.date) || a.sub.name.localeCompare(b.sub.name))

  // Ay toplamları (para birimine göre ayrı)
  const monthTotals = new Map<string, number>()
  for (const p of monthPayments) {
    monthTotals.set(p.sub.currency, (monthTotals.get(p.sub.currency) ?? 0) + p.sub.amount)
  }

  // Takvim ızgarası (Pazartesi başlangıçlı)
  const firstDow = (new Date(`${monthStart}T00:00:00Z`).getUTCDay() + 6) % 7
  const daysCount = Number(monthEnd.slice(8, 10))
  const cells: (string | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysCount }, (_, i) =>
      `${monthStart.slice(0, 8)}${String(i + 1).padStart(2, '0')}`,
    ),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const prevMonth = addMonthsClamped(monthStart, -1).slice(0, 7)
  const nextMonth = addMonthsClamped(monthStart, 1).slice(0, 7)
  const monthLabel = new Intl.DateTimeFormat('tr-TR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${monthStart}T00:00:00Z`))

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.04em] text-[#102a43]">
            Ödeme Takvimi
          </h1>
          <p className="mt-1 text-[13px] text-[#718096]">
            Aboneliklerinizin ödeme günlerini aylık görünümde inceleyin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/app/takvim?ay=${prevMonth}`}
            aria-label="Önceki ay"
            className="flex size-9 items-center justify-center rounded-lg border border-[#e6ecea] text-[#4a5568] transition hover:bg-[#f5f8f7]"
          >
            <ChevronLeft size={16} />
          </Link>
          <span className="min-w-[140px] text-center text-[13px] font-semibold capitalize text-[#102a43]">
            {monthLabel}
          </span>
          <Link
            href={`/app/takvim?ay=${nextMonth}`}
            aria-label="Sonraki ay"
            className="flex size-9 items-center justify-center rounded-lg border border-[#e6ecea] text-[#4a5568] transition hover:bg-[#f5f8f7]"
          >
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {subs.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={CalendarDays}
            title="Takvim boş"
            description="Aktif aboneliğiniz olmadığı için gösterilecek ödeme yok. Abonelik ekleyince ödeme günleri burada görünür."
            actionLabel="Abonelik ekle"
            actionHref="/app/abonelikler/yeni"
          />
        </div>
      ) : (
        <>
          <Card className="mt-6 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-[#edf1f0] bg-[#f8faf9]">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((date, i) => {
                const payments = date ? (byDay.get(date) ?? []) : []
                const isToday = date === today
                return (
                  <div
                    key={i}
                    className={`min-h-[72px] border-b border-r border-[#edf1f0] p-1.5 sm:min-h-[92px] sm:p-2 ${
                      date ? '' : 'bg-[#fafcfb]'
                    } [&:nth-child(7n)]:border-r-0`}
                  >
                    {date && (
                      <>
                        <span
                          className={`inline-flex size-6 items-center justify-center rounded-full text-[11px] font-medium ${
                            isToday ? 'bg-[#0e7c66] text-white' : 'text-[#4a5568]'
                          }`}
                        >
                          {Number(date.slice(8, 10))}
                        </span>
                        <div className="mt-1 space-y-1">
                          {payments.slice(0, 2).map((p) => (
                            <Link
                              key={`${p.sub.id}-${p.date}`}
                              href={`/app/abonelikler/${p.sub.id}`}
                              title={`${p.sub.name} — ${formatMoney(p.sub.amount, p.sub.currency)}`}
                              className="flex items-center gap-1.5 rounded bg-[#eaf7f3] px-1.5 py-1 text-[10px] font-medium text-[#08785f] transition hover:bg-[#dff2ec]"
                            >
                              <CategoryDot color={p.sub.category?.color} />
                              <span className="hidden truncate sm:inline">{p.sub.name}</span>
                              <span className="truncate sm:hidden">
                                {p.sub.name.slice(0, 6)}
                              </span>
                            </Link>
                          ))}
                          {payments.length > 2 && (
                            <p className="px-1 text-[10px] text-[#94a3b8]">
                              +{payments.length - 2} daha
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
            <Card className="p-5">
              <h2 className="text-[14px] font-semibold">Bu aydaki ödemeler</h2>
              {monthPayments.length === 0 ? (
                <p className="mt-3 text-[12px] text-[#94a3b8]">
                  Bu ay planlanmış ödeme yok.
                </p>
              ) : (
                <div className="mt-3 divide-y divide-[#edf1f0]">
                  {monthPayments.map((p) => {
                    const past = diffDays(p.date, today) > 0
                    return (
                      <Link
                        key={`${p.sub.id}-${p.date}`}
                        href={`/app/abonelikler/${p.sub.id}`}
                        className={`flex items-center gap-3 py-2.5 transition hover:bg-[#f8faf9] ${
                          past ? 'opacity-55' : ''
                        }`}
                      >
                        <CategoryDot color={p.sub.category?.color} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-medium">{p.sub.name}</p>
                          <p className="mt-0.5 text-[11px] text-[#94a3b8]">
                            {formatDate(p.date)}
                            {p.date === today ? ' · Bugün' : past ? ' · Geçti' : ''}
                          </p>
                        </div>
                        <p className="text-[12px] font-semibold">
                          {formatMoney(p.sub.amount, p.sub.currency)}
                        </p>
                      </Link>
                    )
                  })}
                </div>
              )}
            </Card>
            <Card className="h-fit p-5">
              <h2 className="text-[14px] font-semibold">Ay toplamı</h2>
              {monthTotals.size === 0 ? (
                <p className="mt-3 text-[12px] text-[#94a3b8]">—</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {[...monthTotals.entries()].map(([currency, total]) => (
                    <div key={currency} className="flex items-center justify-between">
                      <span className="text-[12px] text-[#718096]">{currency}</span>
                      <span className="text-[14px] font-semibold text-[#102a43]">
                        {formatMoney(total, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 border-t border-[#edf1f0] pt-3 text-[11px] leading-relaxed text-[#94a3b8]">
                {monthPayments.length} ödeme · Farklı para birimleri kur verisi olmadan
                toplanmaz.
              </p>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
