'use client'

import { Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { Input, Select } from '@/components/ui/field'
import { STATUSES, STATUS_LABELS } from '@/lib/schemas'
import type { Category } from '@/lib/supabase/types'

const SORT_OPTIONS = [
  { value: 'next_payment_date', label: 'Sonraki ödeme' },
  { value: 'name', label: 'Ad (A-Z)' },
  { value: 'amount', label: 'Tutar' },
  { value: 'created_at', label: 'Eklenme tarihi' },
] as const

export function SubscriptionFilters({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const debounceRef = useRef<number | null>(null)

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false })
  }

  // Arama girdisini 300ms geciktirerek URL'e yaz
  useEffect(() => {
    const current = searchParams.get('q') ?? ''
    if (q === current) return
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => setParam('q', q), 300)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ad veya sağlayıcı ara…"
          className="pl-9"
          aria-label="Abonelik ara"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex">
        <Select
          value={searchParams.get('kategori') ?? ''}
          onChange={(e) => setParam('kategori', e.target.value)}
          aria-label="Kategori filtresi"
          className="lg:w-40"
        >
          <option value="">Tüm kategoriler</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          value={searchParams.get('durum') ?? ''}
          onChange={(e) => setParam('durum', e.target.value)}
          aria-label="Durum filtresi"
          className="lg:w-36"
        >
          <option value="">Tüm durumlar</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select
          value={searchParams.get('sirala') ?? 'next_payment_date'}
          onChange={(e) => setParam('sirala', e.target.value)}
          aria-label="Sıralama"
          className="lg:w-40"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Select
          value={searchParams.get('arsiv') ?? ''}
          onChange={(e) => setParam('arsiv', e.target.value)}
          aria-label="Arşiv görünümü"
          className="lg:w-32"
        >
          <option value="">Güncel</option>
          <option value="1">Arşiv</option>
        </Select>
      </div>
    </div>
  )
}
