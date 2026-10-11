// Görüntüleme biçimlendiricileri (tr-TR).

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${currency}`
  }
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

export function formatDateShort(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(d)
}

export function formatDateTime(isoDateTime: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  }).format(new Date(isoDateTime))
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}%`
}

export function formatMonthLabel(yyyyMm: string): string {
  const d = new Date(`${yyyyMm}-01T00:00:00Z`)
  return new Intl.DateTimeFormat('tr-TR', { month: 'short', timeZone: 'UTC' }).format(d)
}

/** Kalan gün açıklaması: "Bugün", "Yarın", "5 gün sonra". */
export function formatDueLabel(days: number): string {
  if (days === 0) return 'Bugün'
  if (days === 1) return 'Yarın'
  if (days < 0) return `${-days} gün gecikti`
  return `${days} gün sonra`
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toLocaleUpperCase('tr-TR'))
    .join('')
}
