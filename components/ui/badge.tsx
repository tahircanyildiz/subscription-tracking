import { STATUS_LABELS } from '@/lib/schemas'
import type { SubscriptionStatus } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  active: 'bg-[#eaf7f3] text-[#0e7c66]',
  trial: 'bg-[#eff6ff] text-[#2563eb]',
  paused: 'bg-[#fff7e8] text-[#c27808]',
  cancelled: 'bg-[#fef2f2] text-[#dc2626]',
  expired: 'bg-[#f1f5f9] text-[#64748b]',
}

export function StatusBadge({
  status,
  className,
}: {
  status: SubscriptionStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium',
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-[#f1f5f9] px-2 py-1 text-[10px] font-medium text-[#64748b]',
        className,
      )}
    >
      {children}
    </span>
  )
}
