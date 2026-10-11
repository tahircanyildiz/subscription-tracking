import { Activity, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { CategoryChart } from '@/components/app/category-chart'
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
import { todayISO } from '@/lib/dates'
import { getAllPriceHistory, getSubscriptions } from '@/lib/data'
import { formatDateTime, formatMoney, formatMonthLabel, formatPercent } from '@/lib/format'
import { BILLING_CYCLE_LABELS } from '@/lib/schemas'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Analizler — Abonelik Dedektifi' }

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [subs, priceChanges, { data: profile }, { data: rawHistory }] = await Promise.all([
    getSubscriptions({}),
    getAllPriceHistory(50),
    supabase.from('profiles').select('default_currency').eq('id', user!.id).maybeSingle(),
    supabase
      .from('price_history')
      .select('subscription_id, old_amount, new_amount, changed_at')
      .order('changed_at', { ascending: true }),
  ])

  const today = todayISO()
  const counted = subs.filter(isCounted)
  const totals = totalsByCurrency(subs)
  const primaryCurrency =
    totals.find((t) => t.currency === (profile?.default_currency ?? 'TRY'))?.currency ??
    totals[0]?.currency ??
    'TRY'

  if (subs.length === 0) {
    return (
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.04em] text-[#102a43]">
          Analizler
        </h1>
        <div className="mt-6">
          <EmptyState
            icon={Activity}
            title="Analiz için veri yok"
            description="Abonelik ekledikçe kategori dağılımı, gider trendi ve fiyat değişimleri burada görünür."
            actionLabel="Abonelik ekle"
            actionHref="/app/abonelikler/yeni"
          />
        </div>
      </div>
    )
  }

  // Kategori dağılımı (birincil para birimi, aylık eşdeğer)
  const byCategory = new Map<string, { name: string; value: number; color: string }>()
  for (const sub of counted) {
    if (sub.currency !== primaryCurrency) continue
    const key = sub.category?.id ?? 'none'
    const entry = byCategory.get(key) ?? {
      name: sub.category?.name ?? 'Kategorisiz',
      value: 0,
      color: sub.category?.color ?? '#94a3b8',
    }
    entry.value += monthlyEquivalent(sub.amount, sub.billing_cycle, sub.custom_interval_days)
    byCategory.set(key, entry)
  }
  const categoryData = [...byCategory.values()]
    .map((c) => ({ ...c, value: Math.round(c.value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
  const categoryTotal = categoryData.reduce((acc, c) => acc + c.value, 0)

  // Döngü dağılımı
  const byCycle = new Map<string, number>()
  for (const sub of counted) byCycle.set(sub.billing_cycle, (byCycle.get(sub.billing_cycle) ?? 0) + 1)

  // 12 aylık seri
  const historyMap = new Map<
    string,
    { old_amount: number; new_amount: number; changed_at: string }[]
  >()
  for (const h of rawHistory ?? []) {
    const list = historyMap.get(h.subscription_id) ?? []
    list.push(h)
    historyMap.set(h.subscription_id, list)
  }
  const spendSeries = monthlySpendHistory(subs, historyMap, primaryCurrency, 12, today).map(
    (p) => ({ label: formatMonthLabel(p.month), value: p.total }),
  )

  return (
    <div>
      <h1 className="text-[22px] font-semibold tracking-[-0.04em] text-[#102a43]">Analizler</h1>
      <p className="mt-1 text-[13px] text-[#718096]">
        Harcama dağılımınız ve fiyat değişimleriniz.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {totals.map((t) => (
          <Card key={t.currency} className="p-5">
            <p className="text-[12px] font-medium text-[#718096]">
              {t.currency} · {t.count} abonelik
            </p>
            <p className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-[#102a43]">
              {formatMoney(t.monthly, t.currency)}
              <span className="text-[12px] font-medium text-[#94a3b8]"> /ay</span>
            </p>
            <p className="mt-1 text-[11px] text-[#94a3b8]">
              Yıllık: {formatMoney(t.yearly, t.currency)}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.45fr]">
        <Card className="p-5 sm:p-6">
          <h2 className="text-[14px] font-semibold">Kategori dağılımı</h2>
          <p className="mt-1 text-[11px] text-[#94a3b8]">
            Aylık eşdeğer · {primaryCurrency}
          </p>
          {categoryData.length === 0 ? (
            <p className="mt-4 text-[12px] text-[#94a3b8]">
              Bu para biriminde aktif abonelik yok.
            </p>
          ) : (
            <>
              <CategoryChart data={categoryData} currency={primaryCurrency} />
              <div className="mt-2 space-y-2">
                {categoryData.map((c) => (
                  <div key={c.name} className="flex items-center gap-2.5">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="flex-1 text-[12px] text-[#4a5568]">{c.name}</span>
                    <span className="text-[12px] font-semibold text-[#102a43]">
                      {formatMoney(c.value, primaryCurrency)}
                    </span>
                    <span className="w-12 text-right text-[11px] text-[#94a3b8]">
                      {categoryTotal > 0
                        ? `%${((c.value / categoryTotal) * 100).toLocaleString('tr-TR', {
                            maximumFractionDigits: 0,
                          })}`
                        : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="min-w-0 p-5 sm:p-6">
            <h2 className="text-[14px] font-semibold">Aylık gider değişimi</h2>
            <p className="mt-1 text-[11px] text-[#94a3b8]">
              Son 12 ay · {primaryCurrency} cinsinden tahmini
            </p>
            <div className="mt-4">
              <SpendChart data={spendSeries} currency={primaryCurrency} />
            </div>
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="text-[14px] font-semibold">Faturalandırma dağılımı</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {[...byCycle.entries()].map(([cycle, count]) => (
                <span
                  key={cycle}
                  className="rounded-full bg-[#eaf7f3] px-3 py-1.5 text-[11px] font-medium text-[#08785f]"
                >
                  {BILLING_CYCLE_LABELS[cycle as keyof typeof BILLING_CYCLE_LABELS]}: {count}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-4 p-5 sm:p-6">
        <h2 className="text-[14px] font-semibold">Fiyat değişiklikleri</h2>
        <p className="mt-1 text-[11px] text-[#94a3b8]">Tüm abonelikler · son 50 kayıt</p>
        {priceChanges.length === 0 ? (
          <p className="mt-4 text-[12px] text-[#94a3b8]">
            Henüz fiyat değişikliği kaydı yok. Bir aboneliğin tutarını güncellediğinizde
            eski ve yeni fiyat burada listelenir.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-[#edf1f0]">
            {priceChanges.map((h) => {
              const pct = priceChangePercent(h.old_amount, h.new_amount)
              const up = h.new_amount > h.old_amount
              return (
                <div key={h.id} className="flex items-center gap-3 py-3">
                  <div
                    className={`flex size-8 items-center justify-center rounded-lg ${
                      up ? 'bg-[#fff7e8] text-[#c27808]' : 'bg-[#eaf7f3] text-[#0e7c66]'
                    }`}
                  >
                    {up ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    {h.subscription ? (
                      <Link
                        href={`/app/abonelikler/${h.subscription.id}`}
                        className="text-[12px] font-medium text-[#102a43] hover:underline"
                      >
                        {h.subscription.name}
                      </Link>
                    ) : (
                      <p className="text-[12px] font-medium text-[#94a3b8]">
                        Silinmiş abonelik
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-[#94a3b8]">
                      {formatDateTime(h.changed_at)}
                      {h.note ? ` · ${h.note}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-[#94a3b8] line-through">
                      {formatMoney(h.old_amount, h.currency)}
                    </p>
                    <p className="text-[12px] font-semibold text-[#102a43]">
                      {formatMoney(h.new_amount, h.currency)}
                    </p>
                  </div>
                  {pct !== null && (
                    <span
                      className={`w-16 rounded-full px-2 py-1 text-center text-[10px] font-medium ${
                        up ? 'bg-[#fff7e8] text-[#c27808]' : 'bg-[#eaf7f3] text-[#0e7c66]'
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
    </div>
  )
}
