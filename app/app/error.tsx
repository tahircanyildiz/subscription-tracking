'use client'

import { RotateCcw, TriangleAlert } from 'lucide-react'
import { useEffect } from 'react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Hata ayrıntısı yalnızca geliştirici konsoluna yazılır
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#fecaca] bg-[#fef2f2] px-6 py-16 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-[#fee2e2] text-[#dc2626]">
        <TriangleAlert size={20} />
      </div>
      <h2 className="mt-4 text-[15px] font-semibold text-[#102a43]">Bir şeyler ters gitti</h2>
      <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-[#718096]">
        Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin; sorun sürerse daha
        sonra yeniden giriş yapın.
      </p>
      <button
        onClick={reset}
        className="mt-5 flex h-9 items-center gap-2 rounded-lg bg-[#0e7c66] px-4 text-[12px] font-semibold text-white transition hover:bg-[#096b57]"
      >
        <RotateCcw size={14} /> Tekrar dene
      </button>
    </div>
  )
}
