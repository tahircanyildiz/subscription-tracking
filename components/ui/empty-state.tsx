import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#c9ded7] bg-[#f4fbf8] px-6 py-14 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-[#dff2ec] text-[#0e7c66]">
        <Icon size={20} />
      </div>
      <h3 className="mt-4 text-[14px] font-semibold text-[#102a43]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-[#718096]">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 flex h-9 items-center rounded-lg bg-[#0e7c66] px-4 text-[12px] font-semibold text-white transition hover:bg-[#096b57]"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
