'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useRef, useState } from 'react'

interface ToastItem {
  id: number
  message: string
  variant: 'success' | 'error'
}

const ToastContext = createContext<{
  toast: (message: string, variant?: 'success' | 'error') => void
} | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast, ToastProvider içinde kullanılmalı')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const toast = useCallback((message: string, variant: 'success' | 'error' = 'success') => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, message, variant }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-center gap-2.5 rounded-lg bg-[#102a43] px-4 py-3 text-[12px] font-medium text-white shadow-xl"
          >
            {t.variant === 'success' ? (
              <CheckCircle2 size={15} className="shrink-0 text-[#2dd4a8]" />
            ) : (
              <XCircle size={15} className="shrink-0 text-[#f87171]" />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
