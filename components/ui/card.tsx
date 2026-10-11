import { cn } from '@/lib/utils'

export function Card({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-[#e6ecea] bg-white shadow-[0_1px_2px_rgba(16,42,67,.02)]',
        className,
      )}
    >
      {children}
    </section>
  )
}
