'use client'

import { useEffect, useRef } from 'react'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Onayla',
  cancelLabel = 'Vazgeç',
  destructive = false,
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        aria-label="Kapat"
        className="absolute inset-0 bg-[#102a43]/30"
        onClick={onCancel}
        tabIndex={-1}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm rounded-xl border border-[#e6ecea] bg-white p-5 shadow-2xl"
      >
        <h2 className="text-[15px] font-semibold text-[#102a43]">{title}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#718096]">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={pending}
            className="h-9 rounded-lg border border-[#e6ecea] px-3.5 text-[12px] font-semibold text-[#4a5568] transition hover:bg-[#f5f8f7]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className={`h-9 rounded-lg px-3.5 text-[12px] font-semibold text-white transition disabled:opacity-60 ${
              destructive
                ? 'bg-[#dc2626] hover:bg-[#b91c1c]'
                : 'bg-[#0e7c66] hover:bg-[#096b57]'
            }`}
          >
            {pending ? 'İşleniyor…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
