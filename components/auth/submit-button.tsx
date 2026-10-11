'use client'

import { Loader2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'

export function SubmitButton({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0e7c66] px-4 text-[13px] font-semibold text-white shadow-[0_3px_8px_rgba(14,124,102,.2)] transition hover:bg-[#096b57] disabled:opacity-60 ${className}`}
    >
      {pending && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  )
}
