import {
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Plus,
  TrendingUp,
  WalletCards,
  Zap,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { CategoryIcon } from '@/components/app/category-icon'
import { MessageToast } from '@/components/app/message-toast'
import { SpendChart } from '@/components/app/spend-chart'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import {
  isCounted,
  monthlyEquivalent,
  monthlySpendHistory,
  priceChangePercent,
  totalsByCurrency,
} from '@/lib/cost'
import { diffDays, todayISO } from '@/lib/dates'
import { getAllPriceHistory, getSubscriptions } from '@/lib/data'
import {
  formatDate,
  formatDueLabel,
  formatMoney,
  formatMonthLabel,
  formatPercent,
} from '@/lib/format'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Genel Bakış — Abonelik Dedektifi' }

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat('tr-TR', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Europe/Istanbul',
    }).format(new Date()),
  )
  if (hour < 6) return 'İyi geceler'
  if (hour < 12) return 'Günaydın'
  if (hour < 18) return 'İyi günler'
  return 'İyi akşamlar'
}

function StatCard({
  title,
  value,
  note,
  icon: Icon,
  warn = false,
}: {
  title: string
  value: string
  note: string
  icon: React.ElementType
  warn?: boolean
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-medium text-[#718096]">{title}</p>
          <p className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-[#102a43]">
            {value}
          </p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-lg bg-[#eef8f5] text-[#0e7c66]">
          <Icon size={17} />
        </div>
      </div>
      <p
        className={`mt-3 text-[11px] font-medium ${warn ? 'text-[#d97706]' : 'text-[#94a3b8]'}`}
      >
        {note}
      </p>
    </Card>
  )
}

export default async function OverviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [subs, priceChanges, { data: profile }] = await Promise.all([
    getSubscriptions({ sort: 'next_payment_date' }),
    getAllPriceHistory(4),
    supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle(),
  ])

  const today = todayISO()
  const firstName =
    (profile?.full_name ?? '').split(/\s+/)[0] || user?.email?.split('@')[0] || ''

  const counted = subs.filter(isCounted)
  const totals = totalsByCurrency(subs)
  const primaryCurrency =
    totals.find((t) => t.currency === (profile?.default_currency ?? 'TRY'))?.currency ??
    totals[0]?.currency ??
    profile?.default_currency ??
    'TRY'
  const primary = totals.find((t) => t.currency === primaryCurrency)
  const otherTotals = totals.filter((t) => t.currency !== primaryCurrency)

  const upcoming = counted
    .map((s) => ({ sub: s, due: diffDays(today, s.next_payment_date) }))
    .filter((x) => x.due >= 0 && x.due <= 30)
    .sort((a, b) => a.due - b.due)
  const upcomingWeek = upcoming.filter((x) => x.due <= 7)

  // Son 12 ay tahmini gider serisi (birincil para birimi)
  const supabaseHistory = await (async () => {
    const { data } = await supabase
      .from('price_history')
      .select('subscription_id, old_amount, new_amount, changed_at')
      .order('changed_at', { ascending: true })
    const map = new Map<string, { old_amount: number; new_amount: number; changed_at: string }[]>()
    for (const h of data ?? []) {
      const list = map.get(h.subscription_id) ?? []
      list.push(h)
      map.set(h.subscription_id, list)
    }
    return map
  })()
  const allSubsForHistory = await getSubscriptions({ sort: 'created_at', dir: 'desc' })
  const spendSeries = monthlySpendHistory(
    allSubsForHistory,
    supabaseHistory,
    primaryCurrency,
    12,
    today,
  ).map((p) => ({ label: formatMonthLabel(p.month), value: p.total }))

  const topCosts = counted
    .filter((s) => s.currency === primaryCurrency)
    .map((s) => ({
      sub: s,
      monthly: monthlyEquivalent(s.amount, s.billing_cycle, s.custom_interval_days),
    }))
    .sort((a, b) => b.monthly - a.monthly)
    .slice(0, 3)
  const maxMonthly = topCosts[0]?.monthly ?? 1

  const todayLabel = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
    timeZone: 'Europe/Istanbul',
  }).format(new Date())

  return (
    <div>
      <Suspense>
        <MessageToast />
      </Suspense>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[12px] font-medium text-[#0e7c66]">{todayLabel}</p>
          <h1 className="mt-1.5 text-[25px] font-semibold tracking-[-0.04em] text-[#102a43]">
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-1 text-[13px] text-[#718096]">
            Abonelik harcamalarına genel bir bakış.
          </p>
        </div>
        <Link
          href="/app/abonelikler/yeni"
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0e7c66] px-4 text-[13px] font-semibold text-white shadow-[0_3px_8px_rgba(14,124,102,.2)] transition hover:bg-[#096b57]"
        >
          <Plus size={16} /> Abonelik Ekle
        </Link>
      </div>

      {subs.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={CreditCard}
            title="Henüz abonelik eklemediniz"
            description="Netflix, Spotify, yazılım araçları… Tüm aboneliklerinizi ekleyin; aylık ve yıllık giderlerinizi otomatik hesaplayalım, ödeme günlerinde hatırlatalım."
            actionLabel="İlk aboneliğini ekle"
            actionHref="/app/abonelikler/yeni"
          />
        </div>
      ) : (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Aktif Abonelikler"
              value={String(counted.length)}
              note={`${subs.length} kayıtlı abonelik`}
              icon={CreditCard}
            />
            <StatCard
              title="Aylık Toplam Gider"
              value={primary ? formatMoney(primary.monthly, primaryCurrency) : '—'}
              note={
                otherTotals.length
                  ? `+ ${otherTotals
                      .map((t) => formatMoney(t.monthly, t.currency))
                      .join(' + ')} (ayrı)`
                  : 'Tüm aktif abonelikler'
              }
              icon={WalletCards}
            />
            <StatCard
              title="Yıllık Tahmini Gider"
              value={primary ? formatMoney(primary.yearly, primaryCurrency) : '—'}
              note={
                otherTotals.length
                  ? `+ ${otherTotals
                      .map((t) => formatMoney(t.yearly, t.currency))
                      .join(' + ')} (ayrı)`
                  : 'Aylık gider × 12'
              }
              icon={TrendingUp}
            />
            <StatCard
              title="Yaklaşan Ödemeler"
              value={String(upcomingWeek.length)}
              note={upcomingWeek.length > 0 ? 'Önümüzdeki 7 gün içinde' : 'Bu hafta ödeme yok'}
              icon={CalendarDays}
              warn={upcomingWeek.length > 0}
            />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_1fr]">
            <Card className="min-w-0 p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold">Aylık gider değişimi</h2>
                  <p className="mt-1 text-[11px] text-[#94a3b8]">
                    Son 12 ay · {primaryCurrency} cinsinden tahmini
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <SpendChart data={spendSeries} currency={primaryCurrency} />
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold">Yaklaşan ödemeler</h2>
                  <p className="mt-1 text-[11px] text-[#94a3b8]">Önümüzdeki 30 gün</p>
                </div>
                <Link
                  href="/app/takvim"
                  className="text-[11px] font-medium text-[#0e7c66] hover:underline"
                >
                  Takvimi gör
                </Link>
              </div>
              {upcoming.length === 0 ? (
                <p className="mt-4 text-[12px] text-[#94a3b8]">
                  Önümüzdeki 30 gün içinde planlanmış ödeme yok.
                </p>
              ) : (
                <div className="mt-4 space-y-1">
                  {upcoming.slice(0, 5).map(({ sub, due }) => (
                    <Link
                      key={sub.id}
                      href={`/app/abonelikler/${sub.id}`}
                      className="flex items-center gap-3 rounded-lg px-1 py-2.5 transition hover:bg-[#f8faf9]"
                    >
                      <CategoryIcon icon={sub.category?.icon} color={sub.category?.color} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium">{sub.name}</p>
                        <p
                          className={`mt-0.5 text-[11px] ${
                            due <= 1 ? 'font-medium text-[#d97706]' : 'text-[#94a3b8]'
                          }`}
                        >
                          {formatDueLabel(due)} · {formatDate(sub.next_payment_date)}
                        </p>
                      </div>
                      <p className="text-[12px] font-semibold">
                        {formatMoney(sub.amount, sub.currency)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_1fr]">
            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold">Son fiyat değişiklikleri</h2>
                  <p className="mt-1 text-[11px] text-[#94a3b8]">
                    Aboneliklerinizdeki güncellemeler
                  </p>
                </div>
                <Link
                  href="/app/analizler"
                  className="text-[11px] font-medium text-[#0e7c66] hover:underline"
                >
                  Tümünü gör
                </Link>
              </div>
              {priceChanges.length === 0 ? (
                <p className="mt-4 text-[12px] text-[#94a3b8]">
                  Henüz fiyat değişikliği kaydı yok. Bir aboneliğin tutarını
                  güncellediğinizde burada görünür.
                </p>
              ) : (
                <div className="mt-4 divide-y divide-[#edf1f0]">
                  {priceChanges.map((h) => {
                    const pct = priceChangePercent(h.old_amount, h.new_amount)
                    const up = h.new_amount > h.old_amount
                    return (
                      <div key={h.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        <div
                          className={`flex size-8 items-center justify-center rounded-lg ${
                            up ? 'bg-[#fff7e8] text-[#c27808]' : 'bg-[#eaf7f3] text-[#0e7c66]'
                          }`}
                        >
                          <ArrowUpRight size={15} className={up ? '' : 'rotate-90'} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-medium">
                            {h.subscription?.name ?? 'Silinmiş abonelik'}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#94a3b8]">
                            {up ? 'Fiyat artışı' : 'Fiyat indirimi'}
                            {h.note ? ` · ${h.note}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-[#94a3b8] line-through">
                            {formatMoney(h.old_amount, h.currency)}
                          </p>
                          <p
                            className={`text-[12px] font-semibold ${
                              up ? 'text-[#d97706]' : 'text-[#0e7c66]'
                            }`}
                          >
                            {formatMoney(h.new_amount, h.currency)}
                          </p>
                        </div>
                        {pct !== null && (
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                              up
                                ? 'bg-[#fff7e8] text-[#c27808]'
                                : 'bg-[#eaf7f3] text-[#0e7c66]'
                            }`}
                          >
                            {formatPercent(pct)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold">En yüksek maliyetliler</h2>
                  <p className="mt-1 text-[11px] text-[#94a3b8]">
                    Aylık bazda · {primaryCurrency}
                  </p>
                </div>
                <Link
                  href="/app/analizler"
                  className="text-[11px] font-medium text-[#0e7c66] hover:underline"
                >
                  Detaylar
                </Link>
              </div>
              {topCosts.length === 0 ? (
                <p className="mt-4 text-[12px] text-[#94a3b8]">
                  Bu para biriminde aktif abonelik yok.
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  {topCosts.map(({ sub, monthly }) => (
                    <div key={sub.id}>
                      <div className="mb-1.5 flex justify-between text-[11px]">
                        <span className="font-medium">{sub.name}</span>
                        <span className="font-semibold">
                          {formatMoney(monthly, primaryCurrency)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#edf3f1]">
                        <div
                          className="h-full rounded-full bg-[#0e9871]"
                          style={{ width: `${Math.max(6, (monthly / maxMonthly) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-[#c9ded7] bg-[#f4fbf8] px-4 py-3 text-[11px] text-[#5f7d73]">
            <Zap size={15} className="shrink-0 text-[#0e9871]" />
            <span>
              <strong className="font-semibold text-[#38675b]">İpucu:</strong>{' '}
              Harcamalarınızı kategorilere ayırarak tasarruf fırsatlarını daha kolay
              keşfedin.
            </span>
            <Link
              href="/app/kategoriler"
              className="ml-auto shrink-0 font-semibold text-[#0e7c66] hover:underline"
            >
              Keşfet
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
